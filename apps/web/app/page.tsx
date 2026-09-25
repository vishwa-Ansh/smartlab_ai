"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Code2,
  FileCode2,
  GitBranch,
  MoreHorizontal,
  Plus,
  Sparkles,
  Target,
  Terminal,
  TrendingUp,
  Zap,
} from "lucide-react";

import Sidebar from "@/components/Sidebar";
import { getReviews, type Review } from "@/lib/api";

function getRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();

  const diff = Math.max(0, now.getTime() - date.getTime());

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 30) return "just now";
  if (minutes < 1) return `${seconds} sec ago`;
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;

  return date.toLocaleDateString();
}

function getLanguageLabel(language: string) {
  const map: Record<string, string> = {
    javascript: "JavaScript",
    js: "JavaScript",
    typescript: "TypeScript",
    ts: "TypeScript",
    python: "Python",
    py: "Python",
    cpp: "C++",
    "c++": "C++",
    c: "C",
    java: "Java",
    go: "Go",
    rust: "Rust",
  };

  return map[language.toLowerCase()] || language;
}

export default function HomePage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [backendError, setBackendError] = useState(false);

  useEffect(() => {
    async function loadReviews() {
      try {
        setLoadingReviews(true);
        setBackendError(false);

        const data = await getReviews();

        setReviews(data);
      } catch (error) {
        console.error("Failed to load reviews:", error);
        setBackendError(true);
      } finally {
        setLoadingReviews(false);
      }
    }

    loadReviews();
  }, []);

  const totalReviews = reviews.length;

  const averageScore =
    totalReviews > 0
      ? Math.round(
          reviews.reduce((sum, review) => sum + review.score, 0) /
            totalReviews
        )
      : 0;

  const totalTests = reviews.reduce(
    (sum, review) => sum + review.tests.total,
    0
  );

  const passedTests = reviews.reduce(
    (sum, review) => sum + review.tests.passed,
    0
  );

  const testsPassedPercentage =
    totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

  const performanceValues = useMemo(() => {
    if (reviews.length === 0) {
      return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    }

    const scores = reviews
      .slice(0, 10)
      .reverse()
      .map((review) => review.score);

    if (scores.length >= 10) {
      return scores;
    }

    const first = scores[0] ?? averageScore;

    return [
      ...Array(Math.max(0, 10 - scores.length)).fill(first),
      ...scores,
    ];
  }, [reviews, averageScore]);

  const recentReviews = reviews.slice(0, 4);

  const activity = reviews.slice(0, 4).map((review) => ({
    title: `${review.fileName} reviewed`,
    description: `${review.tests.passed}/${review.tests.total} test cases passed`,
    time: getRelativeTime(review.createdAt),
    type: "review",
  }));

  return (
    <div className="min-h-screen bg-[#08090b] text-white">
      <Sidebar />

      <main className="lg:pl-64">
        <header className="sticky top-0 z-40 h-16 border-b border-white/[0.07] bg-[#08090b]/85 backdrop-blur-xl">
          <div className="flex h-full items-center justify-between px-5 sm:px-8">
            <div>
              <div className="text-sm font-medium text-zinc-300">
                Workspace
              </div>

              <div className="hidden text-xs text-zinc-600 sm:block">
                SmartLab AI
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="hidden items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 py-2 text-xs text-zinc-400 transition hover:border-white/[0.12] hover:text-white sm:flex">
                <GitBranch size={14} />
                Main
              </button>

              <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.025] text-zinc-500 transition hover:text-white">
                <MoreHorizontal size={17} />
              </button>

              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold">
                A
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8">
          <section className="relative overflow-hidden rounded-3xl border border-white/[0.07] bg-white/[0.025] p-6 sm:p-8">
            <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-white/[0.025] blur-3xl" />

            <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1.5 text-[11px] text-zinc-500">
                  <Sparkles size={12} />
                  AI-powered code workspace
                </div>

                <h1 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
                  Good evening, Ansh.
                </h1>

                <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-500">
                  Review your code, understand mistakes, and improve your
                  programming skills with intelligent feedback.
                </p>
              </div>

              <Link
                href="/review"
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-medium text-black transition hover:bg-zinc-200"
              >
                <Plus size={16} />
                New Review
              </Link>
            </div>
          </section>

          <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={<Code2 size={17} />}
              label="Total Reviews"
              value={loadingReviews ? "—" : String(totalReviews)}
              change={backendError ? "Offline" : "Live"}
              description="from SmartLab backend"
            />

            <StatCard
              icon={<Target size={17} />}
              label="Average Score"
              value={loadingReviews ? "—" : `${averageScore}%`}
              change="Current"
              description="across all reviews"
            />

            <StatCard
              icon={<CheckCircle2 size={17} />}
              label="Tests Passed"
              value={
                loadingReviews ? "—" : `${testsPassedPercentage}%`
              }
              change="Current"
              description="across all reviews"
            />

            <StatCard
              icon={<TrendingUp size={17} />}
              label="Improvement"
              value="—"
              change="Coming"
              description="requires historical data"
            />
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_0.8fr]">
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025]">
              <div className="flex items-center justify-between border-b border-white/[0.07] p-5">
                <div>
                  <h2 className="text-sm font-semibold">
                    Recent Reviews
                  </h2>

                  <p className="mt-1 text-xs text-zinc-600">
                    Your latest code analysis
                  </p>
                </div>

                <Link
                  href="/reviews"
                  className="flex items-center gap-1 text-xs text-zinc-500 transition hover:text-white"
                >
                  View all
                  <ChevronRight size={14} />
                </Link>
              </div>

              <div className="divide-y divide-white/[0.06]">
                {loadingReviews ? (
                  <div className="p-8 text-center text-sm text-zinc-600">
                    Loading reviews...
                  </div>
                ) : backendError ? (
                  <div className="p-8 text-center">
                    <div className="text-sm text-zinc-400">
                      Backend unavailable
                    </div>

                    <div className="mt-2 text-xs text-zinc-700">
                      Start the SmartLab server on port 4000.
                    </div>
                  </div>
                ) : recentReviews.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="text-sm text-zinc-400">
                      No reviews yet
                    </div>

                    <div className="mt-2 text-xs text-zinc-700">
                      Create your first code review.
                    </div>
                  </div>
                ) : (
                  recentReviews.map((review) => (
                    <ReviewRow
                      key={review.id}
                      review={review}
                    />
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-sm font-semibold">
                    Performance
                  </h2>

                  <p className="mt-1 text-xs text-zinc-600">
                    Coding progress
                  </p>
                </div>

                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-zinc-400">
                  <Zap size={15} />
                </div>
              </div>

              <div className="mt-8 flex items-end gap-3">
                <span className="text-4xl font-semibold tracking-tight">
                  {loadingReviews ? "—" : `${averageScore}%`}
                </span>

                {totalReviews > 0 && (
                  <span className="mb-1 flex items-center gap-1 text-xs text-zinc-500">
                    <TrendingUp size={12} />
                    Live
                  </span>
                )}
              </div>

              <div className="mt-6 flex h-28 items-end gap-2">
                {performanceValues.map((height, index) => (
                  <div
                    key={index}
                    className="group relative flex-1"
                  >
                    <div
                      className={`absolute bottom-0 w-full rounded-sm transition ${
                        index === performanceValues.length - 1
                          ? "bg-white"
                          : "bg-zinc-800 group-hover:bg-zinc-700"
                      }`}
                      style={{
                        height: `${Math.max(4, height)}%`,
                      }}
                    />
                  </div>
                ))}
              </div>

              <div className="mt-3 flex justify-between text-[10px] text-zinc-700">
                <span>Oldest</span>
                <span>Latest</span>
              </div>
            </div>
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.75fr]">
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold">
                    Activity
                  </h2>

                  <p className="mt-1 text-xs text-zinc-600">
                    Recent workspace activity
                  </p>
                </div>

                <Clock3 size={16} className="text-zinc-700" />
              </div>

              <div className="mt-6 space-y-5">
                {activity.length === 0 ? (
                  <div className="py-5 text-sm text-zinc-600">
                    No recent activity.
                  </div>
                ) : (
                  activity.map((item, index) => (
                    <ActivityItem
                      key={index}
                      item={item}
                    />
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.06] text-zinc-300">
                  <Sparkles size={16} />
                </div>

                <div>
                  <h2 className="text-sm font-semibold">
                    SmartLab Insight
                  </h2>

                  <p className="mt-1 text-xs text-zinc-600">
                    Based on your recent reviews
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-white/[0.06] bg-black/20 p-4">
                <div className="flex items-center gap-2 text-xs font-medium text-zinc-300">
                  <Terminal size={14} />
                  Complexity
                </div>

                <p className="mt-3 text-sm leading-6 text-zinc-500">
                  {totalReviews === 0
                    ? "Submit your first review to receive complexity insights based on your code."
                    : "Review your recent submissions and identify cases where a better algorithm or data structure can reduce time complexity."}
                </p>
              </div>

              <Link
                href="/reviews"
                className="mt-4 flex w-full items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-xs text-zinc-400 transition hover:bg-white/[0.04] hover:text-white"
              >
                Explore reviews
                <ArrowUpRight size={14} />
              </Link>
            </div>
          </section>

          <section className="mt-6 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">
                  Quick Actions
                </h2>

                <p className="mt-1 text-xs text-zinc-600">
                  Start working on your code
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <QuickAction
                href="/review"
                icon={<Code2 size={17} />}
                title="Review Code"
                description="Analyze your current implementation"
              />

              <QuickAction
                href="/reviews"
                icon={<FileCode2 size={17} />}
                title="Review History"
                description="View your previous code reviews"
              />

              <QuickAction
                href="/review"
                icon={<Terminal size={17} />}
                title="Test Playground"
                description="Run and inspect test cases"
              />
            </div>
          </section>

          <footer className="mt-10 border-t border-white/[0.07] py-6 text-center text-xs text-zinc-700">
            SmartLab AI · Intelligent coding laboratory
          </footer>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  change,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  change: string;
  description: string;
}) {
  return (
    <div className="group rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 transition hover:border-white/[0.12] hover:bg-white/[0.035]">
      <div className="flex items-center justify-between">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-zinc-400">
          {icon}
        </div>

        <span className="text-[11px] text-zinc-500">
          {change}
        </span>
      </div>

      <div className="mt-5 text-3xl font-semibold tracking-tight">
        {value}
      </div>

      <div className="mt-1 text-sm text-zinc-400">
        {label}
      </div>

      <div className="mt-1 text-xs text-zinc-700">
        {description}
      </div>
    </div>
  );
}

function ReviewRow({
  review,
}: {
  review: Review;
}) {
  return (
    <Link
      href={`/review/${review.id}`}
      className="group flex items-center gap-4 p-5 transition hover:bg-white/[0.02]"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-zinc-500">
        <FileCode2 size={16} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">
          {review.fileName}
        </div>

        <div className="mt-1 flex items-center gap-2 text-xs text-zinc-600">
          <span>{getLanguageLabel(review.language)}</span>
          <span>•</span>
          <span>{getRelativeTime(review.createdAt)}</span>
        </div>
      </div>

      <div className="hidden text-right sm:block">
        <div className="text-xs text-zinc-600">
          Tests
        </div>

        <div className="mt-1 text-sm text-zinc-400">
          {review.tests.passed}/{review.tests.total}
        </div>
      </div>

      <div className="hidden text-right md:block">
        <div className="text-xs text-zinc-600">
          Complexity
        </div>

        <div className="mt-1 font-mono text-sm text-zinc-400">
          {review.complexity}
        </div>
      </div>

      <div className="w-14 text-right">
        <div className="text-sm font-semibold">
          {review.score}%
        </div>
      </div>

      <ChevronRight
        size={15}
        className="text-zinc-700 transition group-hover:text-zinc-400"
      />
    </Link>
  );
}

function ActivityItem({
  item,
}: {
  item: {
    title: string;
    description: string;
    time: string;
    type: string;
  };
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-zinc-600" />

      <div className="min-w-0 flex-1">
        <div className="text-sm text-zinc-300">
          {item.title}
        </div>

        <div className="mt-1 text-xs text-zinc-600">
          {item.description}
        </div>
      </div>

      <div className="shrink-0 text-[11px] text-zinc-700">
        {item.time}
      </div>
    </div>
  );
}

function QuickAction({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-xl border border-white/[0.06] bg-black/20 p-4 text-left transition hover:border-white/[0.12] hover:bg-white/[0.03]"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-zinc-500 transition group-hover:text-white">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-zinc-300">
          {title}
        </div>

        <div className="mt-1 text-xs text-zinc-600">
          {description}
        </div>
      </div>

      <ArrowUpRight
        size={15}
        className="text-zinc-700 transition group-hover:text-zinc-400"
      />
    </Link>
  );
}