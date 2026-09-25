"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  ArrowLeft,
  Search,
  Filter,
  FileCode2,
  CheckCircle2,
  Clock3,
  ChevronRight,
  Loader2,
  AlertCircle,
} from "lucide-react";

import Sidebar from "@/components/Sidebar";
import { getReviews, type Review } from "@/lib/api";

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

function formatDate(dateString: string) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleString();
}

function getScoreClass(score: number) {
  if (score >= 90) {
    return "text-emerald-400";
  }

  if (score >= 70) {
    return "text-yellow-400";
  }

  return "text-red-400";
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [language, setLanguage] = useState("all");
  const [scoreFilter, setScoreFilter] = useState("all");

  useEffect(() => {
    async function loadReviews() {
      try {
        setLoading(true);
        setError("");

        const data = await getReviews();

        setReviews(data);
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load reviews."
        );
      } finally {
        setLoading(false);
      }
    }

    loadReviews();
  }, []);

  const languages = useMemo(() => {
    const values = new Set(
      reviews.map((review) =>
        review.language.toLowerCase()
      )
    );

    return Array.from(values);
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => {
      const matchesSearch =
        review.fileName
          .toLowerCase()
          .includes(
            search.toLowerCase()
          );

      const matchesLanguage =
        language === "all" ||
        review.language.toLowerCase() ===
          language.toLowerCase();

      let matchesScore = true;

      if (scoreFilter === "90") {
        matchesScore = review.score >= 90;
      }

      if (scoreFilter === "70") {
        matchesScore =
          review.score >= 70 &&
          review.score < 90;
      }

      if (scoreFilter === "0") {
        matchesScore = review.score < 70;
      }

      return (
        matchesSearch &&
        matchesLanguage &&
        matchesScore
      );
    });
  }, [
    reviews,
    search,
    language,
    scoreFilter,
  ]);

  const totalReviews = reviews.length;

  const averageScore =
    reviews.length > 0
      ? Math.round(
          reviews.reduce(
            (sum, review) =>
              sum + review.score,
            0
          ) / reviews.length
        )
      : 0;

  const totalPassed =
    reviews.reduce(
      (sum, review) =>
        sum + review.tests.passed,
      0
    );

  const totalTests =
    reviews.reduce(
      (sum, review) =>
        sum + review.tests.total,
      0
    );

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
                  Review History
                </div>

                <div className="text-xs text-zinc-600">
                  SmartLab AI
                </div>

              </div>

            </div>

            <Link
              href="/review"
              className="flex h-9 items-center gap-2 rounded-lg bg-white px-3 text-xs font-medium text-black transition hover:bg-zinc-200"
            >
              <FileCode2 size={14} />
              New Review
            </Link>

          </div>

        </header>

        <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8">

          <div className="mb-8">

            <div className="mb-3 text-xs text-zinc-600">
              SmartLab AI
            </div>

            <h1 className="text-2xl font-semibold tracking-tight">
              Review History
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              Browse previous code analysis results
              and execution reports.
            </p>

          </div>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            <SummaryCard
              label="Total Reviews"
              value={totalReviews}
              icon={
                <FileCode2 size={17} />
              }
            />

            <SummaryCard
              label="Average Score"
              value={`${averageScore}%`}
              icon={
                <CheckCircle2 size={17} />
              }
            />

            <SummaryCard
              label="Tests Passed"
              value={`${totalPassed}/${totalTests}`}
              icon={
                <CheckCircle2 size={17} />
              }
            />

            <SummaryCard
              label="Languages"
              value={languages.length}
              icon={
                <Clock3 size={17} />
              }
            />

          </section>

          <section className="mt-6 rounded-2xl border border-white/[0.07] bg-white/[0.025]">

            <div className="border-b border-white/[0.07] p-5">

              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                <div>

                  <h2 className="text-sm font-semibold">
                    All Reviews
                  </h2>

                  <p className="mt-1 text-xs text-zinc-600">
                    {filteredReviews.length} reviews
                  </p>

                </div>

                <div className="flex flex-col gap-2 sm:flex-row">

                  <div className="relative">

                    <Search
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"
                    />

                    <input
                      value={search}
                      onChange={(e) =>
                        setSearch(
                          e.target.value
                        )
                      }
                      placeholder="Search files..."
                      className="h-9 w-full rounded-lg border border-white/[0.07] bg-black/20 pl-9 pr-3 text-xs text-zinc-300 outline-none placeholder:text-zinc-700 focus:border-white/20 sm:w-52"
                    />

                  </div>

                  <div className="flex items-center gap-2">

                    <Filter
                      size={14}
                      className="text-zinc-600"
                    />

                    <select
                      value={language}
                      onChange={(e) =>
                        setLanguage(
                          e.target.value
                        )
                      }
                      className="h-9 rounded-lg border border-white/[0.07] bg-[#111317] px-3 text-xs text-zinc-400 outline-none"
                    >

                      <option value="all">
                        All languages
                      </option>

                      {languages.map(
                        (item) => (
                          <option
                            key={item}
                            value={item}
                          >
                            {getLanguageLabel(
                              item
                            )}
                          </option>
                        )
                      )}

                    </select>

                    <select
                      value={scoreFilter}
                      onChange={(e) =>
                        setScoreFilter(
                          e.target.value
                        )
                      }
                      className="h-9 rounded-lg border border-white/[0.07] bg-[#111317] px-3 text-xs text-zinc-400 outline-none"
                    >

                      <option value="all">
                        All scores
                      </option>

                      <option value="90">
                        90+
                      </option>

                      <option value="70">
                        70–89
                      </option>

                      <option value="0">
                        Below 70
                      </option>

                    </select>

                  </div>

                </div>

              </div>

            </div>

            {loading && (
              <div className="flex min-h-[400px] flex-col items-center justify-center">

                <Loader2
                  size={22}
                  className="animate-spin text-zinc-500"
                />

                <p className="mt-4 text-xs text-zinc-600">
                  Loading review history...
                </p>

              </div>
            )}

            {!loading && error && (
              <div className="flex min-h-[400px] flex-col items-center justify-center px-5 text-center">

                <AlertCircle
                  size={22}
                  className="text-red-400"
                />

                <h3 className="mt-4 text-sm font-medium text-red-300">
                  Unable to load reviews
                </h3>

                <p className="mt-2 max-w-md text-xs leading-5 text-zinc-600">
                  {error}
                </p>

              </div>
            )}

            {!loading &&
              !error &&
              filteredReviews.length === 0 && (
                <div className="flex min-h-[400px] flex-col items-center justify-center px-5 text-center">

                  <FileCode2
                    size={24}
                    className="text-zinc-700"
                  />

                  <h3 className="mt-4 text-sm font-medium text-zinc-400">
                    No reviews found
                  </h3>

                  <p className="mt-2 max-w-md text-xs leading-5 text-zinc-700">
                    Try changing your filters or
                    create a new code review.
                  </p>

                  <Link
                    href="/review"
                    className="mt-5 rounded-lg bg-white px-4 py-2 text-xs font-medium text-black transition hover:bg-zinc-200"
                  >
                    Create Review
                  </Link>

                </div>
              )}

            {!loading &&
              !error &&
              filteredReviews.length > 0 && (
                <div className="divide-y divide-white/[0.05]">

                  {filteredReviews.map(
                    (review) => (
                      <ReviewRow
                        key={review.id}
                        review={review}
                      />
                    )
                  )}

                </div>
              )}

          </section>

        </div>

      </main>

    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">

      <div className="flex items-center gap-2 text-xs text-zinc-600">

        {icon}

        {label}

      </div>

      <div className="mt-4 text-2xl font-semibold">
        {value}
      </div>

    </div>
  );
}

