"use client";

import {
  useState,
} from "react";

import Link from "next/link";

import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Code2,
  FileCode2,
  Play,
  Sparkles,
  Terminal,
  Clock3,
  Loader2,
  XCircle,
} from "lucide-react";

import Sidebar from "@/components/Sidebar";

import {
  createReview,
} from "@/lib/api";

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
    }>;
  };

  complexity: {
    time: string;
    space: string;
    explanation: string;
  };

  issues: Array<{
    type: "error" | "warning" | "info";
    title: string;
    description: string;
    line?: number;
  }>;

  metrics: {
    lines: number;
    codeLines: number;
    functions: number;
    comments: number;
  };

  aiReview: string[];
};

export default function ReviewPage() {
  const [code, setCode] = useState(
`def add(a, b):
    return a + b`
  );

  const [language, setLanguage] =
    useState("python");

  const [fileName, setFileName] =
    useState("solution.py");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [result, setResult] =
    useState<ReviewResult | null>(null);

  async function handleReview() {
    if (!code.trim()) {
      setError("Please enter your code.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response =
        await createReview(
          code,
          language,
          fileName
        );

      if (!response.success) {
        throw new Error(
          response.message ||
            "Review failed."
        );
      }

      if (!response.review) {
        throw new Error(
          "Backend returned no review result."
        );
      }

      setResult(
        response.review
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to review code."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#08090b] text-white">

      <Sidebar />

      <main className="lg:pl-64">

        <header className="sticky top-0 z-40 h-16 border-b border-white/[0.07] bg-[#08090b]/85 backdrop-blur-xl">

          <div className="flex h-full items-center justify-between px-5 sm:px-8">

            <div className="flex items-center gap-3">

              <Link
                href="/"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.025] text-zinc-500 transition hover:text-white"
              >
                <ArrowLeft size={16} />
              </Link>

              <div>

                <div className="text-sm font-medium text-zinc-200">
                  Review Code
                </div>

                <div className="text-xs text-zinc-600">
                  SmartLab AI
                </div>

              </div>

            </div>

            <div className="flex items-center gap-2 text-xs text-zinc-600">

              <Sparkles size={14} />

              Real Docker Execution

            </div>

          </div>

        </header>

        <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8">

          <div className="mb-8">

            <div className="mb-3 flex items-center gap-2 text-xs text-zinc-600">

              <Code2 size={13} />

              <span>
                SmartLab Code Analysis
              </span>

            </div>

            <h1 className="text-2xl font-semibold tracking-tight">
              Review your code
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-zinc-500">
              Analyze syntax, execute real test cases,
              inspect complexity and detect potential
              issues in your code.
            </p>

          </div>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">

            <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025]">

              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.07] px-5 py-4">

                <div className="flex items-center gap-3">

                  <FileCode2
                    size={16}
                    className="text-zinc-500"
                  />

                  <input
                    value={fileName}
                    onChange={(e) =>
                      setFileName(
                        e.target.value
                      )
                    }
                    className="w-52 bg-transparent text-sm font-medium text-zinc-300 outline-none placeholder:text-zinc-700"
                    placeholder="solution.py"
                  />

                </div>

                <select
                  value={language}
                  onChange={(e) =>
                    setLanguage(
                      e.target.value
                    )
                  }
                  className="rounded-lg border border-white/[0.07] bg-[#111317] px-3 py-2 text-xs text-zinc-300 outline-none"
                >
                  <option value="python">
                    Python
                  </option>

                  <option value="javascript">
                    JavaScript
                  </option>

                  <option value="typescript">
                    TypeScript
                  </option>

                  <option value="cpp">
                    C++
                  </option>

                  <option value="java">
                    Java
                  </option>
                </select>

              </div>

              <div className="relative">

                <div className="absolute left-0 top-0 w-12 select-none border-r border-white/[0.04] bg-[#050608] py-5 text-right font-mono text-xs leading-6 text-zinc-800">

                  {code
                    .split("\n")
                    .map(
                      (_, index) => (
                        <div
                          key={index}
                          className="pr-3"
                        >
                          {index + 1}
                        </div>
                      )
                    )}

                </div>

                <textarea
                  value={code}
                  onChange={(e) =>
                    setCode(
                      e.target.value
                    )
                  }
                  spellCheck={false}
                  className="min-h-[560px] w-full resize-none bg-[#050608] py-5 pl-16 pr-5 font-mono text-xs leading-6 text-zinc-400 outline-none"
                  placeholder="Write your code here..."
                />

              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.07] px-5 py-4">

                <div className="flex items-center gap-2 text-xs text-zinc-600">

                  <Terminal size={14} />

                  <span>
                    Sandboxed execution
                  </span>

                </div>

                <button
                  onClick={handleReview}
                  disabled={loading}
                  className="flex h-9 items-center gap-2 rounded-lg bg-white px-4 text-xs font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                >

                  {loading ? (
                    <>
                      <Loader2
                        size={14}
                        className="animate-spin"
                      />

                      Running analysis...
                    </>
                  ) : (
                    <>
                      <Play size={14} />

                      Review Code
                    </>
                  )}

                </button>

              </div>

            </section>

            <section className="space-y-6">

              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">

                <div className="flex items-center gap-3">

                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.05] text-zinc-400">

                    <Sparkles size={16} />

                  </div>

                  <div>

                    <h2 className="text-sm font-semibold">
                      SmartLab Analysis
                    </h2>

                    <p className="mt-1 text-xs text-zinc-600">
                      Automated code evaluation
                    </p>

                  </div>

                </div>

                <div className="mt-6 space-y-4">

                  <Feature
                    icon={
                      <CheckCircle2
                        size={15}
                      />
                    }
                    title="Syntax Analysis"
                    description="Checks whether the submitted code is syntactically valid."
                  />

                  <Feature
                    icon={
                      <Play size={15} />
                    }
                    title="Real Execution"
                    description="Runs supported code inside an isolated Docker container."
                  />

                  <Feature
                    icon={
                      <Terminal size={15} />
                    }
                    title="Test Cases"
                    description="Compares actual program output with expected results."
                  />

                  <Feature
                    icon={
                      <Clock3 size={15} />
                    }
                    title="Complexity"
                    description="Analyzes estimated time and space complexity."
                  />

                  <Feature
                    icon={
                      <AlertTriangle
                        size={15}
                      />
                    }
                    title="Issue Detection"
                    description="Reports potential bugs, warnings and edge cases."
                  />

                </div>

              </div>

              {error && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-5">

                  <div className="flex gap-3">

                    <XCircle
                      size={17}
                      className="mt-0.5 shrink-0 text-red-400"
                    />

                    <div>

                      <div className="text-sm font-medium text-red-300">
                        Review failed
                      </div>

                      <p className="mt-1 text-xs leading-5 text-red-400/70">
                        {error}
                      </p>

                    </div>

                  </div>

                </div>
              )}

              {result && (
                <QuickResult
                  result={result}
                />
              )}

            </section>

          </div>

          {result && (
            <ResultSection
              result={result}
            />
          )}

        </div>

      </main>

    </div>
  );
}

