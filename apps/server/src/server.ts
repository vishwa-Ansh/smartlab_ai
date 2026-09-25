import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

type Submission = {
  id: string;
  code: string;
  language: string;
  fileName: string;
  createdAt: string;
};

const submissions = new Map<string, Submission>();

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "SmartLab API is running",
  });
});

app.post("/api/review", (req, res) => {
  const { code, language, fileName } = req.body;

  if (!code || typeof code !== "string") {
    return res.status(400).json({
      success: false,
      message: "Code is required",
    });
  }

  const submissionId = crypto.randomUUID();

  const submission: Submission = {
    id: submissionId,
    code,
    language: language ?? "unknown",
    fileName: fileName ?? "unknown",
    createdAt: new Date().toISOString(),
  };

  submissions.set(submissionId, submission);

  console.log("New submission:", submission);

  return res.json({
    success: true,
    submissionId,
    message: "Code received successfully",
  });
});

app.get("/api/review/:submissionId", (req, res) => {
  const { submissionId } = req.params;

  const submission = submissions.get(submissionId);

  if (!submission) {
    return res.status(404).json({
      success: false,
      message: "Submission not found",
    });
  }

  return res.json({
    success: true,
    submission: {
      ...submission,

      score: 86,

      tests: {
        passed: 8,
        total: 10,
        cases: [
          {
            name: "Normal input",
            input: "[1,2,3,4,5], 3",
            expected: "2",
            actual: "2",
            status: "passed",
          },
          {
            name: "Target not found",
            input: "[1,2,3,4,5], 9",
            expected: "-1",
            actual: "-1",
            status: "passed",
          },
          {
            name: "Empty array",
            input: "[], 5",
            expected: "-1",
            actual: "IndexError",
            status: "failed",
          },
          {
            name: "Duplicate values",
            input: "[1,1,2,3], 1",
            expected: "0",
            actual: "0",
            status: "passed",
          },
        ],
      },

      complexity: "O(n)",

      requirements: {
        satisfied: 4,
        total: 5,
      },

      runtime: "42 ms",

      issues: [
        {
          type: "warning",
          title: "Complexity requirement",
          description:
            "Assignment requires O(log n), but the submitted implementation is O(n).",
        },
        {
          type: "error",
          title: "Empty array handling",
          description:
            "The code fails when an empty array is provided.",
        },
      ],

      aiReview: [
        "The implementation correctly handles normal search cases.",
        "The current implementation does not satisfy the required O(log n) complexity.",
        "The empty array case should be handled explicitly.",
      ],
    },
  });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`SmartLab API running on http://localhost:${PORT}`);
});