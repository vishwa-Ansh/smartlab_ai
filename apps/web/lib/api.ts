const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:4000";

export type TestCase = {
  name: string;
  input: string;
  expected: string;
  actual: string;
  status: "passed" | "failed";
};

export type Issue = {
  type: "error" | "warning" | "info";
  title: string;
  description: string;
  line?: number;
};

export type Review = {
  id: string;
  fileName: string;
  language: string;
  createdAt: string;
  score: number;
  tests: {
    passed: number;
    total: number;
    cases?: TestCase[];
  };
  complexity: string;
};

export type ReviewDetail = {
  success: boolean;
  submission: {
    id: string;
    code: string;
    language: string;
    fileName: string;
    createdAt: string;
    score: number;

    syntax: {
      status: "passed" | "failed";
      message: string;
    };

    tests: {
      passed: number;
      total: number;
      cases: TestCase[];
    };

    complexity: {
      time: string;
      space: string;
      explanation: string;
    };

    issues: Issue[];

    metrics: {
      lines: number;
      codeLines: number;
      functions: number;
      comments: number;
    };

    aiReview: string[];
  };
};

export type CreateReviewResponse = {
  success: boolean;
  submissionId: string;
  message: string;

  review?: {
    score: number;

    syntax: {
      status: "passed" | "failed";
      message: string;
    };

    tests: {
      passed: number;
      total: number;
      cases: TestCase[];
    };

    complexity: {
      time: string;
      space: string;
      explanation: string;
    };

    issues: Issue[];

    metrics: {
      lines: number;
      codeLines: number;
      functions: number;
      comments: number;
    };

    aiReview: string[];
  };
};

export type AgentChange = {
  line: number;
  oldCode: string;
  newCode: string;
  reason: string;
};

export type AgentPatch = {
  success: boolean;
  originalCode: string;
  fixedCode: string;
  explanation: string;
  changes: AgentChange[];
};

export type AgentAnalysis = {
  language: string;
  issueCount: number;
  issues: Issue[];
};

export type AgentVerificationCase = {
  name: string;
  input: string;
  expected: string;
  actual: string;
  status: "passed" | "failed";
};

export type AgentVerification = {
  verified: boolean;
  reason: string;
  passed: number;
  total: number;
  cases: AgentVerificationCase[];
};

export type AgentResponse = {
  success: boolean;
  message: string;

  analysis: AgentAnalysis;

  patch?: AgentPatch;

  verification?: AgentVerification;

  actions?: Array<
    | "analyze"
    | "explain"
    | "generate_patch"
    | "verify"
  >;
};

export async function getReviews(): Promise<
  Review[]
> {
  const response = await fetch(
    `${API_URL}/api/reviews`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      "Failed to fetch reviews"
    );
  }

  const data =
    await response.json();

  return data.reviews || [];
}

export async function getReview(
  id: string
): Promise<ReviewDetail> {
  const response = await fetch(
    `${API_URL}/api/review/${id}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      "Failed to fetch review"
    );
  }

  return response.json();
}

export async function createReview(
  code: string,
  language: string,
  fileName: string,
  testCases?: Array<{
    name: string;
    input: string;
    expected: string;
  }>
): Promise<CreateReviewResponse> {
  const response = await fetch(
    `${API_URL}/api/review`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        code,
        language,
        fileName,
        testCases,
      }),
    }
  );

  if (!response.ok) {
    const errorData =
      await response
        .json()
        .catch(() => null);

    throw new Error(
      errorData?.message ||
        "Failed to create review"
    );
  }

  return response.json();
}

export async function executeCode(
  code: string,
  language: string
) {
  const response = await fetch(
    `${API_URL}/api/execute`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        code,
        language,
      }),
    }
  );

  if (!response.ok) {
    const errorData =
      await response
        .json()
        .catch(() => null);

    throw new Error(
      errorData?.error ||
        "Code execution failed"
    );
  }

  return response.json();
}

export async function testPython(
  code: string,
  functionName: string,
  testCases: Array<{
    name: string;
    input: string;
    expected: string;
  }>
) {
  const response = await fetch(
    `${API_URL}/api/test-python`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        code,
        functionName,
        testCases,
      }),
    }
  );

  if (!response.ok) {
    const errorData =
      await response
        .json()
        .catch(() => null);

    throw new Error(
      errorData?.error ||
        "Python test execution failed"
    );
  }

  return response.json();
}

export async function runAgent(
  code: string,
  language: string,
  question = "",
  issues: Issue[] = []
): Promise<AgentResponse> {
  const response = await fetch(
    `${API_URL}/api/agent`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        code,
        language,
        question,
        issues,
      }),
    }
  );

  const data =
    await response
      .json()
      .catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message ||
        "SmartLab agent failed"
    );
  }

  return data;
}

export async function fixCode(
  code: string,
  language: string,
  issues: Issue[] = []
): Promise<AgentResponse> {
  const response = await fetch(
    `${API_URL}/api/agent/fix`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        code,
        language,
        issues,
      }),
    }
  );

  const data =
    await response
      .json()
      .catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message ||
        "SmartLab could not fix the code"
    );
  }

  return data;
}

export async function checkHealth() {
  const response = await fetch(
    `${API_URL}/api/health`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      "SmartLab backend is unavailable"
    );
  }

  return response.json();
}