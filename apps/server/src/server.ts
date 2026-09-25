import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import crypto from "crypto";

import { runCode } from "./codeRunner.js";
import {
  runPythonTests,
  runProgramTests,
} from "./testRunner.js";
import { runAgent } from "./agent/agent.js";
import { verifyPatch } from "./agent/verifier.js";

dotenv.config();

const app = express();

const PORT = Number(process.env.PORT) || 4000;

app.use(
  cors({
    origin: "*",
  })
);

app.use(
  express.json({
    limit: "2mb",
  })
);

type IssueType = "error" | "warning" | "info";

type Issue = {
  type: IssueType;
  title: string;
  description: string;
  line?: number;
};

type TestCase = {
  name: string;
  input: string;
  expected: string;
};

type Submission = {
  id: string;
  code: string;
  language: string;
  fileName: string;
  createdAt: string;
};

type ReviewResult = {
  score: number;
  syntax: {
    status: "passed" | "failed";
    message: string;
  };
  tests: {
    passed: number;
    total: number;
    cases: Array<{
      name: string;
      input: string;
      expected: string;
      actual: string;
      status: "passed" | "failed";
      runtimeMs?: number;
    }>;
  };
  complexity: {
    time: string;
    space: string;
    explanation: string;
  };
  issues: Issue[];
  metrics: {
    lines: number;
    codeLines: number;
    functions: number;
    comments: number;
  };
  aiReview: string[];
};

const submissions = new Map<string, Submission>();
const reviews = new Map<string, ReviewResult>();

app.get("/api/health", (_req, res) => {
  return res.json({
    success: true,
    service: "SmartLab API",
    status: "running",
    timestamp: new Date().toISOString(),
  });
});

app.post("/api/execute", async (req, res) => {
  try {
    const {
      code,
      language = "python",
      stdin = "",
    } = req.body;

    if (typeof code !== "string" || !code.trim()) {
      return res.status(400).json({
        success: false,
        error: "Code is required.",
      });
    }

    if (typeof language !== "string") {
      return res.status(400).json({
        success: false,
        error: "Language must be a string.",
      });
    }

    const result = await runCode(
      code,
      language,
      3000,
      typeof stdin === "string" ? stdin : ""
    );

    return res.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("[SmartLab] Execution error:", error);

    return res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Execution failed.",
    });
  }
});

app.post("/api/test-python", async (req, res) => {
  try {
    const {
      code,
      functionName,
      testCases,
    } = req.body;

    if (
      typeof code !== "string" ||
      typeof functionName !== "string" ||
      !Array.isArray(testCases)
    ) {
      return res.status(400).json({
        success: false,
        error:
          "code, functionName and testCases are required.",
      });
    }

    const result = await runPythonTests(
      code,
      functionName,
      testCases
    );

    return res.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("[SmartLab] Python test error:", error);

    return res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Test execution failed.",
    });
  }
});

app.post("/api/review", async (req, res) => {
  try {
    const {
      code,
      language,
      fileName,
      testCases,
    } = req.body;

    if (
      typeof code !== "string" ||
      !code.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Code is required.",
      });
    }

    const normalizedLanguage =
      typeof language === "string"
        ? language.toLowerCase()
        : "unknown";

    const submissionId = crypto.randomUUID();

    const submission: Submission = {
      id: submissionId,
      code,
      language: normalizedLanguage,
      fileName:
        typeof fileName === "string"
          ? fileName
          : "unknown",
      createdAt: new Date().toISOString(),
    };

    const analysis = await analyzeCode(
      submission,
      Array.isArray(testCases)
        ? testCases
        : undefined
    );

    submissions.set(
      submissionId,
      submission
    );

    reviews.set(
      submissionId,
      analysis
    );

    console.log(
      `[SmartLab] Review created: ${submissionId}`
    );

    return res.status(201).json({
      success: true,
      submissionId,
      message: "Code reviewed successfully.",
      review: analysis,
    });
  } catch (error) {
    console.error("[SmartLab] Review error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to analyze code.",
      error:
        error instanceof Error
          ? error.message
          : "Unknown review error.",
    });
  }
});