function Feature({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3">

      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-black/20 text-zinc-500">
        {icon}
      </div>

      <div>

        <div className="text-xs font-medium text-zinc-300">
          {title}
        </div>

        <p className="mt-1 text-xs leading-5 text-zinc-600">
          {description}
        </p>

      </div>

    </div>
  );
}

function QuickResult({
  result,
}: {
  result: ReviewResult;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">

      <div className="flex items-center justify-between">

        <div>

          <div className="text-xs text-zinc-600">
            Current score
          </div>

          <div className="mt-2 text-3xl font-semibold">
            {result.score}%
          </div>

        </div>

        <div
          className={
            result.tests.passed ===
            result.tests.total &&
            result.syntax.status ===
              "passed"
              ? "text-emerald-400"
              : "text-yellow-400"
          }
        >
          {result.tests.passed ===
            result.tests.total &&
          result.syntax.status ===
            "passed" ? (
            <CheckCircle2 size={30} />
          ) : (
            <AlertTriangle
              size={30}
            />
          )}
        </div>

      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">

        <MiniResult
          label="Syntax"
          value={
            result.syntax.status ===
            "passed"
              ? "Passed"
              : "Failed"
          }
        />

        <MiniResult
          label="Tests"
          value={`${result.tests.passed}/${result.tests.total}`}
        />

        <MiniResult
          label="Time"
          value={
            result.complexity.time
          }
        />

        <MiniResult
          label="Space"
          value={
            result.complexity.space
          }
        />

      </div>

    </div>
  );
}

function MiniResult({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-black/20 p-3">

      <div className="text-[10px] uppercase tracking-wider text-zinc-700">
        {label}
      </div>

      <div className="mt-2 text-sm font-medium text-zinc-300">
        {value}
      </div>

    </div>
  );
}

