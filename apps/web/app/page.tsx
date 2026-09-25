"use client";

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

const recentReviews = [
  {
    name: "binary-search.py",
    language: "Python",
    score: 86,
    tests: "8/10",
    complexity: "O(n)",
    time: "2 min ago",
  },
  {
    name: "linked-list.cpp",
    language: "C++",
    score: 92,
    tests: "10/10",
    complexity: "O(n)",
    time: "18 min ago",
  },
  {
    name: "sorting.js",
    language: "JavaScript",
    score: 78,
    tests: "7/10",
    complexity: "O(n²)",
    time: "1 hour ago",
  },
  {
    name: "stack.py",
    language: "Python",
    score: 95,
    tests: "10/10",
    complexity: "O(1)",
    time: "3 hours ago",
  },
];

const activity = [
  {
    title: "Binary Search reviewed",
    description: "2 issues detected",
    time: "2 min ago",
    type: "review",
  },
  {
    title: "Assignment submitted",
    description: "Data Structures — Lab 04",
    time: "34 min ago",
    type: "assignment",
  },
  {
    title: "Test suite completed",
    description: "10/10 test cases passed",
    time: "1 hour ago",
    type: "test",
  },
];

export default function HomePage() {
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
                  Review your code, understand mistakes, and improve
                  your programming skills with intelligent feedback.
                </p>
              </div>

              <button className="flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-medium text-black transition hover:bg-zinc-200">
                <Plus size={16} />
                New Review
              </button>
            </div>
          </section>

          <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={<Code2 size={17} />}
              label="Total Reviews"
              value="24"
              change="+12%"
              description="from last month"
            />

            <StatCard
              icon={<Target size={17} />}
              label="Average Score"
              value="86%"
              change="+8%"
              description="from last month"
            />

            <StatCard
              icon={<CheckCircle2 size={17} />}
              label="Tests Passed"
              value="91%"
              change="+5%"
              description="across all reviews"
            />

            <StatCard
              icon={<TrendingUp size={17} />}
              label="Improvement"
              value="+18%"
              change="30 days"
              description="coding performance"
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

                <button className="flex items-center gap-1 text-xs text-zinc-500 transition hover:text-white">
                  View all
                  <ChevronRight size={14} />
                </button>
              </div>

              <div className="divide-y divide-white/[0.06]">
                {recentReviews.map((review) => (
                  <ReviewRow
                    key={review.name}
                    review={review}
                  />
                ))}
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
                  86%
                </span>

                <span className="mb-1 flex items-center gap-1 text-xs text-emerald-400">
                  <TrendingUp size={12} />
                  18%
                </span>
              </div>

              <div className="mt-6 flex h-28 items-end gap-2">
                {[42, 55, 48, 63, 58, 72, 68, 81, 76, 86].map(
                  (height, index) => (
                    <div
                      key={index}
                      className="group relative flex-1"
                    >
                      <div
                        className={`absolute bottom-0 w-full rounded-sm transition ${
                          index === 9
                            ? "bg-white"
                            : "bg-zinc-800 group-hover:bg-zinc-700"
                        }`}
                        style={{ height: `${height}%` }}
                      />
                    </div>
                  )
                )}
              </div>

              <div className="mt-3 flex justify-between text-[10px] text-zinc-700">
                <span>30 days ago</span>
                <span>Today</span>
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
                {activity.map((item, index) => (
                  <ActivityItem
                    key={index}
                    item={item}
                  />
                ))}
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
                  Your recent submissions frequently use linear
                  time complexity. Try identifying cases where
                  binary search or hashing can reduce complexity.
                </p>
              </div>

              <button className="mt-4 flex w-full items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-xs text-zinc-400 transition hover:bg-white/[0.04] hover:text-white">
                Explore recommendations
                <ArrowUpRight size={14} />
              </button>
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
                icon={<Code2 size={17} />}
                title="Review Code"
                description="Analyze your current implementation"
              />

              <QuickAction
                icon={<FileCode2 size={17} />}
                title="Assignments"
                description="View your active lab assignments"
              />

              <QuickAction
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

        <span className="text-[11px] text-emerald-400">
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
  review: {
    name: string;
    language: string;
    score: number;
    tests: string;
    complexity: string;
    time: string;
  };
}) {
  return (
    <div className="group flex items-center gap-4 p-5 transition hover:bg-white/[0.02]">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-zinc-500">
        <FileCode2 size={16} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">
          {review.name}
        </div>

        <div className="mt-1 flex items-center gap-2 text-xs text-zinc-600">
          <span>{review.language}</span>
          <span>•</span>
          <span>{review.time}</span>
        </div>
      </div>

      <div className="hidden text-right sm:block">
        <div className="text-xs text-zinc-600">
          Tests
        </div>

        <div className="mt-1 text-sm text-zinc-400">
          {review.tests}
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
    </div>
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
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <button className="group flex items-center gap-4 rounded-xl border border-white/[0.06] bg-black/20 p-4 text-left transition hover:border-white/[0.12] hover:bg-white/[0.03]">
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
    </button>
  );
}