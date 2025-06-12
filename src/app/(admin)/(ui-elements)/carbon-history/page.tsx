'use client';
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
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
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<boolean>(false);
  const [calculationToDelete, setCalculationToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);

  const fetchCalculations = async () => {
    try {
      setIsLoading(true);
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

  useEffect(() => {
    fetchCalculations();
  }, []);

  const handleViewDetails = (id: string) => {
    router.push(`/calculator?id=${id}`);
  }

  const handleDeleteClick = (timestamp: string) => {
    setCalculationToDelete(timestamp);
    setShowDeleteConfirmation(true);
  };

  const handleConfirmDelete = async () => {
    if (!calculationToDelete) return;

    try {
      setShowDeleteConfirmation(false);
      setIsDeleting(true);

      const response = await fetch(`https://carbon-footprint-backend-ktp9.onrender.com/carbon/calculations/${encodeURIComponent(calculationToDelete)}`, {
        method: 'DELETE',
        headers: {
          'accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Delete response:', data);
      setDeleteSuccess(data.message);
      
      // Refresh the list
      await fetchCalculations();
    } catch (error) {
      console.error('Error deleting calculation:', error);
      setError('Failed to delete calculation');
    } finally {
      setIsDeleting(false);
      setCalculationToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setCalculationToDelete(null);
    setShowDeleteConfirmation(false);
  };

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
                                onClick={() => handleDeleteClick(calc.timestamp)}
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <div className="flex flex-col">
              <div className="flex items-center mb-4">
                <div className="rounded-full bg-red-100 p-2 mr-3">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">Confirm Deletion</h3>
              </div>
              <p className="text-gray-600 mb-4">Are you sure you want to delete this calculation?</p>
              <div className="flex justify-end gap-3">
                <Button
                  size="md"
                  variant="outline"
                  onClick={handleCancelDelete}
                >
                  Cancel
                </Button>
                <Button
                  size="md"
                  variant="danger"
                  onClick={handleConfirmDelete}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Processing Section */}
      {isDeleting && (
        <div className="space-y-5 sm:space-y-6 mt-10">
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="px-6 py-5">
              <h3 className="text-base font-medium text-gray-800 dark:text-white/90">
                Processing Deletion
              </h3>
            </div>
            <div className="p-6 border-t border-gray-100 dark:border-gray-800 xl:p-10 flex flex-col items-center justify-center">
              <div className="w-16 h-16 border-4 border-t-red-500 border-b-red-500 border-l-gray-200 border-r-gray-200 rounded-full animate-spin mb-4"></div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Please wait</h4>
              <p className="text-gray-600 text-center">
                Your calculation is being deleted...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {deleteSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <div className="flex flex-col">
              <div className="flex items-center mb-4">
                <div className="rounded-full bg-green-100 p-2 mr-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">Delete Successful</h3>
              </div>
              <p className="text-gray-600 mb-4">{deleteSuccess}</p>
              <div className="flex justify-end">
                <Button
                  size="md"
                  variant="primary"
                  onClick={() => setDeleteSuccess(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}