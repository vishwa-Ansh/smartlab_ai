"use client";

import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  Code2,
  FileCode2,
  GitCompare,
  Loader2,
  Play,
  RefreshCw,
  Sparkles,
  Terminal,
  TriangleAlert,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import Sidebar from "@/components/Sidebar";

import {
  createReview,
  fixCode,
  type AgentResponse,
  type Issue,
} from "@/lib/api";

const starterCode = `def add(a, b):
    return a - b`;

export default function ReviewPage() {
  const [code, setCode] =
    useState(starterCode);

  const [language, setLanguage] =
    useState("python");

  const [fileName, setFileName] =
    useState("main.py");

  const [reviewLoading, setReviewLoading] =
    useState(false);

  const [fixLoading, setFixLoading] =
    useState(false);

  const [review, setReview] =
    useState<any>(null);

  const [agentResult, setAgentResult] =
    useState<AgentResponse | null>(null);

  const [error, setError] =
    useState("");

  const [applied, setApplied] =
    useState(false);

  const [activeTab, setActiveTab] =
    useState<"review" | "diff">(
      "review"
    );

  async function handleReview() {
    if (!code.trim()) {
      setError(
        "Please enter some code first."
      );
      return;
    }

    setError("");
    setReview(null);
    setAgentResult(null);
    setApplied(false);
    setReviewLoading(true);

    try {
      const result =
        await createReview(
          code,
          language,
          fileName
        );

      setReview(result.review || null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Review failed."
      );
    } finally {
      setReviewLoading(false);
    }
  }

  async function handleFix() {
    if (!code.trim()) {
      setError(
        "Please enter some code first."
      );
      return;
    }

    setError("");
    setApplied(false);
    setFixLoading(true);
    setAgentResult(null);

    try {
      const issues: Issue[] =
        review?.issues || [];

      const result =
        await fixCode(
          code,
          language,
          issues
        );

      setAgentResult(result);

      if (result.success) {
        setActiveTab("diff");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "SmartLab could not fix the code."
      );
    } finally {
      setFixLoading(false);
    }
  }

  function handleApplyFix() {
    if (
      !agentResult?.patch?.fixedCode
    ) {
      return;
    }

    if (
      !agentResult.verification?.verified
    ) {
      setError(
        "This patch has not passed verification."
      );
      return;
    }

    setCode(
      agentResult.patch.fixedCode
    );

    setApplied(true);
    setReview(null);
    setAgentResult(null);
    setActiveTab("review");
    setError("");
  }

  function handleRejectFix() {
    setAgentResult(null);
    setApplied(false);
    setActiveTab("review");
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100">
      <Sidebar />

      <main className="ml-64 min-h-screen">
        <div className="mx-auto max-w-[1500px] px-8 py-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <Link
                href="/"
                className="mb-4 inline-flex items-center gap-2 text-sm text-zinc-500 transition hover:text-zinc-300"
              >
                <ChevronLeft
                  size={16}
                />
                Dashboard
              </Link>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                  <Sparkles
                    size={20}
                    className="text-white"
                  />
                </div>

                <div>
                  <h1 className="text-2xl font-semibold tracking-tight">
                    Code Review
                  </h1>

                  <p className="mt-1 text-sm text-zinc-500">
                    Analyze, debug and fix your code with SmartLab AI.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Agent Ready
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
              <AlertCircle
                size={18}
                className="mt-0.5 shrink-0"
              />

              <div className="flex-1">
                {error}
              </div>

              <button
                onClick={() =>
                  setError("")
                }
                className="text-red-400 transition hover:text-red-200"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {applied && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-300">
              <CheckCircle2
                size={18}
              />

              <span>
                Verified SmartLab fix applied to the editor.
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(420px,0.7fr)]">
            <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#101012]">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div className="flex items-center gap-3">
                  <Code2
                    size={18}
                    className="text-zinc-400"
                  />

                  <span className="text-sm font-medium">
                    Source Code
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    value={fileName}
                    onChange={(e) =>
                      setFileName(
                        e.target.value
                      )
                    }
                    className="w-36 rounded-lg border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-zinc-300 outline-none transition focus:border-white/20"
                  />

                  <select
                    value={language}
                    onChange={(e) => {
                      const value =
                        e.target.value;

                      setLanguage(value);

                      if (
                        value === "python"
                      ) {
                        setFileName(
                          "main.py"
                        );
                      }

                      if (
                        value ===
                        "javascript"
                      ) {
                        setFileName(
                          "main.js"
                        );
                      }

                      if (
                        value === "typescript"
                      ) {
                        setFileName(
                          "main.ts"
                        );
                      }

                      if (
                        value === "cpp"
                      ) {
                        setFileName(
                          "main.cpp"
                        );
                      }
                    }}
                    className="rounded-lg border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-zinc-300 outline-none"
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
                  </select>
                </div>
              </div>

              <div className="relative">
                <div className="absolute left-0 top-0 w-12 select-none border-r border-white/5 bg-black/10 py-5 text-right font-mono text-xs leading-6 text-zinc-700">
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
                  className="min-h-[620px] w-full resize-none bg-transparent py-5 pl-16 pr-6 font-mono text-[13px] leading-6 text-zinc-200 outline-none"
                  placeholder="Write or paste your code here..."
                />
              </div>

              <div className="flex items-center justify-between border-t border-white/10 px-5 py-4">
                <div className="flex items-center gap-4 text-xs text-zinc-500">
                  <span className="flex items-center gap-1.5">
                    <FileCode2
                      size={14}
                    />
                    {code.split("\n").length} lines
                  </span>

                  <span>
                    {language}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleReview}
                    disabled={
                      reviewLoading ||
                      fixLoading
                    }
                    className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {reviewLoading ? (
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                    ) : (
                      <RefreshCw
                        size={16}
                      />
                    )}

                    Review Code
                  </button>

                  <button
                    onClick={handleFix}
                    disabled={
                      fixLoading ||
                      reviewLoading
                    }
                    className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {fixLoading ? (
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                    ) : (
                      <Sparkles
                        size={16}
                      />
                    )}

                    Fix Code
                  </button>
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#101012]">
              <div className="flex items-center border-b border-white/10">
                <button
                  onClick={() =>
                    setActiveTab(
                      "review"
                    )
                  }
                  className={`flex items-center gap-2 px-5 py-4 text-sm transition ${
                    activeTab === "review"
                      ? "border-b border-white text-white"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  <Terminal
                    size={16}
                  />
                  Review
                </button>

                <button
                  onClick={() =>
                    setActiveTab(
                      "diff"
                    )
                  }
                  disabled={
                    !agentResult?.patch
                  }
                  className={`flex items-center gap-2 px-5 py-4 text-sm transition ${
                    activeTab === "diff"
                      ? "border-b border-white text-white"
                      : "text-zinc-500 hover:text-zinc-300 disabled:cursor-not-allowed disabled:opacity-30"
                  }`}
                >
                  <GitCompare
                    size={16}
                  />
                  Fix / Diff
                </button>
              </div>

              {activeTab ===
                "review" && (
                <ReviewPanel
                  review={review}
                  loading={
                    reviewLoading
                  }
                  onFix={
                    handleFix
                  }
                />
              )}

              {activeTab ===
                "diff" && (
                <DiffPanel
                  result={
                    agentResult
                  }
                  onApply={
                    handleApplyFix
                  }
                  onReject={
                    handleRejectFix
                  }
                />
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

function ReviewPanel({
  review,
  loading,
  onFix,
}: {
  review: any;
  loading: boolean;
  onFix: () => void;
}) {
  if (loading) {
    return (
      <div className="flex min-h-[620px] flex-col items-center justify-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
          <Loader2
            size={22}
            className="animate-spin text-zinc-300"
          />
        </div>

        <p className="text-sm text-zinc-300">
          SmartLab is analyzing your code...
        </p>

        <p className="mt-2 text-xs text-zinc-600">
          Syntax · Tests · Complexity · Issues
        </p>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="flex min-h-[620px] flex-col items-center justify-center px-8 text-center">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
          <Zap
            size={24}
            className="text-zinc-400"
          />
        </div>

        <h2 className="text-base font-medium text-zinc-200">
          Ready to review
        </h2>

        <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-600">
          Run a code review to detect syntax problems, test failures, complexity issues and potential bugs.
        </p>

        <button
          onClick={() =>
            document
              .querySelector<HTMLButtonElement>(
                'button'
              )
          }
          className="mt-6 hidden"
        >
          Review
        </button>
      </div>
    );
  }

  const score =
    review.score ?? 0;

  const passed =
    review.tests?.passed ?? 0;

  const total =
    review.tests?.total ?? 0;

  const issues =
    review.issues || [];

  return (
    <div className="max-h-[700px] overflow-y-auto p-5">
      <div className="mb-5 grid grid-cols-2 gap-3">
        <Metric
          icon={
            <CheckCircle2
              size={17}
            />
          }
          label="Score"
          value={`${score}/100`}
        />

        <Metric
          icon={
            <Play size={17} />
          }
          label="Tests"
          value={`${passed}/${total}`}
        />

        <Metric
          icon={
            <Clock3
              size={17}
            />
          }
          label="Time"
          value={
            review.complexity
              ?.time || "—"
          }
        />

        <Metric
          icon={
            <Code2
              size={17}
            />
          }
          label="Space"
          value={
            review.complexity
              ?.space || "—"
          }
        />
      </div>

      <div className="mb-5 rounded-xl border border-white/10 bg-black/10 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium">
            Syntax
          </h3>

          <StatusBadge
            passed={
              review.syntax
                ?.status ===
              "passed"
            }
          />
        </div>

        <p className="text-xs leading-5 text-zinc-500">
          {review.syntax
            ?.message ||
            "No syntax information."}
        </p>
      </div>

      <div className="mb-5 rounded-xl border border-white/10 bg-black/10 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium">
            Test Results
          </h3>

          <span className="text-xs text-zinc-500">
            {passed}/{total} passed
          </span>
        </div>

        {review.tests
          ?.cases?.length ? (
          <div className="space-y-2">
            {review.tests.cases.map(
              (
                test: any,
                index: number
              ) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs text-zinc-300">
                      {test.name}
                    </p>

                    <p className="mt-1 text-[11px] text-zinc-600">
                      Expected:{" "}
                      {test.expected}
                    </p>
                  </div>

                  {test.status ===
                  "passed" ? (
                    <CheckCircle2
                      size={16}
                      className="text-emerald-400"
                    />
                  ) : (
                    <AlertCircle
                      size={16}
                      className="text-red-400"
                    />
                  )}
                </div>
              )
            )}
          </div>
        ) : (
          <p className="text-xs text-zinc-600">
            No executable tests generated.
          </p>
        )}
      </div>

      <div className="mb-5 rounded-xl border border-white/10 bg-black/10 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium">
            Issues
          </h3>

          <span className="text-xs text-zinc-600">
            {issues.length}
          </span>
        </div>

        {issues.length === 0 ? (
          <div className="flex items-center gap-2 text-xs text-emerald-400">
            <CheckCircle2
              size={15}
            />
            No obvious issues detected.
          </div>
        ) : (
          <div className="space-y-3">
            {issues.map(
              (
                issue: Issue,
                index: number
              ) => (
                <div
                  key={index}
                  className="rounded-lg border border-white/5 bg-white/[0.02] p-3"
                >
                  <div className="flex items-start gap-2">
                    {issue.type ===
                    "error" ? (
                      <AlertCircle
                        size={15}
                        className="mt-0.5 shrink-0 text-red-400"
                      />
                    ) : issue.type ===
                      "warning" ? (
                      <TriangleAlert
                        size={15}
                        className="mt-0.5 shrink-0 text-amber-400"
                      />
                    ) : (
                      <AlertCircle
                        size={15}
                        className="mt-0.5 shrink-0 text-blue-400"
                      />
                    )}

                    <div>
                      <p className="text-xs font-medium text-zinc-300">
                        {issue.title}
                      </p>

                      <p className="mt-1 text-[11px] leading-5 text-zinc-600">
                        {issue.description}
                      </p>

                      {issue.line && (
                        <p className="mt-2 text-[10px] text-zinc-700">
                          Line{" "}
                          {issue.line}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>

      <div className="mb-5 rounded-xl border border-white/10 bg-black/10 p-4">
        <h3 className="mb-3 text-sm font-medium">
          Complexity
        </h3>

        <p className="text-xs leading-5 text-zinc-500">
          {review.complexity
            ?.explanation ||
            "No complexity explanation available."}
        </p>
      </div>

      <button
        onClick={onFix}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-zinc-200"
      >
        <Sparkles
          size={16}
        />
        Analyze & Fix with SmartLab
      </button>
    </div>
  );
}

function DiffPanel({
  result,
  onApply,
  onReject,
}: {
  result: AgentResponse | null;
  onApply: () => void;
  onReject: () => void;
}) {
  if (!result?.patch) {
    return (
      <div className="flex min-h-[620px] items-center justify-center px-8 text-center">
        <div>
          <GitCompare
            size={28}
            className="mx-auto mb-4 text-zinc-700"
          />

          <p className="text-sm text-zinc-500">
            No proposed fix yet.
          </p>
        </div>
      </div>
    );
  }

  const verified =
    result.verification
      ?.verified === true;

  const changes =
    result.patch.changes || [];

  return (
    <div className="max-h-[700px] overflow-y-auto p-5">
      <div
        className={`mb-5 rounded-xl border p-4 ${
          verified
            ? "border-emerald-500/20 bg-emerald-500/5"
            : "border-red-500/20 bg-red-500/5"
        }`}
      >
        <div className="flex items-start gap-3">
          {verified ? (
            <CheckCircle2
              size={19}
              className="mt-0.5 text-emerald-400"
            />
          ) : (
            <AlertCircle
              size={19}
              className="mt-0.5 text-red-400"
            />
          )}

          <div>
            <p className="text-sm font-medium">
              {verified
                ? "Fix verified"
                : "Fix verification failed"}
            </p>

            <p className="mt-1 text-xs leading-5 text-zinc-500">
              {result.verification
                ?.reason ||
                result.patch
                  .explanation}
            </p>

            {result.verification && (
              <p className="mt-2 text-xs text-zinc-400">
                Tests:{" "}
                {
                  result.verification
                    .passed
                }
                /
                {
                  result.verification
                    .total
                }
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mb-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium">
            Proposed Changes
          </h3>

          <span className="text-xs text-zinc-600">
            {changes.length} change
            {changes.length !== 1
              ? "s"
              : ""}
          </span>
        </div>

        <div className="space-y-3">
          {changes.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-black/10 p-4 text-xs text-zinc-600">
              No individual changes were generated.
            </div>
          ) : (
            changes.map(
              (
                change,
                index
              ) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-xl border border-white/10 bg-black/20"
                >
                  <div className="flex items-center justify-between border-b border-white/5 px-4 py-2">
                    <span className="text-[11px] text-zinc-500">
                      Line{" "}
                      {change.line ||
                        "—"}
                    </span>
                  </div>

                  <div className="font-mono text-xs">
                    <div className="flex bg-red-500/5 px-4 py-2 text-red-300">
                      <span className="mr-3 select-none text-red-500">
                        −
                      </span>

                      <span className="whitespace-pre-wrap">
                        {change.oldCode}
                      </span>
                    </div>

                    <div className="flex bg-emerald-500/5 px-4 py-2 text-emerald-300">
                      <span className="mr-3 select-none text-emerald-500">
                        +
                      </span>

                      <span className="whitespace-pre-wrap">
                        {change.newCode}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-white/5 px-4 py-3 text-[11px] leading-5 text-zinc-600">
                    {change.reason}
                  </div>
                </div>
              )
            )
          )}
        </div>
      </div>

      <div className="mb-5">
        <h3 className="mb-3 text-sm font-medium">
          Fixed Code
        </h3>

        <pre className="max-h-72 overflow-auto rounded-xl border border-white/10 bg-black/30 p-4 font-mono text-xs leading-6 text-zinc-300">
          {result.patch.fixedCode}
        </pre>
      </div>

      {result.verification
        ?.cases?.length ? (
        <div className="mb-5">
          <h3 className="mb-3 text-sm font-medium">
            Verification
          </h3>

          <div className="space-y-2">
            {result.verification.cases.map(
              (
                test,
                index
              ) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-3"
                >
                  <div>
                    <p className="text-xs text-zinc-300">
                      {test.name}
                    </p>

                    <p className="mt-1 font-mono text-[10px] text-zinc-600">
                      expected:{" "}
                      {test.expected}
                      {" · "}
                      actual:{" "}
                      {test.actual}
                    </p>
                  </div>

                  {test.status ===
                  "passed" ? (
                    <CheckCircle2
                      size={16}
                      className="text-emerald-400"
                    />
                  ) : (
                    <AlertCircle
                      size={16}
                      className="text-red-400"
                    />
                  )}
                </div>
              )
            )}
          </div>
        </div>
      ) : null}

      <div className="flex gap-3">
        <button
          onClick={onReject}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.07]"
        >
          <X size={16} />
          Reject
        </button>

        <button
          onClick={onApply}
          disabled={!verified}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Check size={16} />
          Apply Fix
        </button>
      </div>

      {!verified && (
        <p className="mt-3 text-center text-[11px] text-zinc-600">
          Apply Fix is disabled until all verification tests pass.
        </p>
      )}
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/10 p-4">
      <div className="mb-2 flex items-center gap-2 text-zinc-500">
        {icon}

        <span className="text-[11px]">
          {label}
        </span>
      </div>

      <p className="text-lg font-semibold text-zinc-200">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({
  passed,
}: {
  passed: boolean;
}) {
  return passed ? (
    <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] text-emerald-400">
      <Check
        size={11}
      />
      Passed
    </span>
  ) : (
    <span className="flex items-center gap-1.5 rounded-full bg-red-500/10 px-2 py-1 text-[10px] text-red-400">
      <AlertCircle
        size={11}
      />
      Failed
    </span>
  );
}