function ReviewRow({
  review,
}: {
  review: Review;
}) {
  const passed =
    review.tests.passed;

  const total =
    review.tests.total;

  const allPassed =
    total > 0 &&
    passed === total;

  return (
    <Link
      href={`/review/${review.id}`}
      className="group block px-5 py-5 transition hover:bg-white/[0.02]"
    >

      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

        <div className="flex min-w-0 items-center gap-4">

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-black/20 text-zinc-500">

            <FileCode2 size={17} />

          </div>

          <div className="min-w-0">

            <div className="truncate text-sm font-medium text-zinc-300 group-hover:text-white">
              {review.fileName}
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-700">

              <span>
                {getLanguageLabel(
                  review.language
                )}
              </span>

              <span>•</span>

              <span>
                {formatDate(
                  review.createdAt
                )}
              </span>

            </div>

          </div>

        </div>

        <div className="flex flex-wrap items-center gap-6">

          <div>

            <div className="text-[10px] uppercase tracking-wider text-zinc-700">
              Score
            </div>

            <div
              className={`mt-1 text-sm font-semibold ${getScoreClass(
                review.score
              )}`}
            >
              {review.score}%
            </div>

          </div>

          <div>

            <div className="text-[10px] uppercase tracking-wider text-zinc-700">
              Tests
            </div>

            <div
              className={`mt-1 flex items-center gap-1 text-sm font-medium ${
                allPassed
                  ? "text-emerald-400"
                  : "text-yellow-400"
              }`}
            >

              {allPassed ? (
                <CheckCircle2
                  size={13}
                />
              ) : (
                <AlertCircle
                  size={13}
                />
              )}

              {passed}/{total}

            </div>

          </div>

          <div>

            <div className="text-[10px] uppercase tracking-wider text-zinc-700">
              Complexity
            </div>

            <div className="mt-1 font-mono text-sm text-zinc-400">
              {review.complexity}
            </div>

          </div>

          <ChevronRight
            size={16}
            className="text-zinc-700 transition group-hover:translate-x-0.5 group-hover:text-zinc-400"
          />

        </div>

      </div>

    </Link>
  );
}