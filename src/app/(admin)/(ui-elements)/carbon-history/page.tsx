'use client';
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChatIcon, TrashBinIcon } from "@/icons";
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from "react";

interface CalculationBreakdown {
  electricity_kg_co2: number;
  diet_kg_co2: number;
  transport_kg_co2: number;
  waste_kg_co2: number;
}

interface Calculation {
  _id: string;
  timestamp: string;
  total_monthly_emission_kg: number;
  breakdown: CalculationBreakdown;
  country: string;
  age: number;
  created_at: string;
}

interface CalculationsResponse {
  total_records: number;
  data: Calculation[];
}

export default function CarbonHistory() {
  const router = useRouter();
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCalculations = async () => {
      try {
        const response = await fetch('https://carbon-footprint-backend-ktp9.onrender.com/carbon/calculations?limit=10&offset=0&sort_order=desc', {
          method: 'GET',
          headers: {
            'accept': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: CalculationsResponse = await response.json();
        setCalculations(data.data);
      } catch (error) {
        console.error('Error fetching calculations:', error);
        setError('Failed to load calculation history');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCalculations();
  }, []);

  const handleViewDetails = (id: string) => {
    router.push(`/calculator?id=${id}`);
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="Carbon History" />
      <div className="space-y-6">
        <ComponentCard title="Calculation History">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
              <div className="min-w-[1102px]">
                <Table>
                  {/* Table Header */}
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                    <TableRow>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Date
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Total Emissions
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Country
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Age
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Breakdown
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHeader>

                  {/* Table Body */}
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {isLoading ? (
                      <TableRow>
                        <TableCell className="px-5 py-4 text-center w-full">
                          <div className="flex justify-center items-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-500"></div>
                            <span className="ml-2 text-gray-600 dark:text-gray-400">Loading...</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden">{''}</TableCell>
                        <TableCell className="hidden">{''}</TableCell>
                        <TableCell className="hidden">{''}</TableCell>
                        <TableCell className="hidden">{''}</TableCell>
                        <TableCell className="hidden">{''}</TableCell>
                      </TableRow>
                    ) : error ? (
                      <TableRow>
                        <TableCell className="px-5 py-4 text-center text-error-500 w-full">
                          {error}
                        </TableCell>
                        <TableCell className="hidden">{''}</TableCell>
                        <TableCell className="hidden">{''}</TableCell>
                        <TableCell className="hidden">{''}</TableCell>
                        <TableCell className="hidden">{''}</TableCell>
                        <TableCell className="hidden">{''}</TableCell>
                      </TableRow>
                    ) : calculations.length === 0 ? (
                      <TableRow>
                        <TableCell className="px-5 py-4 text-center text-gray-500 w-full">
                          No calculations found
                        </TableCell>
                        <TableCell className="hidden">{''}</TableCell>
                        <TableCell className="hidden">{''}</TableCell>
                        <TableCell className="hidden">{''}</TableCell>
                        <TableCell className="hidden">{''}</TableCell>
                        <TableCell className="hidden">{''}</TableCell>
                      </TableRow>
                    ) : (
                      calculations.map((calc) => (
                        <TableRow key={calc._id}>
                          <TableCell className="px-5 py-4 text-gray-500 dark:text-gray-400">
                            {format(new Date(calc.created_at), 'MMM dd, yyyy HH:mm')}
                          </TableCell>
                          <TableCell className="px-5 py-4">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {calc.total_monthly_emission_kg.toFixed(2)} kg CO₂
                            </span>
                          </TableCell>
                          <TableCell className="px-5 py-4 text-gray-500 dark:text-gray-400">
                            {calc.country}
                          </TableCell>
                          <TableCell className="px-5 py-4 text-gray-500 dark:text-gray-400">
                            {calc.age}
                          </TableCell>
                          <TableCell className="px-5 py-4">
                            <div className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Electricity:</span>
                                <span className="text-gray-900 dark:text-white">{calc.breakdown.electricity_kg_co2.toFixed(2)} kg</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Diet:</span>
                                <span className="text-gray-900 dark:text-white">{calc.breakdown.diet_kg_co2.toFixed(2)} kg</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Transport:</span>
                                <span className="text-gray-900 dark:text-white">{calc.breakdown.transport_kg_co2.toFixed(2)} kg</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Waste:</span>
                                <span className="text-gray-900 dark:text-white">{calc.breakdown.waste_kg_co2.toFixed(2)} kg</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-5 py-4">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleViewDetails(calc._id)}
                                className="p-2 text-brand-500 hover:text-brand-600 transition-colors duration-200"
                                title="View Details"
                              >
                                <ChatIcon className="w-5 h-5" />
                              </button>
                              <button
                                className="p-2 text-error-500 hover:text-error-600 transition-colors duration-200"
                                title="Delete"
                              >
                                <TrashBinIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </ComponentCard>
      </div>
    </div>
  );
}