app.get(
  "/api/review/:submissionId",
  (req, res) => {
    const submissionId =
      req.params.submissionId;

    if (
      typeof submissionId !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid submission id.",
      });
    }

    const submission =
      submissions.get(submissionId);

    const review =
      reviews.get(submissionId);

    if (!submission || !review) {
      return res.status(404).json({
        success: false,
        message: "Review not found.",
      });
    }

    return res.json({
      success: true,
      submission: {
        ...submission,
        ...review,
      },
    });
  }
);

app.get("/api/reviews", (_req, res) => {
  const result = Array.from(
    submissions.values()
  ).map((submission) => {
    const review =
      reviews.get(submission.id);

    return {
      id: submission.id,
      fileName: submission.fileName,
      language: submission.language,
      createdAt: submission.createdAt,
      score: review?.score ?? 0,
      tests: review?.tests ?? {
        passed: 0,
        total: 0,
        cases: [],
      },
      complexity:
        review?.complexity?.time ??
        "Unknown",
    };
  });

  return res.json({
    success: true,
    reviews: result,
  });
});

app.post("/api/agent", async (req, res) => {
  try {
    const {
      code,
      language = "python",
      question = "",
      issues = [],
    } = req.body;

    if (
      typeof code !== "string" ||
      !code.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Code is required.",
      });
    }

    if (typeof language !== "string") {
      return res.status(400).json({
        success: false,
        message: "Language is required.",
      });
    }

    const result = await runAgent({
      code,
      language,
      question:
        typeof question === "string"
          ? question
          : "",
      issues: Array.isArray(issues)
        ? issues
        : [],
    });

    return res.json(result);
  } catch (error) {
    console.error(
      "[SmartLab] Agent error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Agent execution failed.",
    });
  }
});

app.post(
  "/api/agent/fix",
  async (req, res) => {
    try {
      const {
        code,
        language = "python",
        issues = [],
      } = req.body;

      if (
        typeof code !== "string" ||
        !code.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Code is required.",
        });
      }

      if (typeof language !== "string") {
        return res.status(400).json({
          success: false,
          message: "Language is required.",
        });
      }

      const agentResult = await runAgent({
        code,
        language,
        question: "fix the code",
        issues: Array.isArray(issues)
          ? issues
          : [],
      });

      if (
        !agentResult.patch ||
        !agentResult.patch.success
      ) {
        return res.status(422).json({
          success: false,
          message:
            "SmartLab could not generate a safe automatic patch.",
          analysis: agentResult.analysis,
          patch:
            agentResult.patch || null,
          verification: null,
        });
      }

      const testExecution =
        await executeTests(
          code,
          language
        );

      const realTestCases =
        testExecution.cases.map(
          (testCase) => ({
            name: testCase.name,
            input: testCase.input,
            expected:
              testCase.expected,
          })
        );

      const verification =
        await verifyPatch(
          code,
          agentResult.patch.fixedCode,
          language,
          realTestCases
        );

      return res.json({
        success:
          verification.verified,
        message:
          verification.verified
            ? "SmartLab generated and verified the fix successfully."
            : "SmartLab generated a patch, but verification failed.",
        analysis:
          agentResult.analysis,
        patch:
          agentResult.patch,
        verification,
      });
    } catch (error) {
      console.error(
        "[SmartLab] Agent fix error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Automatic fix failed.",
      });
    }
  }
);

