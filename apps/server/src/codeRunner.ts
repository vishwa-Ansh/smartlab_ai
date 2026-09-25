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
    command: "python /tmp/main.py",
  },

  javascript: {
    image: "node:22-alpine",
    fileName: "main.js",
    command: "node /tmp/main.js",
  },

  js: {
    image: "node:22-alpine",
    fileName: "main.js",
    command: "node /tmp/main.js",
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

  java: {
    image: "eclipse-temurin:21-jdk",
    fileName: "Main.java",
    command:
      "javac /tmp/Main.java && java -cp /tmp Main",
  },
};

function normalizeLanguage(
  language: string
) {
  return language
    .trim()
    .toLowerCase();
}

export async function runCode(
  code: string,
  language: string,
  timeoutMs = 3000
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

  const containerName =
    `smartlab-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}`;

  const encodedCode =
    Buffer.from(code).toString(
      "base64"
    );

  const writeCommand =
    `echo '${encodedCode}' | base64 -d > /tmp/${config.fileName}`;

  const shellCommand =
    `${writeCommand} && ${config.command}`;

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
        Date.now() - startTime,

      timedOut: false,
    };
  } catch (error: any) {
    const timedOut =
      error?.killed === true ||
      error?.signal === "SIGTERM" ||
      error?.code === "ETIMEDOUT";

    return {
      stdout:
        error?.stdout || "",

      stderr:
        error?.stderr ||
        error?.message ||
        "",

      exitCode:
        typeof error?.code ===
        "number"
          ? error.code
          : 1,

      runtimeMs:
        Date.now() - startTime,

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