function ResultSection({
  result,
}: {
  result: ReviewResult;
}) {
  return (
    <div className="mt-6 space-y-6">

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">

        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025]">

          <div className="border-b border-white/[0.07] p-5">

            <div className="flex items-center gap-2">

              <Terminal
                size={15}
                className="text-zinc-500"
              />

              <h2 className="text-sm font-semibold">
                Test Results
              </h2>

            </div>

            <p className="mt-1 text-xs text-zinc-700">
              {result.tests.passed}/
              {result.tests.total} test cases passed
            </p>

          </div>

          <div className="space-y-3 p-5">

            {result.tests.cases.map(
              (testCase, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-white/[0.06] bg-black/20 p-4"
                >

                  <div className="flex items-center justify-between">

                    <span className="text-xs font-medium text-zinc-300">
                      {testCase.name}
                    </span>

                    <span
                      className={
                        testCase.status ===
                        "passed"
                          ? "flex items-center gap-1 text-[11px] text-emerald-400"
                          : "flex items-center gap-1 text-[11px] text-red-400"
                      }
                    >
                      {testCase.status ===
                      "passed" ? (
                        <CheckCircle2
                          size={12}
                        />
                      ) : (
                        <XCircle
                          size={12}
                        />
                      )}

                      {testCase.status}
                    </span>

                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">

                    <TestValue
                      label="Input"
                      value={
                        testCase.input
                      }
                    />

                    <TestValue
                      label="Expected"
                      value={
                        testCase.expected
                      }
                    />

                    <TestValue
                      label="Actual"
                      value={
                        testCase.actual
                      }
                    />

                  </div>

                </div>
              )
            )}

          </div>

        </div>

        <div className="space-y-6">

          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">

            <div className="flex items-center gap-2">

              <Code2
                size={15}
                className="text-zinc-500"
              />

              <h2 className="text-sm font-semibold">
                Code Metrics
              </h2>

            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">

              <Metric
                label="Lines"
                value={
                  result.metrics.lines
                }
              />

              <Metric
                label="Code Lines"
                value={
                  result.metrics.codeLines
                }
              />

              <Metric
                label="Functions"
                value={
                  result.metrics.functions
                }
              />

              <Metric
                label="Comments"
                value={
                  result.metrics.comments
                }
              />

            </div>

          </div>

          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">

            <div className="flex items-center gap-2">

              <Clock3
                size={15}
                className="text-zinc-500"
              />

              <h2 className="text-sm font-semibold">
                Complexity Analysis
              </h2>

            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">

              <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">

                <div className="text-[10px] uppercase tracking-wider text-zinc-700">
                  Time
                </div>

                <div className="mt-2 font-mono text-lg text-zinc-300">
                  {result.complexity.time}
                </div>

              </div>

              <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">

                <div className="text-[10px] uppercase tracking-wider text-zinc-700">
                  Space
                </div>

                <div className="mt-2 font-mono text-lg text-zinc-300">
                  {result.complexity.space}
                </div>

              </div>

            </div>

            <p className="mt-4 text-xs leading-5 text-zinc-600">
              {result.complexity.explanation}
            </p>

          </div>

        </div>

      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">

        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025]">

          <div className="border-b border-white/[0.07] p-5">

            <div className="flex items-center gap-2">

              <AlertTriangle
                size={15}
                className="text-zinc-500"
              />

              <h2 className="text-sm font-semibold">
                Detected Issues
              </h2>

            </div>

            <p className="mt-1 text-xs text-zinc-700">
              {result.issues.length} issues found
            </p>

          </div>

          <div className="space-y-3 p-5">

            {result.issues.length ===
            0 ? (
              <div className="rounded-xl border border-white/[0.06] bg-black/20 p-6 text-center">

                <CheckCircle2
                  size={20}
                  className="mx-auto text-emerald-400"
                />

                <div className="mt-3 text-sm text-zinc-400">
                  No issues detected
                </div>

              </div>
            ) : (
              result.issues.map(
                (issue, index) => (
                  <Issue
                    key={index}
                    issue={issue}
                  />
                )
              )
            )}

          </div>

        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025]">

          <div className="border-b border-white/[0.07] p-5">

            <div className="flex items-center gap-2">

              <Sparkles
                size={15}
                className="text-zinc-500"
              />

              <h2 className="text-sm font-semibold">
                SmartLab AI Review
              </h2>

            </div>

            <p className="mt-1 text-xs text-zinc-700">
              Automated recommendations
            </p>

          </div>

          <div className="grid gap-3 p-5 md:grid-cols-2">

            {result.aiReview.map(
              (review, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-white/[0.06] bg-black/20 p-4"
                >

                  <div className="flex gap-3">

                    <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-600" />

                    <p className="text-sm leading-6 text-zinc-500">
                      {review}
                    </p>

                  </div>

                </div>
              )
            )}

          </div>

        </div>

      </section>

    </div>
  );
}

function TestValue({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>

      <div className="mb-1 text-[10px] uppercase tracking-wider text-zinc-700">
        {label}
      </div>

      <div className="rounded-lg border border-white/[0.05] bg-[#050608] px-3 py-2 font-mono text-[11px] text-zinc-500">
        {value}
      </div>

    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">

      <div className="text-2xl font-semibold">
        {value}
      </div>

      <div className="mt-1 text-xs text-zinc-600">
        {label}
      </div>

    </div>
  );
}

function Issue({
  issue,
}: {
  issue: ReviewResult["issues"][number];
}) {
  const isError =
    issue.type === "error";

  const isWarning =
    issue.type === "warning";

  return (
    <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">

      <div className="flex gap-3">

        <div
          className={
            isError
              ? "mt-0.5 shrink-0 text-red-400"
              : isWarning
                ? "mt-0.5 shrink-0 text-yellow-400"
                : "mt-0.5 shrink-0 text-zinc-500"
          }
        >

          {isError ? (
            <XCircle size={16} />
          ) : isWarning ? (
            <AlertTriangle
              size={16}
            />
          ) : (
            <CheckCircle2
              size={16}
            />
          )}

        </div>

        <div className="min-w-0">

          <div className="text-sm font-medium text-zinc-300">
            {issue.title}
          </div>

          <p className="mt-1 text-xs leading-5 text-zinc-600">
            {issue.description}
          </p>

          {issue.line && (
            <div className="mt-3 text-[10px] text-zinc-700">
              Line {issue.line}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}