async function analyzeCode(
  submission: Submission,
  providedTestCases?: unknown[]
): Promise<ReviewResult> {
  const {
    code,
    language,
  } = submission;

  const lines = code.split("\n");

  const codeLines =
    lines.filter(
      (line) =>
        line.trim().length > 0
    ).length;

  const comments =
    lines.filter((line) => {
      const value = line.trim();

      if (language === "python") {
        return value.startsWith("#");
      }

      return (
        value.startsWith("//") ||
        value.startsWith("/*") ||
        value.startsWith("*")
      );
    }).length;

  const functions =
    detectFunctions(
      code,
      language
    );

  const syntax =
    detectSyntax(
      code,
      language
    );

  const complexity =
    detectComplexity(
      code,
      language
    );

  const issues =
    detectIssues(
      code,
      language,
      syntax,
      complexity
    );

  const tests =
    await executeTests(
      code,
      language,
      providedTestCases
    );

  const score =
    calculateScore(
      syntax,
      issues,
      tests,
      complexity
    );

  const aiReview =
    generateReview(
      language,
      complexity,
      issues,
      tests
    );

  return {
    score,
    syntax,
    tests,
    complexity,
    issues,
    metrics: {
      lines: lines.length,
      codeLines,
      functions,
      comments,
    },
    aiReview,
  };
}

