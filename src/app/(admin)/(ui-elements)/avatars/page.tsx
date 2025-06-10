import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";
import AvatarSelector from "./AvatarSelector";

export const metadata: Metadata = {
  title: "Next.js Avatars | TailAdmin - Next.js Dashboard Template",
  description:
    "This is Next.js Avatars page for TailAdmin - Next.js Tailwind CSS Admin Dashboard Template",
};

export default function AvatarPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="AI Agent UI" />
      <div className="space-y-5 sm:space-y-6">
        <ComponentCard title="Ai Agent Controls">
          <AvatarSelector />
        </ComponentCard>
      </div>
    </div>
  );
}
