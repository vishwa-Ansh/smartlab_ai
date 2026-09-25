"use client";

import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Code2,
  FileCode2,
  GitBranch,
  Lightbulb,
  ShieldCheck,
  Sparkles,
  Terminal,
  Timer,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";

type ReviewData = {
  id: string;
  code: string;
  language: string;
  fileName: string;
  createdAt: string;
  score: number;
  tests: {
    passed: number;
    total: number;
    cases: {
      name: string;
      input: string;
      expected: string;
      actual: string;
      status: "passed" | "failed";
    }[];
  };
  complexity: string;
  requirements: {
    satisfied: number;
    total: number;
  };
  runtime: string;
  issues: {
    type: "warning" | "error";
    title: string;
    description: string;
  }[];
  aiReview: string[];
};

export default function ReviewPage({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  const [review, setReview] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Overview");

  useEffect(() => {
    async function loadReview() {
      try {
        const { submissionId } = await params;

        const response = await fetch(
          `http://localhost:4000/api/review/${submissionId}`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to load review");
        }

        const data = await response.json();

        setReview(data.submission);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadReview();
  }, [params]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#08090b] text-zinc-400">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
          Loading review...
        </div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#08090b] text-zinc-400">
        Review not found.
      </div>
    );
  }

  const passedPercentage =
    (review.tests.passed / review.tests.total) * 100;

  const requirementPercentage =
    (review.requirements.satisfied / review.requirements.total) * 100;

  return (
    <main className="min-h-screen bg-[#08090b] text-white">
      <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#08090b]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-black">
              <Sparkles size={16} />
            </div>

            <div>
              <div className="text-sm font-semibold">
                SmartLab
              </div>

              <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">
                AI Code Review
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 py-2 text-xs text-zinc-400 sm:flex">
              <GitBranch size={14} />
              Review
            </div>

            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold">
              A
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-6 py-8">
        <div className="mb-8 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs text-zinc-500">
              <span>Reviews</span>
              <span>/</span>
              <span>{review.fileName}</span>
            </div>

            <h1 className="text-3xl font-semibold tracking-tight">
              Code Review
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-zinc-500">
              Automated analysis of your implementation, test
              coverage, complexity and assignment requirements.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-3">
            <FileCode2 size={16} className="text-zinc-500" />

            <div>
              <div className="text-sm font-medium">
                {review.fileName}
              </div>

              <div className="text-xs text-zinc-600">
                {review.language}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 flex items-center gap-1 border-b border-white/[0.07]">
          {["Overview", "Tests", "Issues", "Code"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative px-4 py-3 text-sm transition ${
                activeTab === tab
                  ? "text-white"
                  : "text-zinc-600 hover:text-zinc-300"
              }`}
            >
              {tab}

              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 right-0 h-px bg-white" />
              )}
            </button>
          ))}
        </div>

        {activeTab === "Overview" && (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                icon={<Zap size={17} />}
                label="Overall Score"
                value={`${review.score}%`}
                description="Code quality score"
                accent
              />

              <MetricCard
                icon={<CheckCircle2 size={17} />}
                label="Tests Passed"
                value={`${review.tests.passed}/${review.tests.total}`}
                description={`${Math.round(passedPercentage)}% test success`}
              />

              <MetricCard
                icon={<Timer size={17} />}
                label="Complexity"
                value={review.complexity}
                description="Detected time complexity"
              />

              <MetricCard
                icon={<ShieldCheck size={17} />}
                label="Requirements"
                value={`${review.requirements.satisfied}/${review.requirements.total}`}
                description={`${Math.round(
                  requirementPercentage
                )}% satisfied`}
              />
            </section>

            <section className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6">
                <SectionHeader
                  icon={<Sparkles size={17} />}
                  title="AI Review"
                  description="Intelligent feedback generated from the analysis"
                />

                <div className="mt-6 space-y-3">
                  {review.aiReview.map((item, index) => (
                    <div
                      key={index}
                      className="flex gap-4 rounded-xl border border-white/[0.06] bg-black/20 p-4"
                    >
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-zinc-400">
                        <Lightbulb size={14} />
                      </div>

                      <p className="text-sm leading-6 text-zinc-400">
                        {item}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6">
                <SectionHeader
                  icon={<AlertCircle size={17} />}
                  title="Issues"
                  description="Things that need attention"
                />

                <div className="mt-6 space-y-3">
                  {review.issues.map((issue, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-white/[0.06] bg-black/20 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                            issue.type === "error"
                              ? "bg-red-500/10 text-red-400"
                              : "bg-amber-500/10 text-amber-400"
                          }`}
                        >
                          {issue.type === "error" ? (
                            <AlertCircle size={14} />
                          ) : (
                            <Lightbulb size={14} />
                          )}
                        </div>

                        <div>
                          <div className="text-sm font-medium">
                            {issue.title}
                          </div>

                          <p className="mt-1 text-xs leading-5 text-zinc-500">
                            {issue.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="mt-6 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6">
              <SectionHeader
                icon={<Terminal size={17} />}
                title="Test Analysis"
                description="Execution results across the generated test suite"
              />

              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs text-zinc-500">
                    Test success
                  </span>

                  <span className="text-xs font-medium text-zinc-300">
                    {review.tests.passed}/{review.tests.total}
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-zinc-900">
                  <div
                    className="h-full rounded-full bg-white transition-all"
                    style={{
                      width: `${passedPercentage}%`,
                    }}
                  />
                </div>
              </div>
            </section>
          </>
        )}

        {activeTab === "Tests" && (
          <section className="rounded-2xl border border-white/[0.07] bg-white/[0.025]">
            <div className="border-b border-white/[0.07] p-6">
              <SectionHeader
                icon={<Terminal size={17} />}
                title="Test Cases"
                description="Detailed execution results"
              />
            </div>

            <div className="divide-y divide-white/[0.06]">
              {review.tests.cases.map((test, index) => (
                <div
                  key={index}
                  className="p-5 transition hover:bg-white/[0.015]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {test.status === "passed" ? (
                        <CheckCircle2
                          size={17}
                          className="text-emerald-400"
                        />
                      ) : (
                        <AlertCircle
                          size={17}
                          className="text-red-400"
                        />
                      )}

                      <span className="text-sm font-medium">
                        {test.name}
                      </span>
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                        test.status === "passed"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-red-500/10 text-red-400"
                      }`}
                    >
                      {test.status}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <TestValue label="Input" value={test.input} />
                    <TestValue
                      label="Expected"
                      value={test.expected}
                    />
                    <TestValue label="Actual" value={test.actual} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === "Issues" && (
          <section className="grid gap-4">
            {review.issues.map((issue, index) => (
              <div
                key={index}
                className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6"
              >
                <div className="flex gap-4">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      issue.type === "error"
                        ? "bg-red-500/10 text-red-400"
                        : "bg-amber-500/10 text-amber-400"
                    }`}
                  >
                    {issue.type === "error" ? (
                      <AlertCircle size={18} />
                    ) : (
                      <Lightbulb size={18} />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-semibold">
                        {issue.title}
                      </h3>

                      <span className="text-[10px] uppercase tracking-wider text-zinc-600">
                        {issue.type}
                      </span>
                    </div>

                    <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">
                      {issue.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}

        {activeTab === "Code" && (
          <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0c0d0f]">
            <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
              <div className="flex items-center gap-3">
                <Code2 size={16} className="text-zinc-500" />

                <span className="text-sm font-medium">
                  {review.fileName}
                </span>
              </div>

              <span className="text-xs text-zinc-600">
                {review.language}
              </span>
            </div>

            <div className="overflow-x-auto p-6">
              <pre className="font-mono text-[13px] leading-7 text-zinc-400">
                {review.code}
              </pre>
            </div>
          </section>
        )}

        <footer className="mt-10 flex flex-col justify-between gap-3 border-t border-white/[0.07] py-6 text-xs text-zinc-600 sm:flex-row">
          <span>
            Submission ID: {review.id}
          </span>

          <span className="flex items-center gap-2">
            <Clock3 size={13} />
            {new Date(review.createdAt).toLocaleString()}
          </span>
        </footer>
      </div>
    </main>
  );
}

function MetricCard({
  icon,
  label,
  value,
  description,
  accent = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  description: string;
  accent?: boolean;
}) {
  return (
    <div className="group rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 transition hover:border-white/[0.12] hover:bg-white/[0.035]">
      <div className="flex items-center justify-between">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-zinc-400">
          {icon}
        </div>

        <ChevronDown
          size={14}
          className="text-zinc-700 transition group-hover:text-zinc-500"
        />
      </div>

      <div
        className={`mt-5 text-3xl font-semibold tracking-tight ${
          accent ? "text-white" : "text-zinc-100"
        }`}
      >
        {value}
      </div>

      <div className="mt-1 text-sm text-zinc-400">
        {label}
      </div>

      <div className="mt-2 text-xs text-zinc-600">
        {description}
      </div>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-zinc-400">
        {icon}
      </div>

      <div>
        <h2 className="text-sm font-semibold">{title}</h2>

        <p className="mt-1 text-xs text-zinc-600">
          {description}
        </p>
      </div>
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
    <div className="rounded-lg border border-white/[0.05] bg-black/20 p-3">
      <div className="mb-2 text-[10px] uppercase tracking-wider text-zinc-600">
        {label}
      </div>

      <code className="break-all font-mono text-xs text-zinc-400">
        {value}
      </code>
    </div>
  );
}