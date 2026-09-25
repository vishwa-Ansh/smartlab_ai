import { runCode } from "./codeRunner.js";

export type RealTestCase = {
  name: string;
  input: string;
  expected: string;
};

export type TestCaseResult = {
  name: string;
  input: string;
  expected: string;
  actual: string;
  status: "passed" | "failed";
  runtimeMs: number;
};

export type TestRunResult = {
  passed: number;
  total: number;
  cases: TestCaseResult[];
};

function normalizeOutput(
  value: string
): string {
  return value
    .replace(/\r\n/g, "\n")
    .trim();
}

function safeJsonParse(
  value: string
): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

function extractSmartLabOutput(
  stdout: string
): string {
  const normalized =
    normalizeOutput(stdout);

  if (!normalized) {
    return "";
  }

  const lines =
    normalized.split("\n");

  const smartLabLine =
    lines.find((line) =>
      line.startsWith(
        "SMARTLAB_RESULT:"
      )
    );

  if (smartLabLine) {
    return normalizeOutput(
      smartLabLine.replace(
        "SMARTLAB_RESULT:",
        ""
      )
    );
  }

  return normalized;
}

function buildPythonHarness(
  code: string,
  functionName: string,
  input: string
): string {
  const encodedCode =
    Buffer.from(code).toString(
      "base64"
    );

  const encodedInput =
    Buffer.from(input).toString(
      "base64"
    );

  return `
import base64
import json

SOURCE = base64.b64decode("${encodedCode}").decode("utf-8")
INPUT = base64.b64decode("${encodedInput}").decode("utf-8")

namespace = {
    "__name__": "__smartlab__"
}

exec(SOURCE, namespace)

value = json.loads(INPUT)

if isinstance(value, list):
    result = namespace["${functionName}"](*value)
else:
    result = namespace["${functionName}"](value)

print("SMARTLAB_RESULT:" + json.dumps(result, default=str))
`;
}

function buildJavaScriptHarness(
  code: string,
  functionName: string,
  input: string
): string {
  const encodedCode =
    Buffer.from(code).toString(
      "base64"
    );

  const encodedInput =
    Buffer.from(input).toString(
      "base64"
    );

  return `
const source = Buffer.from(
  "${encodedCode}",
  "base64"
).toString("utf8");

const input = JSON.parse(
  Buffer.from(
    "${encodedInput}",
    "base64"
  ).toString("utf8")
);

const moduleObject = {
  exports: {}
};

const module = moduleObject;

const exports = module.exports;

eval(source);

let fn =
  typeof ${functionName} === "function"
    ? ${functionName}
    : undefined;

if (!fn && typeof module.exports === "function") {
  fn = module.exports;
}

if (
  !fn &&
  module.exports &&
  typeof module.exports["${functionName}"] === "function"
) {
  fn = module.exports["${functionName}"];
}

if (!fn) {
  throw new Error(
    "Function ${functionName} was not found."
  );
}

const result =
  Array.isArray(input)
    ? fn(...input)
    : fn(input);

console.log(
  "SMARTLAB_RESULT:" +
  JSON.stringify(result)
);
`;
}

function parseFunctionArguments(
  input: string
): unknown {
  const parsed =
    safeJsonParse(input);

  if (parsed !== undefined) {
    return parsed;
  }

  return input;
}

