import {
    generatePatch,
    type CodeIssue,
    type CodePatch,
  } from "./patchGenerator.js";
  
  export type AgentMessage = {
    role: "user" | "assistant";
    content: string;
  };
  
  export type AgentRequest = {
    code: string;
    language: string;
    question?: string;
    issues?: CodeIssue[];
    messages?: AgentMessage[];
  };
  
  export type AgentAnalysis = {
    summary: string;
    issues: CodeIssue[];
    suggestions: string[];
    explanation: string;
  };
  
  export type AgentResponse = {
    success: boolean;
    message: string;
    analysis: AgentAnalysis;
    patch: CodePatch | null;
  };
  
  function normalizeLanguage(language: string): string {
    const value = language.trim().toLowerCase();
  
    if (value === "py" || value === "python3") return "python";
    if (value === "js" || value === "jsx" || value === "node") return "javascript";
    if (value === "ts" || value === "tsx") return "typescript";
    if (value === "c++") return "cpp";
  
    return value;
  }
  
  function lineOf(code: string, index: number): number {
    return code.slice(0, index).split("\n").length;
  }
  
  function findLine(code: string, pattern: RegExp): number | undefined {
    const lines = code.split("\n");
  
    for (let i = 0; i < lines.length; i++) {
      pattern.lastIndex = 0;
  
      if (pattern.test(lines[i] ?? "")) {
        return i + 1;
      }
    }
  
    return undefined;
  }
  
  function issue(
    type: CodeIssue["type"],
    title: string,
    description: string,
    line?: number
  ): CodeIssue {
    const value: CodeIssue = {
      type,
      title,
      description,
    };
  
    if (line !== undefined) {
      value.line = line;
    }
  
    return value;
  }
  
  function pythonAnalysis(code: string, question: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const lines = code.split("\n");
  
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? "";
      const trimmed = line.trim();
  
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }
  
      if (/^\s*def\s+\w+\s*\([^)]*\)\s*$/.test(line)) {
        issues.push(
          issue(
            "error",
            "Invalid function declaration",
            "The Python function declaration is missing ':'.",
            i + 1
          )
        );
      }
  
      if (/^\s*(if|elif|else|for|while|try|except|finally|class|with)\b.*[^:]\s*$/.test(line)) {
        issues.push(
          issue(
            "error",
            "Possible missing colon",
            "This Python compound statement appears to be missing ':'.",
            i + 1
          )
        );
      }
  
      if (/\bprint\s+[^(]/.test(line) && !line.includes("print(")) {
        issues.push(
          issue(
            "error",
            "Invalid print syntax",
            "The source appears to use Python 2 print syntax while the SmartLab runtime expects Python 3.",
            i + 1
          )
        );
      }
  
      if (/\breturn\s+\w+\s*-\s*\w+/.test(line)) {
        const before = lines.slice(Math.max(0, i - 8), i).join("\n");
        if (/\b(def\s+)?(add|sum|addition)\s*\(/i.test(before)) {
          issues.push(
            issue(
              "error",
              "Possible incorrect addition logic",
              "The function appears to represent addition, but the return expression subtracts the operands.",
              i + 1
            )
          );
        }
      }
  
      if (/\breturn\s+\w+\s*\+\s*\w+/.test(line)) {
        const before = lines.slice(Math.max(0, i - 8), i).join("\n");
        if (/\b(def\s+)?(multiply|multiplication|product)\s*\(/i.test(before)) {
          issues.push(
            issue(
              "error",
              "Possible incorrect multiplication logic",
              "The function appears to represent multiplication, but the return expression adds the operands.",
              i + 1
            )
          );
        }
      }
  
      if (/\breturn\s+[^#\n]*\/\s*0\b/.test(line)) {
        issues.push(
          issue(
            "error",
            "Division by zero",
            "The return expression divides by zero.",
            i + 1
          )
        );
      }
  
      if (/\bdef\s+(add|sum|multiply|product|max|min|factorial|square|average|mean)\s*\(/i.test(line)) {
        const block = lines.slice(i, Math.min(lines.length, i + 20)).join("\n");
  
        if (!/\breturn\b/.test(block)) {
          issues.push(
            issue(
              "warning",
              "Possible missing return statement",
              "This value-producing function does not appear to return a value.",
              i + 1
            )
          );
        }
      }
  
      if (/\binput\s*\(/.test(line) && /int\s*\(\s*input\s*\(/.test(line) === false) {
        issues.push(
          issue(
            "warning",
            "Input may remain a string",
            "input() returns a string. Numeric input usually needs explicit conversion.",
            i + 1
          )
        );
      }
  
      if (/range\s*\(\s*len\s*\(\s*\w+\s*\)\s*\)/.test(line) && /\[\s*i\s*[\+\-]\s*1\s*\]/.test(line)) {
        issues.push(
          issue(
            "error",
            "Possible index boundary error",
            "The loop may access one element beyond the valid index range.",
            i + 1
          )
        );
      }
  
      if (/while\s+True\s*:/.test(line)) {
        const block = lines.slice(i, Math.min(lines.length, i + 30)).join("\n");
  
        if (!/\bbreak\b/.test(block) && !/\breturn\b/.test(block)) {
          issues.push(
            issue(
              "warning",
              "Possible infinite loop",
              "The while True loop does not contain an obvious break or return path.",
              i + 1
            )
          );
        }
      }
    }
  
    const functionMatches = [...code.matchAll(/^\s*def\s+([A-Za-z_]\w*)\s*\(([^)]*)\)\s*:/gm)];
  
    for (const match of functionMatches) {
      const name = match[1] ?? "";
      const start = match.index ?? 0;
      const body = code.slice(start);
  
      if (
        !/\breturn\b/.test(body) &&
        /(add|sum|multiply|product|square|max|min|factorial|average|mean)/i.test(name)
      ) {
        const line = lineOf(code, start);
  
        issues.push(
          issue(
            "warning",
            "Possible missing return statement",
            `The function "${name}" appears to calculate a value but does not return one.`,
            line
          )
        );
      }
    }
  
    if (
      question.toLowerCase().includes("fix") &&
      /\b(add|sum|addition)\b/i.test(code) &&
      /\breturn\s+\w+\s*-\s*\w+/i.test(code)
    ) {
      const line = findLine(code, /\breturn\s+\w+\s*-\s*\w+/i);
  
      issues.push(
        issue(
          "error",
          "Likely addition bug",
          "The requested fix concerns this function and its return expression uses subtraction.",
          line
        )
      );
    }
  
    return issues;
  }
  
  function javascriptAnalysis(code: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const lines = code.split("\n");
  
    const openBraces = (code.match(/{/g) || []).length;
    const closeBraces = (code.match(/}/g) || []).length;
  
    if (openBraces !== closeBraces) {
      issues.push(
        issue(
          "error",
          "Unbalanced curly braces",
          "The number of opening and closing curly braces does not match."
        )
      );
    }
  
    const openParens = (code.match(/\(/g) || []).length;
    const closeParens = (code.match(/\)/g) || []).length;
  
    if (openParens !== closeParens) {
      issues.push(
        issue(
          "error",
          "Unbalanced parentheses",
          "The number of opening and closing parentheses does not match."
        )
      );
    }
  
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? "";
  
      if (/\bvar\s+/.test(line)) {
        issues.push(
          issue(
            "warning",
            "Use let or const",
            "Prefer let or const instead of var in modern JavaScript and TypeScript.",
            i + 1
          )
        );
      }
  
      if (/\breturn\s+\w+\s*-\s*\w+/.test(line)) {
        const before = lines.slice(Math.max(0, i - 8), i).join("\n");
  
        if (/\b(function\s+)?(add|sum|addition)\b/i.test(before)) {
          issues.push(
            issue(
              "error",
              "Possible incorrect addition logic",
              "The function appears to represent addition, but the return expression subtracts the operands.",
              i + 1
            )
          );
        }
      }
  
      if (/\breturn\s+\w+\s*\+\s*\w+/.test(line)) {
        const before = lines.slice(Math.max(0, i - 8), i).join("\n");
  
        if (/\b(function\s+)?(multiply|multiplication|product)\b/i.test(before)) {
          issues.push(
            issue(
              "error",
              "Possible incorrect multiplication logic",
              "The function appears to represent multiplication, but the return expression adds the operands.",
              i + 1
            )
          );
        }
      }
  
      if (/\/\s*0\b/.test(line)) {
        issues.push(
          issue(
            "error",
            "Division by zero",
            "The expression divides by zero.",
            i + 1
          )
        );
      }
    }
  
    return issues;
  }
  
  function genericAnalysis(code: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const lines = code.split("\n");
  
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? "";
  
      if (/\/\s*0\b/.test(line)) {
        issues.push(
          issue(
            "error",
            "Division by zero",
            "The expression contains division by zero.",
            i + 1
          )
        );
      }
    }
  
    return issues;
  }
  
  function deduplicateIssues(issues: CodeIssue[]): CodeIssue[] {
    const seen = new Set<string>();
    const result: CodeIssue[] = [];
  
    for (const item of issues) {
      const key = [
        item.type,
        item.title,
        item.line ?? 0,
        item.description,
      ].join("|");
  
      if (seen.has(key)) {
        continue;
      }
  
      seen.add(key);
      result.push(item);
    }
  
    return result;
  }
  
  function buildSuggestions(issues: CodeIssue[]): string[] {
    const suggestions: string[] = [];
  
    for (const item of issues) {
      if (item.type === "error") {
        suggestions.push(`Fix "${item.title}" before applying the code.`);
      } else if (item.type === "warning") {
        suggestions.push(
          `Review "${item.title}" and confirm that the current behavior is intentional.`
        );
      }
    }
  
    if (suggestions.length === 0) {
      suggestions.push(
        "Run the program with representative inputs.",
        "Test boundary and edge cases.",
        "Verify the output against the expected behavior."
      );
    }
  
    return [...new Set(suggestions)];
  }
  
  function buildExplanation(
    issues: CodeIssue[],
    language: string
  ): string {
    if (issues.length === 0) {
      return `SmartLab analyzed the ${normalizeLanguage(language)} source but did not find a high-confidence defect that the current rule-based patch generator can safely modify.`;
    }
  
    const errors = issues.filter((item) => item.type === "error").length;
    const warnings = issues.filter((item) => item.type === "warning").length;
  
    const parts: string[] = [];
  
    if (errors > 0) {
      parts.push(`${errors} error candidate${errors === 1 ? "" : "s"}`);
    }
  
    if (warnings > 0) {
      parts.push(`${warnings} warning${warnings === 1 ? "" : "s"}`);
    }
  
    return `SmartLab found ${parts.join(
      " and "
    )}. Candidate patches are generated only for patterns supported by the current patch generator and must pass verification before application.`;
  }
  
  function shouldGeneratePatch(
    question: string,
    issues: CodeIssue[]
  ): boolean {
    const text = question.toLowerCase();
  
    if (
      text.includes("fix") ||
      text.includes("correct") ||
      text.includes("repair") ||
      text.includes("solve") ||
      text.includes("debug") ||
      text.includes("apply")
    ) {
      return true;
    }
  
    return issues.some((item) => item.type === "error");
  }
  
  export async function runAgent(
    request: AgentRequest
  ): Promise<AgentResponse> {
    const code =
      typeof request.code === "string"
        ? request.code
        : "";
  
    const language =
      typeof request.language === "string"
        ? request.language
        : "python";
  
    const question =
      typeof request.question === "string"
        ? request.question
        : "";
  
    const suppliedIssues = Array.isArray(request.issues)
      ? request.issues
      : [];
  
    if (!code.trim()) {
      return {
        success: false,
        message: "No source code was provided.",
        analysis: {
          summary: "SmartLab cannot analyze an empty source file.",
          issues: [
            issue(
              "error",
              "Empty source code",
              "Provide source code before asking SmartLab to review or fix it."
            ),
          ],
          suggestions: ["Add executable code to the file."],
          explanation: "There is no source code available for analysis.",
        },
        patch: null,
      };
    }
  
    const normalized = normalizeLanguage(language);
  
    let detectedIssues: CodeIssue[] = [];
  
    if (normalized === "python") {
      detectedIssues = pythonAnalysis(code, question);
    } else if (
      normalized === "javascript" ||
      normalized === "typescript"
    ) {
      detectedIssues = javascriptAnalysis(code);
    } else {
      detectedIssues = genericAnalysis(code);
    }
  
    const allIssues = deduplicateIssues([
      ...suppliedIssues,
      ...detectedIssues,
    ]);
  
    let patch: CodePatch | null = null;
  
    if (shouldGeneratePatch(question, allIssues)) {
      patch = generatePatch(code, language, allIssues);
    }
  
    const summary =
      allIssues.length === 0
        ? "No high-confidence defect was detected by the current SmartLab analysis."
        : `${allIssues.length} potential issue${
            allIssues.length === 1 ? "" : "s"
          } detected in the source code.`;
  
    return {
      success: true,
      message: patch?.success
        ? "SmartLab analyzed the code and generated a candidate fix."
        : "SmartLab analyzed the code successfully.",
      analysis: {
        summary,
        issues: allIssues,
        suggestions: buildSuggestions(allIssues),
        explanation: buildExplanation(allIssues, language),
      },
      patch,
    };
  }
  