import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Carbon History",
  description:
    "This is LLM Control page for TailAdmin - Next.js Tailwind CSS Admin Dashboard Template",
};

export default function CarbonHistoryLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return <>{children}</>;
} 