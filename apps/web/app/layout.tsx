import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SmartLab AI",
  description: "AI-powered smart code review and lab assistant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}