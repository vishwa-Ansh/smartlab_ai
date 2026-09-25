import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export type ExecutionResult = {
  stdout: string;
  stderr: string;
  exitCode: number;
  runtimeMs: number;
  timedOut: boolean;
};

type LanguageConfig = {
  image: string;
  fileName: string;
  command: string;
};

const LANGUAGE_CONFIG: Record<
  string,
  LanguageConfig
> = {
  python: {
    image: "python:3.12-alpine",
    fileName: "main.py",
    command:
      "python /tmp/main.py",
  },

  py: {
    image: "python:3.12-alpine",
    fileName: "main.py",
    command:
      "python /tmp/main.py",
  },

  javascript: {
    image: "node:22-alpine",
    fileName: "main.js",
    command:
      "node /tmp/main.js",
  },

  js: {
    image: "node:22-alpine",
    fileName: "main.js",
    command:
      "node /tmp/main.js",
  },

  typescript: {
    image: "node:22-alpine",
    fileName: "main.ts",
    command:
      "node /tmp/main.ts",
  },

  ts: {
    image: "node:22-alpine",
    fileName: "main.ts",
    command:
      "node /tmp/main.ts",
  },

  cpp: {
    image: "gcc:14",
    fileName: "main.cpp",
    command:
      "g++ -std=c++17 -O2 /tmp/main.cpp -o /tmp/main && /tmp/main",
  },

  "c++": {
    image: "gcc:14",
    fileName: "main.cpp",
    command:
      "g++ -std=c++17 -O2 /tmp/main.cpp -o /tmp/main && /tmp/main",
  },

  c: {
    image: "gcc:14",
    fileName: "main.c",
    command:
      "gcc -std=c17 -O2 /tmp/main.c -o /tmp/main && /tmp/main",
  },

  java: {
    image: "eclipse-temurin:21-jdk",
    fileName: "Main.java",
    command:
      "javac /tmp/Main.java && java -cp /tmp Main",
  },
};

function normalizeLanguage(
  language: string
): string {
  return language
    .trim()
    .toLowerCase();
}

function createContainerName(): string {
  return (
    `smartlab-${Date.now()}-` +
    Math.random()
      .toString(36)
      .slice(2, 10)
  );
}

function encodeBase64(
  value: string
): string {
  return Buffer.from(
    value,
    "utf8"
  ).toString("base64");
}

export async function runCode(
  code: string,
  language: string,
  timeoutMs = 3000,
  stdin = ""
): Promise<ExecutionResult> {
  const normalizedLanguage =
    normalizeLanguage(language);

  const config =
    LANGUAGE_CONFIG[
      normalizedLanguage
    ];

  if (!config) {
    throw new Error(
      `Unsupported language: ${language}`
    );
  }

  if (!code.trim()) {
    return {
      stdout: "",
      stderr:
        "Source code is empty.",
      exitCode: 1,
      runtimeMs: 0,
      timedOut: false,
    };
  }

  const containerName =
    createContainerName();

  const encodedCode =
    encodeBase64(code);

  const encodedStdin =
    encodeBase64(stdin);

  const writeCodeCommand =
    `echo '${encodedCode}' | base64 -d > /tmp/${config.fileName}`;

  const writeInputCommand =
    `echo '${encodedStdin}' | base64 -d > /tmp/input.txt`;

  const shellCommand =
    `${writeCodeCommand} && ` +
    `${writeInputCommand} && ` +
    `${config.command} < /tmp/input.txt`;

  const dockerArgs = [
    "run",

    "--rm",

    "--name",
    containerName,

    "--network",
    "none",

    "--memory",
    "256m",

    "--cpus",
    "0.5",

    "--pids-limit",
    "64",

    "--read-only",

    "--tmpfs",
    "/tmp:rw,nosuid,size=32m",

    "--cap-drop",
    "ALL",

    "--security-opt",
    "no-new-privileges",

    config.image,

    "sh",

    "-c",

    shellCommand,
  ];

  const startTime =
    Date.now();

  try {
    const result =
      await execFileAsync(
        "docker",
        dockerArgs,
        {
          timeout: timeoutMs,
          maxBuffer:
            1024 * 1024,
        }
      );

    return {
      stdout:
        result.stdout || "",

      stderr:
        result.stderr || "",

      exitCode: 0,

      runtimeMs:
        Date.now() -
        startTime,

      timedOut: false,
    };
  } catch (error: any) {
    const timedOut =
      error?.killed === true ||
      error?.signal === "SIGTERM" ||
      error?.code ===
        "ETIMEDOUT";

    let exitCode = 1;

    if (
      typeof error?.code ===
      "number"
    ) {
      exitCode =
        error.code;
    }

    return {
      stdout:
        typeof error?.stdout ===
        "string"
          ? error.stdout
          : "",

      stderr:
        typeof error?.stderr ===
        "string"
          ? error.stderr
          : error?.message ||
            "Execution failed.",

      exitCode,

      runtimeMs:
        Date.now() -
        startTime,

      timedOut,
    };
  } finally {
    try {
      await execFileAsync(
        "docker",
        [
          "rm",
          "-f",
          containerName,
        ],
        {
          timeout: 1000,
        }
      );
    } catch {
      // Container already exited.
    }
  }
}