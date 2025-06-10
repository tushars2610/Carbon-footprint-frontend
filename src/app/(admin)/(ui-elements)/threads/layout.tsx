import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Chat",
  description:
    "This is LLM Control page for TailAdmin - Next.js Tailwind CSS Admin Dashboard Template",
};

export default function PreviousChat({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return <>{children}</>;
} 