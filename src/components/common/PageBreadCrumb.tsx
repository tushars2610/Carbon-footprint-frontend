"use client";
import Link from "next/link";
import React from "react";
import { usePathname } from "next/navigation";

interface BreadcrumbProps {
  pageTitle: string;
  subPage?: string; // Optional subPage prop
}

const PageBreadcrumb: React.FC<BreadcrumbProps> = ({ pageTitle, subPage }) => {
  const pathname = usePathname();

  // Construct breadcrumb items dynamically
  const breadcrumbItems = [
    { label: "Home", path: "/" },
    { label: pageTitle, path: subPage ? "/threads" : pathname },
    ...(subPage ? [{ label: subPage, path: pathname }] : []),
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
      <h2
        className="text-xl font-semibold text-gray-800 dark:text-white/90"
        x-text="pageName"
      >
        {subPage || pageTitle}
      </h2>
      <nav>
        <ol className="flex items-center gap-1.5">
          {breadcrumbItems.map((item, index) => (
            <li key={item.path} className="flex items-center gap-1.5">
              {index < breadcrumbItems.length - 1 ? (
                <>
                  <Link
                    className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400"
                    href={item.path}
                  >
                    {item.label}
                  </Link>
                  <svg
                    className="stroke-current"
                    width="17"
                    height="16"
                    viewBox="0 0 17 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M6.0765 12.667L10.2432 8.50033L6.0765 4.33366"
                      stroke=""
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </>
              ) : (
                <span className="text-sm text-gray-800 dark:text-white/90">
                  {item.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
};

export default PageBreadcrumb;
