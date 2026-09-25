import { runCode } from "./codeRunner";

export type RealTestCase = {
  name: string;
  input: string;
  expected: string;
};

export type RealTestResult = {
  name: string;
  input: string;
  expected: string;
  actual: string;
  status: "passed" | "failed";
  runtimeMs: number;
  error?: string;
};

export type TestRunResult = {
  passed: number;
  total: number;
  cases: RealTestResult[];
};

function normalizeOutput(
  value: string
): string {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  try {
    return JSON.stringify(
      JSON.parse(trimmed)
    );
  } catch {
    return trimmed;
  }
}

function createPythonHarness(
  code: string,
  functionName: string,
  testCase: RealTestCase
): string {
  return `
${code}

import json

try:
    args = json.loads(${JSON.stringify(
      testCase.input
    )})

    result = ${functionName}(*args)

    print("__SMARTLAB_RESULT__")
    print(json.dumps(result))

except Exception as e:
    print("__SMARTLAB_ERROR__")
    print(
        type(e).__name__
        + ": "
        + str(e)
    )
`;
}

async function runSinglePythonTest(
  code: string,
  functionName: string,
  testCase: RealTestCase
): Promise<RealTestResult> {
  const harness =
    createPythonHarness(
      code,
      functionName,
      testCase
    );

  const result =
    await runCode(
      harness,
      "python"
    );

  const output =
    result.stdout.trim();

  let actual = "";
  let error:
    | string
    | undefined;

  if (
    output.includes(
      "__SMARTLAB_ERROR__"
    )
  ) {
    const parts =
      output.split(
        "__SMARTLAB_ERROR__"
      );

    error =
      parts[1]?.trim() ||
      "Unknown execution error";
  } else if (
    output.includes(
      "__SMARTLAB_RESULT__"
    )
  ) {
    const parts =
      output.split(
        "__SMARTLAB_RESULT__"
      );

    actual =
      parts[1]?.trim() || "";
  } else {
    actual = output;
  }

  if (result.timedOut) {
    error =
      "Execution timed out.";
  }

  if (
    result.stderr &&
    !error
  ) {
    error =
      result.stderr.trim();
  }

  const normalizedActual =
    normalizeOutput(actual);

  const normalizedExpected =
    normalizeOutput(
      testCase.expected
    );

  const passed =
    result.exitCode === 0 &&
    !result.timedOut &&
    !error &&
    normalizedActual ===
      normalizedExpected;

  return {
    name: testCase.name,
    input: testCase.input,
    expected:
      testCase.expected,
    actual:
      actual ||
      error ||
      "",
    status:
      passed
        ? "passed"
        : "failed",
    runtimeMs:
      result.runtimeMs,
    ...(error
      ? { error }
      : {}),
  };
}

export async function runPythonTests(
  code: string,
  functionName: string,
  testCases: RealTestCase[]
): Promise<TestRunResult> {
  const cases: RealTestResult[] =
    [];

  for (const testCase of testCases) {
    const result =
      await runSinglePythonTest(
        code,
        functionName,
        testCase
      );

    cases.push(result);
  }

  const passed =
    cases.filter(
      (testCase) =>
        testCase.status ===
        "passed"
    ).length;

  return {
    passed,
    total: cases.length,
    cases,
  };
}

export async function runProgramTests(
  code: string,
  language: string,
  testCases: RealTestCase[]
): Promise<TestRunResult> {
  const normalizedLanguage =
    language
      .trim()
      .toLowerCase();

  if (
    normalizedLanguage ===
      "python" ||
    normalizedLanguage ===
      "py"
  ) {
    const functionMatch =
      code.match(
        /^\s*def\s+([a-zA-Z_]\w*)\s*\(/m
      );

    if (!functionMatch) {
      return {
        passed: 0,
        total: 0,
        cases: [],
      };
    }

    return runPythonTests(
      code,
      functionMatch[1],
      testCases
    );
  }

  return {
    passed: 0,
    total: 0,
    cases: [],
  };
}