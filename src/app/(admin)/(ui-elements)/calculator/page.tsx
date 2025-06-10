"use client"
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

interface TransportEntry {
  mode: string;
  monthly_distance: string;
  description: string;
}

interface TransportMode {
  name: string;
  emission_per_km: number;
}

interface WasteGeneration {
  food_waste: number;
  plastic: number;
  paper: number;
  metal: number;
  textile: number;
  electronic: number;
  organic_yard: number;
}

interface FormData {
  age: number;
  country: string;
  monthly_electricity_kwh: string;
  transport: TransportEntry[];
  eating_habits: string;
  waste_generation: WasteGeneration;
  description: string;
}

interface CalculationResponse {
  total_monthly_emission_kg: number;
  breakdown: {
    electricity_kg_co2: number;
    diet_kg_co2: number;
    transport_kg_co2: number;
    waste_kg_co2: number;
  };
  details: {
    electricity: {
      country: string;
      kwh_consumed: number;
      carbon_intensity_gCO2_per_kwh: number;
      emission_kg_co2: number;
    };
    diet: {
      age: number;
      age_group: string;
      diet_type: string;
      emission_kg_co2: number;
    };
    transport: {
      total_emission_kg: number;
      transport_breakdown: Array<{
        mode: string;
        monthly_distance_km: number;
        emission_per_km: number;
        total_emission_kg: number;
        description: string;
      }>;
    };
    waste: {
      total_emission_kg: number;
      waste_breakdown: Array<{
        type: string;
        amount: number;
        emission_kg: number;
      }>;
    };
    user_description: string;
    calculation_timestamp: string;
  };
  llm_insights: {
    adjusted_emission_estimate: number | null;
    insights: string;
    reduction_suggestions: string[];
    confidence_level: string;
  };
  timestamp: string;
}

const COLORS = ['#16a34a', '#059669', '#0d9488', '#0891b2'];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      name: string;
      value: number;
    };
  }>;
}

// interface LegendProps {
//   value: string;
//   color?: string;
//   payload?: {
//     value: string;
//     color: string;
//   };
// }

// Mock PageBreadcrumb component since it's not available
const PageBreadcrumb = ({ pageTitle }: { pageTitle: string }) => (
  <div className="mb-6">
    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{pageTitle}</h1>
  </div>
);

