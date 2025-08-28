import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DataChartProps {
  type: 'bar' | 'line' | 'pie' | 'doughnut';
  data: any[][];
  title?: string;
  height?: number;
  selectedYear?: number; // For pie/doughnut charts to select which year to display
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
    fill?: boolean;
  }[];
}

const DataChart: React.FC<DataChartProps> = ({ type, data, title, height = 400, selectedYear }) => {
  console.log(`🎯 DataChart component props:`, {
    type,
    title,
    height,
    selectedYear,
    dataRows: data?.length || 0,
    dataCols: data?.[0]?.length || 0
  });

  // Force re-render when selectedYear changes for pie charts
  React.useEffect(() => {
    if (type === 'pie' || type === 'doughnut') {
      console.log(`🔄 Pie chart selectedYear changed to:`, selectedYear);
    }
  }, [selectedYear, type]);

  // Process data for chart
  const processDataForChart = (): ChartData => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`🎨 DataChart processing data at ${timestamp}:`, {
      type,
      selectedYear,
      dataLength: data?.length || 0
    });

    if (!data || data.length < 2) {
      console.log(`❌ DataChart: Insufficient data (${data?.length || 0} rows)`);
      return {
        labels: [],
        datasets: []
      };
    }

    // Identify header row and data rows
    let headerRowIndex = 0;
    let headers = data[0];
    let dataRows = data.slice(1);

    // Check if first row contains only years/numbers (might be misplaced header)
    const firstRowHasOnlyYears = data[0].slice(1).every(cell => {
      const str = String(cell || '').trim();
      return str === '' || /^\d{4}$/.test(str) || /^20\d{2}$/.test(str);
    });

    // Check if second row contains years and first row contains actual data
    if (data.length > 1) {
      const secondRowHasYears = data[1].slice(1).every(cell => {
        const str = String(cell || '').trim();
        return str === '' || /^\d{4}$/.test(str) || /^20\d{2}$/.test(str);
      });

      // If first row has only years but second row has actual data, use first row as header
      if (firstRowHasOnlyYears && !secondRowHasYears) {
        console.log(`📋 Using row 0 as headers (contains only years)`);
        headers = data[0];
        dataRows = data.slice(1);
      }
      // If second row has years, it might be the header
      else if (secondRowHasYears && !firstRowHasOnlyYears) {
        console.log(`📋 Using row 1 as headers (row 0 seems to be data)`);
        headers = data[1];
        dataRows = [data[0], ...data.slice(2)];
      }
    }

    console.log(`📋 Final headers:`, headers);
    console.log(`📊 Final data rows (${dataRows.length}):`, dataRows);

    // Extract labels (first column - usually region names)
    // Exclude any row that looks like a header row (contains years)
    const filteredDataRows = dataRows.filter(row => {
      const firstCol = String(row[0] || '').trim();
      // Skip rows where first column looks like a header or contains years
      if (firstCol.toLowerCase().includes('tahun') ||
          firstCol.toLowerCase().includes('year') ||
          /^\d{4}$/.test(firstCol) ||
          firstCol === '') {
        console.log(`⚠️ Skipping potential header row: [${row.join(', ')}]`);
        return false;
      }
      return true;
    });

    const labels = filteredDataRows.map((row, index) => {
      const label = String(row[0] || `Row ${index + 1}`);
      return label.trim() || `Item ${index + 1}`;
    });

    console.log(`🏷️ DataChart labels (${labels.length}):`, labels);

    // Extract datasets (year columns)
    const datasets = [];
    const colors = [
      'rgba(30, 58, 138, 0.8)',   // BPS Navy
      'rgba(59, 130, 246, 0.8)',  // BPS Blue
      'rgba(16, 185, 129, 0.8)',  // Green
      'rgba(245, 158, 11, 0.8)',  // Orange
      'rgba(239, 68, 68, 0.8)',   // Red
      'rgba(139, 92, 246, 0.8)',  // Purple
      'rgba(236, 72, 153, 0.8)',  // Pink
      'rgba(34, 197, 94, 0.8)',   // Light Green
    ];

    // For each year column (starting from index 1)
    for (let i = 1; i < headers.length; i++) {
      const rawHeader = headers[i];
      let year = String(rawHeader || `Column ${i}`).trim();

      // Clean up the year label - remove any non-numeric characters except spaces and dashes
      if (year.match(/^\d{4}$/)) {
        // It's a pure year like "2011"
        year = year;
      } else if (year.includes('20') && year.length > 4) {
        // Extract year from text like "Data 2011" or "Tahun 2011"
        const yearMatch = year.match(/20\d{2}/);
        if (yearMatch) {
          year = yearMatch[0];
        }
      }

      console.log(`📅 DataChart year column ${i}: "${rawHeader}" → "${year}"`);

      const values = filteredDataRows.map((row, rowIndex) => {
        const rawValue = row[i];
        let value = parseFloat(String(rawValue || 0).replace(/[^\d.-]/g, ''));

        if (isNaN(value)) {
          console.log(`⚠️ DataChart: Invalid value at row ${rowIndex}, col ${i}: "${rawValue}" → 0`);
          value = 0;
        }

        return value;
      });

      console.log(`💹 DataChart values for "${year}" (${values.length} values):`, values);

      const colorIndex = (i - 1) % colors.length;

      if (type === 'bar' || type === 'line') {
        datasets.push({
          label: year,
          data: values,
          backgroundColor: type === 'bar' ? colors[colorIndex] : 'transparent',
          borderColor: colors[colorIndex],
          borderWidth: 2,
          fill: type === 'line' ? false : undefined,
        });
      } else if (type === 'pie' || type === 'doughnut') {
        // For pie/doughnut, use selectedYear if provided, otherwise use first dataset
        console.log(`🔍 Pie chart year check: column="${year}", selectedYear=${selectedYear}, index=${i}`);

        let shouldUseThisYear = false;

        if (selectedYear !== undefined && selectedYear !== null) {
          // Try different ways to match the year
          const yearAsNumber = parseInt(year);
          const selectedYearAsString = selectedYear.toString();
          const yearString = year.toString().trim();

          shouldUseThisYear = (
            yearAsNumber === selectedYear ||
            yearString === selectedYearAsString ||
            yearString.includes(selectedYearAsString) ||
            selectedYearAsString.includes(yearString)
          );

          console.log(`🔍 Year matching detailed: column="${year}" (parsed: ${yearAsNumber}) vs selectedYear=${selectedYear} (string: "${selectedYearAsString}") => ${shouldUseThisYear}`);
        } else {
          // Use first data column (index 1) if no year selected
          shouldUseThisYear = (i === 1);
          console.log(`🔍 No year selected, using first data column (index ${i}): ${shouldUseThisYear}`);
        }

        if (shouldUseThisYear) {
          console.log(`🥧 ✅ Using year ${year} for pie chart (values: ${values.length} items)`);
          console.log(`🥧 Data values:`, values);
          datasets.push({
            label: `Data ${year}`,
            data: values,
            backgroundColor: colors.slice(0, values.length),
            borderColor: colors.slice(0, values.length).map(color => color.replace('0.8', '1')),
            borderWidth: 1,
          });
        } else {
          console.log(`🥧 ❌ Skipping year ${year} for pie chart`);
        }
      }
    }

    // Fallback for pie/doughnut charts - ensure we have at least one dataset
    if ((type === 'pie' || type === 'doughnut') && datasets.length === 0 && filteredDataRows.length > 0) {
      console.log(`🚨 No datasets found for pie chart, using fallback (first data column)`);

      // Use first data column as fallback
      const firstDataColumnIndex = 1;
      if (headers.length > firstDataColumnIndex) {
        const fallbackYear = headers[firstDataColumnIndex];
        const fallbackValues = filteredDataRows.map((row, rowIndex) => {
          const rawValue = row[firstDataColumnIndex];
          let value = parseFloat(String(rawValue || 0).replace(/[^\d.-]/g, ''));

          if (isNaN(value)) {
            console.log(`⚠️ DataChart fallback: Invalid value at row ${rowIndex}: "${rawValue}" → 0`);
            value = 0;
          }

          return value;
        });

        console.log(`🥧 Fallback dataset created for year ${fallbackYear}:`, fallbackValues);

        datasets.push({
          label: `Data ${fallbackYear}`,
          data: fallbackValues,
          backgroundColor: colors.slice(0, fallbackValues.length),
          borderColor: colors.slice(0, fallbackValues.length).map(color => color.replace('0.8', '1')),
          borderWidth: 1,
        });
      }
    }

    console.log(`✅ DataChart final datasets:`, datasets.map(d => ({ label: d.label, dataPoints: d.data.length })));

    return {
      labels,
      datasets
    };
  };

  const chartData = processDataForChart();

  // Create a hash of chart data to help Chart.js detect changes
  const dataHash = React.useMemo(() => {
    const hash = JSON.stringify({
      labels: chartData.labels,
      datasets: chartData.datasets.map(d => ({ label: d.label, data: d.data })),
      selectedYear,
      type
    });
    console.log(`📊 Chart data hash created:`, hash.substring(0, 100) + '...');
    return hash;
  }, [chartData.labels, chartData.datasets, selectedYear, type]);

  // Calculate Y-axis bounds to ensure zero line is visible
  const calculateYAxisBounds = () => {
    if (type === 'pie' || type === 'doughnut') return {};

    const allValues = chartData.datasets.flatMap(dataset => dataset.data);
    if (allValues.length === 0) return { includeZero: true };

    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);

    console.log(`📊 DataChart Y-axis bounds: min=${minValue}, max=${maxValue}`);

    // Calculate appropriate padding
    const range = Math.abs(maxValue - minValue);
    const padding = range > 0 ? range * 0.15 : 1; // 15% padding or minimum 1

    // Always include 0 in the axis range for clear positive/negative separation
    let suggestedMin = minValue;
    let suggestedMax = maxValue;

    if (minValue < 0) {
      suggestedMin = minValue - padding;
    }
    if (maxValue > 0) {
      suggestedMax = maxValue + padding;
    }

    // Ensure 0 is always included in the range
    if (minValue > 0) {
      suggestedMin = 0;
    }
    if (maxValue < 0) {
      suggestedMax = 0;
    }

    console.log(`📊 Final Y-axis range: ${suggestedMin} to ${suggestedMax} (includes zero)`);

    return {
      min: suggestedMin,
      max: suggestedMax,
      // Always include zero for clear reference line
      includeZero: true
    };
  };

  const yAxisBounds = calculateYAxisBounds();

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            family: 'Inter',
            size: 12,
          },
          color: '#374151',
        },
      },
      title: {
        display: !!title,
        text: title,
        font: {
          family: 'Inter',
          size: 16,
          weight: 'bold',
        },
        color: '#1e3a8a',
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1e3a8a',
        bodyColor: '#374151',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y || context.parsed;
            return `${label}: ${typeof value === 'number' ? value.toFixed(3) : value}`;
          }
        }
      },
    },
    scales: type === 'bar' || type === 'line' ? {
      x: {
        grid: {
          color: '#e5e7eb',
          display: true,
        },
        ticks: {
          font: {
            family: 'Inter',
            size: 11,
          },
          color: '#6b7280',
        },
      },
      y: {
        ...yAxisBounds,
        position: 'left' as const,
        grid: {
          color: function(context: any) {
            // Make the zero line more prominent
            if (context.tick.value === 0) {
              return '#374151'; // Darker color for zero line
            }
            return '#e5e7eb'; // Regular grid lines
          },
          lineWidth: function(context: any) {
            // Make the zero line thicker
            return context.tick.value === 0 ? 3 : 1;
          },
          display: true,
        },
        ticks: {
          font: {
            family: 'Inter',
            size: 11,
          },
          color: '#6b7280',
          callback: function(value: any) {
            // Format numbers with appropriate decimal places for negative values
            if (typeof value === 'number') {
              return value >= -1 && value <= 1 && value !== 0
                ? value.toFixed(3)
                : value.toLocaleString();
            }
            return value;
          }
        },
        // Ensure zero line is visible and styled
        border: {
          color: '#374151',
          width: 1,
        },
      },
    } : undefined,
  };

  const renderChart = () => {
    console.log(`🎨 Rendering ${type} chart with data:`, {
      labels: chartData.labels,
      datasets: chartData.datasets.map(d => ({
        label: d.label,
        dataLength: d.data.length,
        data: d.data
      }))
    });

    // Check if we have valid data for pie/doughnut charts
    if ((type === 'pie' || type === 'doughnut')) {
      if (chartData.datasets.length === 0) {
        console.error(`❌ No datasets available for ${type} chart`);
        return (
          <div className="flex items-center justify-center h-64 bg-red-50 rounded-lg border border-red-200">
            <div className="text-center">
              <div className="text-red-400 text-4xl mb-2">⚠️</div>
              <p className="text-red-600">Tidak ada data untuk pie chart</p>
              <p className="text-sm text-red-500">Periksa pemilihan tahun atau data</p>
            </div>
          </div>
        );
      }

      if (chartData.labels.length === 0) {
        console.error(`❌ No labels available for ${type} chart`);
        return (
          <div className="flex items-center justify-center h-64 bg-red-50 rounded-lg border border-red-200">
            <div className="text-center">
              <div className="text-red-400 text-4xl mb-2">📋</div>
              <p className="text-red-600">Tidak ada label untuk pie chart</p>
              <p className="text-sm text-red-500">Data mungkin tidak memiliki kategori</p>
            </div>
          </div>
        );
      }

      console.log(`✅ Pie chart data validation passed. Labels: ${chartData.labels.length}, Datasets: ${chartData.datasets.length}`);
    }

    switch (type) {
      case 'bar':
        return <Bar data={chartData} options={options} />;
      case 'line':
        return <Line data={chartData} options={options} />;
      case 'pie':
        return <Pie data={chartData} options={options} />;
      case 'doughnut':
        return <Doughnut data={chartData} options={options} />;
      default:
        return <Bar data={chartData} options={options} />;
    }
  };

  if (!data || data.length < 2) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-gray-400 text-4xl mb-2">📊</div>
          <p className="text-gray-500">Tidak ada data untuk ditampilkan</p>
          <p className="text-sm text-gray-400">Pastikan data telah dipilih dan diproses</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: `${height}px` }} className="w-full">
      {renderChart()}
    </div>
  );
};

export default DataChart;
