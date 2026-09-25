"use client";

import {
  ArrowUpRight,
  CheckCircle2,
  Code2,
  FileCode2,
  Filter,
  Search,
  SlidersHorizontal,
  XCircle,
} from "lucide-react";
import { useState } from "react";

const reviews = [
  {
    id: "58a6da47-e1eb-4f2b-8adb-d85ff1a1bb72",
    file: "binary-search.py",
    language: "Python",
    score: 86,
    passed: 8,
    total: 10,
    complexity: "O(n)",
    status: "Needs attention",
    time: "2 min ago",
  },
  {
    id: "review-002",
    file: "linked-list.cpp",
    language: "C++",
    score: 92,
    passed: 10,
    total: 10,
    complexity: "O(n)",
    status: "Passed",
    time: "18 min ago",
  },
  {
    id: "review-003",
    file: "sorting.js",
    language: "JavaScript",
    score: 78,
    passed: 7,
    total: 10,
    complexity: "O(n²)",
    status: "Needs attention",
    time: "1 hour ago",
  },
  {
    id: "review-004",
    file: "stack.py",
    language: "Python",
    score: 95,
    passed: 10,
    total: 10,
    complexity: "O(1)",
    status: "Passed",
    time: "3 hours ago",
  },
  {
    id: "review-005",
    file: "queue.cpp",
    language: "C++",
    score: 88,
    passed: 9,
    total: 10,
    complexity: "O(n)",
    status: "Passed",
    time: "Yesterday",
  },
];

export default function ReviewsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const filteredReviews = reviews.filter((review) => {
    const matchesSearch =
      review.file
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      review.language
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchesFilter =
      filter === "All" ||
      (filter === "Passed" && review.status === "Passed") ||
      (filter === "Needs attention" &&
        review.status === "Needs attention");

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-[#08090b] text-white lg:pl-64">
      <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs text-zinc-600">
              <span>Workspace</span>
              <span>/</span>
              <span>Reviews</span>
            </div>

            <h1 className="text-3xl font-semibold tracking-tight">
              Reviews
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              Review your previous code submissions and analysis
              results.
            </p>
          </div>

          <button className="flex h-10 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-medium text-black transition hover:bg-zinc-200">
            <Code2 size={16} />
            New Review
          </button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <SummaryCard
            label="Total Reviews"
            value="24"
            description="All submissions"
          />

          <SummaryCard
            label="Average Score"
            value="86%"
            description="Across all reviews"
          />

          <SummaryCard
            label="Tests Passed"
            value="91%"
            description="Overall test success"
          />
        </div>

        <div className="mt-6 rounded-2xl border border-white/[0.07] bg-white/[0.025]">
          <div className="flex flex-col gap-4 border-b border-white/[0.07] p-4 sm:flex-row">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"
              />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search reviews..."
                className="h-10 w-full rounded-lg border border-white/[0.07] bg-black/20 pl-9 pr-9 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-white/[0.15]"
              />

              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white"
                >
                  <XCircle size={15} />
                </button>
              )}
            </div>

            <div className="flex gap-2">
              {["All", "Passed", "Needs attention"].map(
                (item) => (
                  <button
                    key={item}
                    onClick={() => setFilter(item)}
                    className={`rounded-lg px-3 py-2 text-xs transition ${
                      filter === item
                        ? "bg-white text-black"
                        : "border border-white/[0.07] bg-white/[0.02] text-zinc-500 hover:text-white"
                    }`}
                  >
                    {item}
                  </button>
                )
              )}

              <button className="flex items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2 text-xs text-zinc-500 hover:text-white">
                <SlidersHorizontal size={14} />
                <span className="hidden sm:inline">
                  Filter
                </span>
              </button>
            </div>
          </div>

          <div className="hidden border-b border-white/[0.07] px-5 py-3 text-[10px] uppercase tracking-[0.15em] text-zinc-700 md:grid md:grid-cols-[1.8fr_0.7fr_0.7fr_0.7fr_0.9fr_20px]">
            <span>File</span>
            <span>Score</span>
            <span>Tests</span>
            <span>Complexity</span>
            <span>Status</span>
            <span />
          </div>

          <div className="divide-y divide-white/[0.06]">
            {filteredReviews.length > 0 ? (
              filteredReviews.map((review) => (
                <ReviewItem
                  key={review.id}
                  review={review}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.05]">
                  <Search size={17} className="text-zinc-600" />
                </div>

                <div className="mt-4 text-sm font-medium">
                  No reviews found
                </div>

                <p className="mt-1 text-xs text-zinc-600">
                  Try changing your search or filter.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between text-xs text-zinc-700">
          <span>
            Showing {filteredReviews.length} of {reviews.length}{" "}
            reviews
          </span>

          <div className="flex items-center gap-2">
            <button className="rounded-lg border border-white/[0.06] px-3 py-2 hover:text-white">
              Previous
            </button>

            <button className="rounded-lg border border-white/[0.06] px-3 py-2 hover:text-white">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
      <div className="text-xs text-zinc-600">
        {label}
      </div>

      <div className="mt-3 text-3xl font-semibold tracking-tight">
        {value}
      </div>

      <div className="mt-1 text-xs text-zinc-700">
        {description}
      </div>
    </div>
  );
}

function ReviewItem({
  review,
}: {
  review: {
    id: string;
    file: string;
    language: string;
    score: number;
    passed: number;
    total: number;
    complexity: string;
    status: string;
    time: string;
  };
}) {
  const reviewUrl = `/review/${review.id}`;

  return (
    <a
      href={reviewUrl}
      className="group block px-5 py-5 transition hover:bg-white/[0.02]"
    >
      <div className="grid items-center gap-4 md:grid-cols-[1.8fr_0.7fr_0.7fr_0.7fr_0.9fr_20px]">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-zinc-500">
            <FileCode2 size={16} />
          </div>

          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-zinc-200">
              {review.file}
            </div>

            <div className="mt-1 text-xs text-zinc-700">
              {review.language} · {review.time}
            </div>
          </div>
        </div>

        <div className="text-sm font-semibold">
          {review.score}%
        </div>

        <div className="flex items-center gap-1.5 text-sm text-zinc-400">
          {review.passed === review.total ? (
            <CheckCircle2
              size={14}
              className="text-emerald-400"
            />
          ) : (
            <XCircle
              size={14}
              className="text-amber-400"
            />
          )}

          {review.passed}/{review.total}
        </div>

        <div className="font-mono text-sm text-zinc-500">
          {review.complexity}
        </div>

        <div>
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-medium ${
              review.status === "Passed"
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-amber-500/10 text-amber-400"
            }`}
          >
            {review.status}
          </span>
        </div>

        <ArrowUpRight
          size={15}
          className="text-zinc-700 transition group-hover:text-white"
        />
      </div>
    </a>
  );
}