async function executeTests(
  code: string,
  language: string,
  providedTestCases?: unknown[]
) {
  const normalizedLanguage =
    language.trim().toLowerCase();

  const normalizedProvided =
    Array.isArray(providedTestCases)
      ? normalizeTestCases(
          providedTestCases
        )
      : [];

  if (
    normalizedProvided.length > 0
  ) {
    const result =
      await runProgramTests(
        code,
        normalizedLanguage,
        normalizedProvided
      );

    return {
      passed: result.passed,
      total: result.total,
      cases: result.cases.map(
        (test) => ({
          name: test.name,
          input: test.input,
          expected:
            test.expected,
          actual: test.actual,
          status: test.status,
          runtimeMs:
            test.runtimeMs,
        })
      ),
    };
  }

  if (
    normalizedLanguage === "python"
  ) {
    const functionMatch =
      code.match(
        /^\s*def\s+([a-zA-Z_]\w*)\s*\(/m
      );

    if (functionMatch?.[1]) {
      const generated =
        generatePythonTests(
          functionMatch[1]
        );

      if (generated.length > 0) {
        const result =
          await runPythonTests(
            code,
            functionMatch[1],
            generated
          );

        return {
          passed: result.passed,
          total: result.total,
          cases: result.cases.map(
            (test) => ({
              name: test.name,
              input: test.input,
              expected:
                test.expected,
              actual: test.actual,
              status:
                test.status,
              runtimeMs:
                test.runtimeMs,
            })
          ),
        };
      }
    }
  }

  return {
    passed: 0,
    total: 0,
    cases: [],
  };
}

function normalizeTestCases(
  input: unknown[]
): TestCase[] {
  const result: TestCase[] = [];

  for (const item of input) {
    if (
      typeof item !== "object" ||
      item === null
    ) {
      continue;
    }

    const value =
      item as Record<
        string,
        unknown
      >;

    if (
      typeof value.name !== "string" ||
      typeof value.input !== "string" ||
      typeof value.expected !==
        "string"
    ) {
      continue;
    }

    result.push({
      name: value.name,
      input: value.input,
      expected: value.expected,
    });
  }

  return result;
}

function generatePythonTests(
  functionName: string
): TestCase[] {
  const name =
    functionName.toLowerCase();

  if (
    name.includes("add") ||
    name.includes("sum")
  ) {
    return [
      {
        name: "Positive numbers",
        input: "[2, 3]",
        expected: "5",
      },
      {
        name: "Zero values",
        input: "[0, 0]",
        expected: "0",
      },
      {
        name: "Negative and positive",
        input: "[-2, 5]",
        expected: "3",
      },
    ];
  }

  if (
    name.includes("multiply") ||
    name.includes("product")
  ) {
    return [
      {
        name: "Positive numbers",
        input: "[2, 3]",
        expected: "6",
      },
      {
        name: "Zero",
        input: "[0, 5]",
        expected: "0",
      },
      {
        name: "Negative number",
        input: "[-2, 3]",
        expected: "-6",
      },
    ];
  }

  if (
    name.includes("square")
  ) {
    return [
      {
        name: "Positive number",
        input: "[5]",
        expected: "25",
      },
      {
        name: "Zero",
        input: "[0]",
        expected: "0",
      },
      {
        name: "Negative number",
        input: "[-4]",
        expected: "16",
      },
    ];
  }

  if (
    name.includes("factorial")
  ) {
    return [
      {
        name: "Small number",
        input: "[5]",
        expected: "120",
      },
      {
        name: "Zero",
        input: "[0]",
        expected: "1",
      },
      {
        name: "One",
        input: "[1]",
        expected: "1",
      },
    ];
  }

  if (
    name.includes("max") ||
    name.includes("maximum")
  ) {
    return [
      {
        name: "Normal array",
        input: "[[1, 5, 3]]",
        expected: "5",
      },
      {
        name: "Negative array",
        input: "[[-5, -2, -8]]",
        expected: "-2",
      },
    ];
  }

  if (
    name.includes("min") ||
    name.includes("minimum")
  ) {
    return [
      {
        name: "Normal array",
        input: "[[1, 5, 3]]",
        expected: "1",
      },
      {
        name: "Negative array",
        input: "[[-5, -2, -8]]",
        expected: "-8",
      },
    ];
  }

  if (
    name.includes("reverse")
  ) {
    return [
      {
        name: "Normal list",
        input: "[[1, 2, 3]]",
        expected: "[3, 2, 1]",
      },
      {
        name: "Single element",
        input: "[[5]]",
        expected: "[5]",
      },
    ];
  }

  if (
    name.includes("binarysearch") ||
    name.includes("binary_search")
  ) {
    return [
      {
        name: "Existing element",
        input: "[[1, 2, 3, 4, 5], 3]",
        expected: "2",
      },
      {
        name: "Missing element",
        input: "[[1, 2, 3, 4, 5], 9]",
        expected: "-1",
      },
    ];
  }

  return [];
}

function detectSyntax(
  code: string,
  language: string
): {
  status: "passed" | "failed";
  message: string;
} {
  if (!code.trim()) {
    return {
      status: "failed",
      message: "Source code is empty.",
    };
  }

  if (
    language === "javascript" ||
    language === "typescript" ||
    language === "javascriptreact" ||
    language === "typescriptreact"
  ) {
    const open =
      (code.match(/{/g) || [])
        .length;

    const close =
      (code.match(/}/g) || [])
        .length;

    if (open !== close) {
      return {
        status: "failed",
        message:
          "Unbalanced curly braces detected.",
      };
    }
  }

  if (language === "python") {
    const lines = code.split("\n");

    for (
      let i = 0;
      i < lines.length;
      i++
    ) {
      const line =
        lines[i] ?? "";

      if (
        line.trim().startsWith("def ") &&
        !line.includes(":")
      ) {
        return {
          status: "failed",
          message:
            `Possible syntax error near line ${i + 1}.`,
        };
      }
    }
  }

  return {
    status: "passed",
    message:
      "No obvious syntax problems detected.",
  };
}

function detectFunctions(
  code: string,
  language: string
): number {
  if (language === "python") {
    return (
      code.match(
        /^\s*def\s+\w+/gm
      ) || []
    ).length;
  }

  return (
    code.match(
      /\bfunction\s+\w+\s*\(|\b\w+\s*\([^)]*\)\s*\{/g
    ) || []
  ).length;
}

function detectComplexity(
  code: string,
  _language: string
): {
  time: string;
  space: string;
  explanation: string;
} {
  const lines =
    code.split("\n");

  const loopCount =
    lines.filter((line) =>
      /\b(for|while)\b/.test(
        line
      )
    ).length;

  const nestedPattern =
    /for[\s\S]{0,500}(for|while)|while[\s\S]{0,500}(for|while)/;

  if (
    nestedPattern.test(code)
  ) {
    return {
      time: "O(n²)",
      space: "O(1)",
      explanation:
        "Nested iteration was detected. In the general case, the algorithm may perform work proportional to n².",
    };
  }

  if (
    /binary_search|binarysearch|bisect|mid\s*=|left\s*=|right\s*=/i.test(
      code
    )
  ) {
    return {
      time: "O(log n)",
      space: "O(1)",
      explanation:
        "The implementation contains patterns commonly associated with binary search.",
    };
  }

  if (loopCount > 0) {
    return {
      time: "O(n)",
      space: "O(1)",
      explanation:
        "A linear iteration was detected. The algorithm appears to scale approximately with the input size.",
    };
  }

  return {
    time: "O(1)",
    space: "O(1)",
    explanation:
      "No obvious input-sized iteration was detected.",
  };
}

function detectIssues(
  code: string,
  language: string,
  syntax: {
    status: "passed" | "failed";
    message: string;
  },
  complexity: {
    time: string;
    space: string;
    explanation: string;
  }
): Issue[] {
  const issues: Issue[] = [];

  if (
    syntax.status === "failed"
  ) {
    issues.push({
      type: "error",
      title:
        "Possible syntax problem",
      description:
        syntax.message,
    });
  }

  if (
    complexity.time === "O(n²)"
  ) {
    issues.push({
      type: "warning",
      title:
        "Potential quadratic complexity",
      description:
        "Nested loops were detected. Consider whether the algorithm can be optimized.",
    });
  }

  if (
    language === "python" &&
    code.includes("[") &&
    code.includes("]")
  ) {
    issues.push({
      type: "info",
      title:
        "Edge-case handling",
      description:
        "Consider explicitly handling empty collections and boundary inputs.",
    });
  }

  if (
    /\bprint\s*\(/.test(code)
  ) {
    issues.push({
      type: "info",
      title:
        "Debug output detected",
      description:
        "Consider removing debug output before final submission.",
    });
  }

  return issues;
}

function calculateScore(
  syntax: {
    status: "passed" | "failed";
  },
  issues: Issue[],
  tests: {
    passed: number;
    total: number;
  },
  complexity: {
    time: string;
  }
): number {
  let score = 100;

  if (
    syntax.status === "failed"
  ) {
    score -= 30;
  }

  score -=
    issues.filter(
      (issue) =>
        issue.type === "error"
    ).length * 15;

  score -=
    issues.filter(
      (issue) =>
        issue.type === "warning"
    ).length * 7;

  if (tests.total > 0) {
    const ratio =
      tests.passed /
      tests.total;

    score -= Math.round(
      (1 - ratio) * 20
    );
  }

  if (
    complexity.time === "O(n²)"
  ) {
    score -= 5;
  }

  return Math.max(
    0,
    Math.min(100, score)
  );
}

function generateReview(
  language: string,
  complexity: {
    time: string;
    space: string;
  },
  issues: Issue[],
  tests: {
    passed: number;
    total: number;
  }
): string[] {
  const result: string[] = [];

  result.push(
    `The submission is written in ${language}.`
  );

  result.push(
    `Detected time complexity is ${complexity.time} and space complexity is ${complexity.space}.`
  );

  if (tests.total > 0) {
    result.push(
      `${tests.passed} of ${tests.total} real execution tests passed.`
    );
  } else {
    result.push(
      "No executable test cases were generated for this submission."
    );
  }

  if (issues.length > 0) {
    result.push(
      `The analysis identified ${issues.length} potential issue(s) that should be reviewed.`
    );
  } else {
    result.push(
      "No obvious issues were detected by the initial static analysis."
    );
  }

  result.push(
    "The execution results can be used as evidence by the SmartLab AI agent when explaining the code."
  );

  return result;
}

app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err);

    return res.status(500).json({
      success: false,
      message:
        "Internal SmartLab server error.",
    });
  }
);

app.listen(PORT, () => {
  console.log(
    `SmartLab API running on http://localhost:${PORT}`
  );
});