export default function Calculator() {
  const [formData, setFormData] = useState<FormData>({
    age: 25,
    country: '',
    monthly_electricity_kwh: '',
    transport: [
      {
        mode: '',
        monthly_distance: '',
        description: ''
      }
    ],
    eating_habits: '',
    waste_generation: {
      food_waste: 0,
      plastic: 0,
      paper: 0,
      metal: 0,
      textile: 0,
      electronic: 0,
      organic_yard: 0
    },
    description: ''
  });

  // Add validation function
  const isFormValid = () => {
    // Check if country is selected
    if (!formData.country) return false;

    // Check if monthly electricity is filled
    if (!formData.monthly_electricity_kwh) return false;

    // Check if transport entries are valid
    const isTransportValid = formData.transport.every(entry => 
      entry.mode && entry.monthly_distance
    );
    if (!isTransportValid) return false;

    // Check if eating habits is selected
    if (!formData.eating_habits) return false;

    // Check if description is filled
    if (!formData.description) return false;

    return true;
  };

  const [countries, setCountries] = useState<string[]>([]);
  const [transportModes, setTransportModes] = useState<Record<string, TransportMode>>({});
  const [loading, setLoading] = useState(true);
  const [calculationResult, setCalculationResult] = useState<CalculationResponse | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch countries and transport modes
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch countries from API
        const countriesResponse = await fetch('https://carbon-footprint-backend-ktp9.onrender.com/carbon/supported-countries', {
          method: 'GET',
          headers: {
            'accept': 'application/json'
          }
        });
        const countriesData = await countriesResponse.json();

        // Fetch transport modes from API
        const transportResponse = await fetch('https://carbon-footprint-backend-ktp9.onrender.com/carbon/transport-modes', {
          method: 'GET',
          headers: {
            'accept': 'application/json'
          }
        });
        const transportData = await transportResponse.json();

        setCountries(countriesData.countries);
        setTransportModes(transportData.transport_modes);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        // Set empty arrays on error
        setCountries([]);
        setTransportModes({});
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleWasteChange = (wasteType: keyof WasteGeneration, value: string) => {
    setFormData(prev => ({
      ...prev,
      waste_generation: {
        ...prev.waste_generation,
        [wasteType]: parseFloat(value) || 0
      }
    }));
  };

  const handleTransportChange = (index: number, field: keyof TransportEntry, value: string) => {
    setFormData(prev => ({
      ...prev,
      transport: prev.transport.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const addTransportEntry = () => {
    setFormData(prev => ({
      ...prev,
      transport: [...prev.transport, { mode: '', monthly_distance: '', description: '' }]
    }));
  };

  const removeTransportEntry = (index: number) => {
    if (formData.transport.length > 1) {
      setFormData(prev => ({
        ...prev,
        transport: prev.transport.filter((_, i) => i !== index)
      }));
    }
  };

  const handleSubmit = async () => {
    setIsCalculating(true);
    setError(null);
    setCalculationResult(null);

    try {
      // Prepare the data in the format expected by the API
      const apiData = {
        ...formData,
        monthly_electricity_kwh: parseFloat(formData.monthly_electricity_kwh),
        transport: formData.transport.map(t => ({
          mode: t.mode,
          monthly_distance_km: parseFloat(t.monthly_distance),
          description: t.description
        }))
      };

      const response = await fetch('https://carbon-footprint-backend-ktp9.onrender.com/carbon/calculate-emission', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(apiData)
      });

      if (!response.ok) {
        throw new Error('Failed to calculate emissions');
      }

      const result = await response.json();
      setCalculationResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsCalculating(false);
    }
  };

  const getEmissionData = (result: CalculationResponse) => {
    return [
      { name: 'Electricity', value: result.breakdown.electricity_kg_co2 },
      { name: 'Diet', value: result.breakdown.diet_kg_co2 },
      { name: 'Transport', value: result.breakdown.transport_kg_co2 },
      { name: 'Waste', value: result.breakdown.waste_kg_co2 }
    ];
  };

  const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = ((data.value / calculationResult!.total_monthly_emission_kg) * 100).toFixed(1);
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-theme-sm border border-emerald-200 dark:border-emerald-700">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{data.name}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{data.value.toFixed(2)} kg CO₂</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{percentage}% of total</p>
        </div>
      );
    }
    return null;
  };

  const downloadPDF = async () => {
    if (!calculationResult) return;

    const resultsSection = document.getElementById('results-section');
    if (!resultsSection) return;

    try {
      // Show loading state
      setError(null);
      setIsCalculating(true);

      // Wait longer for all content to render, especially charts
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Temporarily modify styles for better PDF rendering
      const originalStyle = resultsSection.style.cssText;
      resultsSection.style.transform = 'scale(1)';
      resultsSection.style.transformOrigin = 'top left';
      resultsSection.style.width = '100%';
      resultsSection.style.backgroundColor = 'white';

      // Create canvas with improved settings
      const canvas = await html2canvas(resultsSection, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: false,
        foreignObjectRendering: false,
        removeContainer: true,
        imageTimeout: 15000,
        height: resultsSection.scrollHeight,
        width: resultsSection.scrollWidth,
        scrollX: 0,
        scrollY: 0,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        onclone: (clonedDoc) => {
          // Ensure the cloned document has proper styling
          const clonedSection = clonedDoc.getElementById('results-section');
          if (clonedSection) {
            clonedSection.style.transform = 'none';
            clonedSection.style.width = '100%';
            clonedSection.style.position = 'relative';
            clonedSection.style.left = '0';
            clonedSection.style.top = '0';
            clonedSection.style.backgroundColor = 'white';

            // Ensure all text is visible and handle color issues
            const allElements = clonedSection.querySelectorAll('*');
            allElements.forEach((el) => {
              if (el instanceof HTMLElement) {
                const computedStyle = window.getComputedStyle(el);
                // Convert any problematic color formats to hex
                if (computedStyle.color === 'transparent' || computedStyle.color === 'rgba(0, 0, 0, 0)') {
                  el.style.color = '#000000';
                }
                if (computedStyle.backgroundColor === 'transparent') {
                  el.style.backgroundColor = '#ffffff';
                }
                // Force text colors to be black or white for better PDF rendering
                if (computedStyle.color.includes('oklab')) {
                  el.style.color = '#000000';
                }
                if (computedStyle.backgroundColor.includes('oklab')) {
                  el.style.backgroundColor = '#ffffff';
                }
              }
            });

            // Handle SVG elements specifically (for charts)
            const svgElements = clonedSection.querySelectorAll('svg');
            svgElements.forEach((svg) => {
              if (svg instanceof SVGElement) {
                svg.style.backgroundColor = '#ffffff';
                svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
              }
            });
          }
        }
      });

      // Restore original styles
      resultsSection.style.cssText = originalStyle;

      // Check if canvas is valid
      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error('Canvas is empty - content may not have rendered properly');
      }

      // Create PDF with proper dimensions
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      // Calculate dimensions
      const pdfWidth = 210; // A4 width in mm
      const pdfHeight = 297; // A4 height in mm
      const canvasAspectRatio = canvas.height / canvas.width;
      const imgWidth = pdfWidth - 20; // Leave 10mm margin on each side
      const imgHeight = imgWidth * canvasAspectRatio;

      // Convert canvas to high-quality image
      const imgData = canvas.toDataURL('image/png', 1.0);

      // Check if we need multiple pages
      const yPosition = 10; // Start 10mm from top
      const maxHeight = pdfHeight - 20; // Leave margins

      if (imgHeight <= maxHeight) {
        // Single page
        pdf.addImage(imgData, 'PNG', 10, yPosition, imgWidth, imgHeight);
      } else {
        // Multiple pages needed
        const pageRatio = maxHeight / imgHeight;
        const scaledWidth = imgWidth * pageRatio;
        const scaledHeight = maxHeight;

        pdf.addImage(imgData, 'PNG', 10, yPosition, scaledWidth, scaledHeight);
      }

      // Add header with title and date
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Carbon Footprint Calculation Results', 10, yPosition + imgHeight + 15);

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated on: ${format(new Date(), 'MMMM dd, yyyy at HH:mm')}`, 10, yPosition + imgHeight + 25);
      pdf.text(`Total Monthly Emissions: ${calculationResult.total_monthly_emission_kg.toFixed(2)} kg CO₂`, 10, yPosition + imgHeight + 35);

      // Set metadata
      pdf.setProperties({
        title: 'Carbon Footprint Calculation Results',
        subject: 'Carbon Emission Analysis',
        author: 'Carbon Emission Calculator',
        keywords: 'carbon, emissions, footprint, calculation, environmental',
        creator: 'Carbon Emission Calculator'
      });

      // Generate filename with timestamp
      const timestamp = format(new Date(), 'yyyy-MM-dd-HH-mm-ss');
      const filename = `carbon-footprint-report-${timestamp}.pdf`;

      // Save the PDF
      pdf.save(filename);
    } catch (error: unknown) {
      console.error('Error generating PDF:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Failed to generate PDF: ${errorMessage}. Please try again or refresh the page if the issue persists.`);
    } finally {
      setIsCalculating(false);
    }
  };

  if (loading) {
    return (
      <div>
        <PageBreadcrumb pageTitle="Carbon Footprint Calculator" />
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-700 dark:text-gray-300">Loading...</div>
        </div>
      </div>
    );
  }

  const wasteTypes = [
    { key: 'food_waste' as const, label: 'Food Waste (kg/month)' },
    { key: 'plastic' as const, label: 'Plastic (kg/month)' },
    { key: 'paper' as const, label: 'Paper (kg/month)' },
    { key: 'metal' as const, label: 'Metal (kg/month)' },
    { key: 'textile' as const, label: 'Textile (kg/month)' },
    { key: 'electronic' as const, label: 'Electronic (kg/month)' },
    { key: 'organic_yard' as const, label: 'Organic Yard (kg/month)' }
  ];

  return (
    <div>
      <PageBreadcrumb pageTitle="Carbon Footprint Calculator" />
      
      <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-xl shadow-theme-lg border border-emerald-100 dark:border-emerald-800">
        <div className="space-y-8">
          
          {/* Age Slider */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Age: {formData.age}
            </label>
            <input
              type="range"
              min="1"
              max="100"
              value={formData.age}
              onChange={(e) => handleInputChange('age', parseInt(e.target.value))}
              className="w-full h-2 bg-emerald-100 dark:bg-emerald-800 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>1</span>
              <span>100</span>
            </div>
          </div>

          {/* Country Dropdown */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Country
            </label>
            <select
              value={formData.country}
              onChange={(e) => handleInputChange('country', e.target.value)}
              className="w-full px-3 py-2 border border-emerald-200 dark:border-emerald-700 rounded-lg shadow-theme-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-800 dark:text-gray-300"
              required
            >
              <option value="">Select a country</option>
              {countries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>

          {/* Monthly Electricity */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Monthly Electricity (kWh)
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={formData.monthly_electricity_kwh}
              onChange={(e) => handleInputChange('monthly_electricity_kwh', e.target.value)}
              className="w-full px-3 py-2 border border-emerald-200 dark:border-emerald-700 rounded-lg shadow-theme-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-800 dark:text-gray-300"
              placeholder="Enter monthly electricity consumption"
              required
            />
          </div>

          {/* Transport Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Transport</h3>
              <button
                type="button"
                onClick={addTransportEntry}
                className="flex items-center px-3 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-theme-sm hover:shadow-theme-md transition-all duration-200"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Transport
              </button>
            </div>

            {formData.transport.map((transport, index) => (
              <div key={index} className="p-4 border border-emerald-200 dark:border-emerald-700 rounded-lg space-y-4 bg-emerald-50/50 dark:bg-emerald-900/20">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-gray-800 dark:text-gray-200">Transport #{index + 1}</h4>
                  {formData.transport.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTransportEntry(index)}
                      className="text-error-500 hover:text-error-600 dark:text-error-400 dark:hover:text-error-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Transport Mode */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Mode
                    </label>
                    <select
                      value={transport.mode}
                      onChange={(e) => handleTransportChange(index, 'mode', e.target.value)}
                      className="w-full px-3 py-2 border border-emerald-200 dark:border-emerald-700 rounded-lg shadow-theme-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-800 dark:text-gray-300"
                      required
                    >
                      <option value="">Select transport mode</option>
                      {Object.keys(transportModes).map((mode) => (
                        <option key={mode} value={mode}>
                          {mode}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Monthly Distance */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Monthly Distance (km)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={transport.monthly_distance}
                      onChange={(e) => handleTransportChange(index, 'monthly_distance', e.target.value)}
                      className="w-full px-3 py-2 border border-emerald-200 dark:border-emerald-700 rounded-lg shadow-theme-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-800 dark:text-gray-300"
                      placeholder="Enter distance"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Description
                    </label>
                    <input
                      type="text"
                      value={transport.description}
                      onChange={(e) => handleTransportChange(index, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-emerald-200 dark:border-emerald-700 rounded-lg shadow-theme-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-800 dark:text-gray-300"
                      placeholder="Enter description"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Eating Habits */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Eating Habits
            </label>
            <select
              value={formData.eating_habits}
              onChange={(e) => handleInputChange('eating_habits', e.target.value)}
              className="w-full px-3 py-2 border border-emerald-200 dark:border-emerald-700 rounded-lg shadow-theme-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-800 dark:text-gray-300"
              required
            >
              <option value="">Select eating habits</option>
              <option value="Pure Vegetarian">Pure Vegetarian</option>
              <option value="Occasional Non-Vegetarian">Occasional Non-Vegetarian</option>
              <option value="Regular Non-Vegetarian">Regular Non-Vegetarian</option>
            </select>
          </div>

          {/* Waste Generation Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Waste Generation</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {wasteTypes.map(({ key, label }) => (
                <div key={key} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {label}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.waste_generation[key]}
                    onChange={(e) => handleWasteChange(key, e.target.value)}
                    className="w-full px-3 py-2 border border-emerald-200 dark:border-emerald-700 rounded-lg shadow-theme-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-800 dark:text-gray-300"
                    placeholder="0.0"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-emerald-200 dark:border-emerald-700 rounded-lg shadow-theme-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-800 dark:text-gray-300"
              placeholder="Enter any additional description or notes about your carbon footprint calculation..."
            />
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isCalculating || !isFormValid()}
              className="w-full bg-brand-500 text-white py-3 px-4 rounded-lg hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 font-medium shadow-theme-sm hover:shadow-theme-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCalculating ? 'Calculating...' : 'Calculate Carbon Footprint'}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-error-50 dark:bg-error-900/20 rounded-lg border border-error-200 dark:border-error-700">
              <p className="text-error-600 dark:text-error-400">{error}</p>
            </div>
          )}

          {/* Results Section */}
          {calculationResult && (
            <div id="results-section" className="mt-8 space-y-6">
              {/* Total Emission Card */}
              <div className="p-6 bg-emerald-50/50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-700">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Total Monthly Emissions</h3>
                <p className="text-3xl font-bold text-brand-600 dark:text-brand-400">
                  {calculationResult.total_monthly_emission_kg.toFixed(2)} kg CO₂
                </p>
              </div>

              {/* Breakdown Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-emerald-200 dark:border-emerald-700">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-4">Emission Breakdown</h4>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getEmissionData(calculationResult)}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {getEmissionData(calculationResult).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend 
                          verticalAlign="bottom" 
                          height={36}
                          formatter={(value: string) => (
                            <span className="text-sm text-gray-600 dark:text-gray-400">{value}</span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 space-y-2">
                    {getEmissionData(calculationResult).map((item, index) => (
                      <div key={item.name} className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-gray-600 dark:text-gray-400">{item.name}</span>
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {item.value.toFixed(2)} kg
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Insights Card */}
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-emerald-200 dark:border-emerald-700">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">AI Insights</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{calculationResult.llm_insights.insights}</p>
                  <div className="space-y-2">
                    <h5 className="font-medium text-gray-900 dark:text-white">Reduction Suggestions:</h5>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      {calculationResult.llm_insights.reduction_suggestions.map((suggestion, index) => (
                        <li key={index}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Detailed Results */}
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-emerald-200 dark:border-emerald-700">
                <h4 className="font-medium text-gray-900 dark:text-white mb-4">Detailed Results</h4>
                <div className="space-y-4">
                  {/* Electricity Details */}
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Electricity</h5>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-gray-600 dark:text-gray-400">Country</div>
                      <div className="text-gray-900 dark:text-white">{calculationResult.details.electricity.country}</div>
                      <div className="text-gray-600 dark:text-gray-400">kWh Consumed</div>
                      <div className="text-gray-900 dark:text-white">{calculationResult.details.electricity.kwh_consumed}</div>
                      <div className="text-gray-600 dark:text-gray-400">Carbon Intensity</div>
                      <div className="text-gray-900 dark:text-white">{calculationResult.details.electricity.carbon_intensity_gCO2_per_kwh.toFixed(2)} gCO₂/kWh</div>
                    </div>
                  </div>

                  {/* Transport Details */}
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Transport</h5>
                    {calculationResult.details.transport.transport_breakdown.map((item, index) => (
                      <div key={index} className="mb-2 p-2 bg-emerald-50/50 dark:bg-emerald-900/20 rounded">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="text-gray-600 dark:text-gray-400">Mode</div>
                          <div className="text-gray-900 dark:text-white">{item.mode}</div>
                          <div className="text-gray-600 dark:text-gray-400">Distance</div>
                          <div className="text-gray-900 dark:text-white">{item.monthly_distance_km} km</div>
                          <div className="text-gray-600 dark:text-gray-400">Emission per km</div>
                          <div className="text-gray-900 dark:text-white">{item.emission_per_km} kg/km</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Download Button */}
              <div className="flex justify-end">
                <button
                  onClick={downloadPDF}
                  className="flex items-center px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 font-medium shadow-theme-sm hover:shadow-theme-md transition-all duration-200"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                  </svg>
                  Download PDF Report
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Debug Info */}
        {/* <div className="mt-8 p-4 bg-emerald-50/50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-700">
          <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Current Form Data:</h4>
          <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto">
            {JSON.stringify(formData, null, 2)}
          </pre>
        </div> */}
      </div>
    </div>
  );
}