function findPythonFunction(
  code: string
): string | undefined {
  const match =
    code.match(
      /^\s*def\s+([a-zA-Z_]\w*)\s*\(/m
    );

  return match?.[1];
}

function findJavaScriptFunction(
  code: string
): string | undefined {
  const declaration =
    code.match(
      /\bfunction\s+([a-zA-Z_$][\w$]*)\s*\(/
    );

  if (declaration?.[1]) {
    return declaration[1];
  }

  const arrow =
    code.match(
      /\b(?:const|let|var)\s+([a-zA-Z_$][\w$]*)\s*=\s*(?:async\s*)?\(/
    );

  if (arrow?.[1]) {
    return arrow[1];
  }

  return undefined;
}

export async function runPythonTests(
  code: string,
  functionName: string,
  testCases: RealTestCase[]
): Promise<TestRunResult> {
  const cases: TestCaseResult[] = [];

  for (const testCase of testCases) {
    const harness =
      buildPythonHarness(
        code,
        functionName,
        testCase.input
      );

    const result =
      await runCode(
        harness,
        "python",
        3000
      );

    const actual =
      extractSmartLabOutput(
        result.stdout
      );

    const expected =
      normalizeOutput(
        testCase.expected
      );

    const passed =
      !result.timedOut &&
      result.exitCode === 0 &&
      actual === expected;

    cases.push({
      name: testCase.name,
      input: testCase.input,
      expected: testCase.expected,
      actual:
        actual ||
        normalizeOutput(
          result.stderr
        ),
      status:
        passed
          ? "passed"
          : "failed",
      runtimeMs:
        result.runtimeMs,
    });
  }

  return {
    passed: cases.filter(
      (item) =>
        item.status === "passed"
    ).length,
    total: cases.length,
    cases,
  };
}

export async function runJavaScriptTests(
  code: string,
  functionName: string,
  testCases: RealTestCase[]
): Promise<TestRunResult> {
  const cases: TestCaseResult[] = [];

  for (const testCase of testCases) {
    const harness =
      buildJavaScriptHarness(
        code,
        functionName,
        testCase.input
      );

    const result =
      await runCode(
        harness,
        "javascript",
        3000
      );

    const actual =
      extractSmartLabOutput(
        result.stdout
      );

    const expected =
      normalizeOutput(
        testCase.expected
      );

    const passed =
      !result.timedOut &&
      result.exitCode === 0 &&
      actual === expected;

    cases.push({
      name: testCase.name,
      input: testCase.input,
      expected: testCase.expected,
      actual:
        actual ||
        normalizeOutput(
          result.stderr
        ),
      status:
        passed
          ? "passed"
          : "failed",
      runtimeMs:
        result.runtimeMs,
    });
  }

  return {
    passed: cases.filter(
      (item) =>
        item.status === "passed"
    ).length,
    total: cases.length,
    cases,
  };
}

async function runSingleProgramTest(
  code: string,
  language: string,
  testCase: RealTestCase
): Promise<TestCaseResult> {
  const result =
    await runCode(
      code,
      language,
      3000,
      testCase.input
    );

  const actual =
    normalizeOutput(
      result.stdout
    );

  const expected =
    normalizeOutput(
      testCase.expected
    );

  const passed =
    !result.timedOut &&
    result.exitCode === 0 &&
    actual === expected;

  return {
    name: testCase.name,
    input: testCase.input,
    expected: testCase.expected,
    actual:
      actual ||
      normalizeOutput(
        result.stderr
      ),
    status:
      passed
        ? "passed"
        : "failed",
    runtimeMs:
      result.runtimeMs,
  };
}

export async function runProgramTests(
  code: string,
  language: string,
  testCases: RealTestCase[]
): Promise<TestRunResult> {
  const normalized =
    language
      .trim()
      .toLowerCase();

  if (
    normalized === "python" ||
    normalized === "py"
  ) {
    const functionName =
      findPythonFunction(code);

    if (functionName) {
      return runPythonTests(
        code,
        functionName,
        testCases
      );
    }
  }

  if (
    normalized === "javascript" ||
    normalized === "js"
  ) {
    const functionName =
      findJavaScriptFunction(
        code
      );

    if (functionName) {
      return runJavaScriptTests(
        code,
        functionName,
        testCases
      );
    }
  }

  const cases: TestCaseResult[] = [];

  for (const testCase of testCases) {
    const result =
      await runSingleProgramTest(
        code,
        normalized,
        testCase
      );

    cases.push(result);
  }

  return {
    passed: cases.filter(
      (item) =>
        item.status === "passed"
    ).length,
    total: cases.length,
    cases,
  };
}

export async function runGenericTests(
  code: string,
  language: string,
  testCases: RealTestCase[]
): Promise<TestRunResult> {
  const cases: TestCaseResult[] = [];

  for (const testCase of testCases) {
    const result =
      await runSingleProgramTest(
        code,
        language,
        testCase
      );

    cases.push(result);
  }

  return {
    passed: cases.filter(
      (item) =>
        item.status === "passed"
    ).length,
    total: cases.length,
    cases,
  };
}