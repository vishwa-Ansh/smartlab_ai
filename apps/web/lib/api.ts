const API_URL = "http://localhost:4000";

export async function getReview(submissionId: string) {
  const response = await fetch(
    `${API_URL}/api/review/${submissionId}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch review");
  }

  return response.json();
}