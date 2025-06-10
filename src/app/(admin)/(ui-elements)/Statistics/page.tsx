import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import MonthlySalesChart from "@/components/ecommerce/MonthlySalesChart";
import MonthlyTarget from "@/components/ecommerce/MonthlyTarget";
import StatisticsChart from "@/components/ecommerce/StatisticsChart";
import {EcommerceMetrics} from "@/components/ecommerce/EcommerceMetrics";
import DemographicCard from "@/components/ecommerce/DemographicCard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Statistics | Carbon Emission",
  description:
    "This is Next.js Buttons page for TailAdmin - Next.js Tailwind CSS Admin Dashboard Template",
};

export default function StatisticsPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Statistics" />
        <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12 space-y-6 xl:col-span-7">
        <EcommerceMetrics />

        <MonthlySalesChart />
      </div>

      <div className="col-span-12 xl:col-span-5">
        <MonthlyTarget />
      </div>

      <div className="col-span-12">
        <StatisticsChart />
      </div>

      <div className="col-span-12 xl:col-span-12">
        <DemographicCard />
      </div>

      
    </div>
      
      
    </div>
  );
}
