import React, { useState } from 'react';
import { Download, Settings, Eye, EyeOff, FileSpreadsheet, FileText, FileImage, Grid, List } from 'lucide-react';
import DataChart from './DataChart';
import { cn } from '@/lib/utils';
import { exportToExcel, exportToCSV, getDataStatistics } from './ExportUtils';
import { exportChartToPDF, exportMultipleChartsToPDF, exportDashboardToPDF } from './PDFExportUtils';

interface ChartDashboardProps {
  tables: Array<{
    id: string;
    name: string;
    years: number[];
    previewData: any[][];
  }>;
  selectedYears: number[];
}

const ChartDashboard: React.FC<ChartDashboardProps> = ({ tables, selectedYears }) => {
  const [selectedChartType, setSelectedChartType] = useState<'bar' | 'line' | 'pie' | 'doughnut'>('bar');
  const [visibleTables, setVisibleTables] = useState<Set<string>>(new Set(tables.map(t => t.id)));
  const [chartHeight, setChartHeight] = useState(400);
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid');
  const [isExporting, setIsExporting] = useState(false);
  const [selectedYearForPie, setSelectedYearForPie] = useState<number | undefined>(
    selectedYears.length > 0 ? selectedYears[0] : undefined
  );

  // Update selectedYearForPie when selectedYears changes
  React.useEffect(() => {
    console.log(`📅 ChartDashboard: selectedYears changed:`, selectedYears, `current selectedYearForPie:`, selectedYearForPie);

    if (selectedYears.length > 0) {
      if (!selectedYearForPie || !selectedYears.includes(selectedYearForPie)) {
        console.log(`📅 Setting selectedYearForPie to:`, selectedYears[0]);
        setSelectedYearForPie(selectedYears[0]);
      }
    } else {
      console.log(`📅 No selected years, clearing selectedYearForPie`);
      setSelectedYearForPie(undefined);
    }
  }, [selectedYears, selectedYearForPie]);

  const chartTypes = [
    { id: 'bar', name: 'Bar Chart', description: 'Bagus untuk perbandingan antar kategori' },
    { id: 'line', name: 'Line Chart', description: 'Ideal untuk tren waktu' },
    { id: 'pie', name: 'Pie Chart', description: 'Menampilkan proporsi data per tahun (dapat memilih tahun)' },
    { id: 'doughnut', name: 'Doughnut Chart', description: 'Variasi pie chart yang lebih modern (dapat memilih tahun)' },
  ];

  const toggleTableVisibility = (tableId: string) => {
    const newVisible = new Set(visibleTables);
    if (newVisible.has(tableId)) {
      newVisible.delete(tableId);
    } else {
      newVisible.add(tableId);
    }
    setVisibleTables(newVisible);
  };

  const exportChart = async (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (table) {
      try {
        setIsExporting(true);
        const filename = `${table.name.replace(/[^a-zA-Z0-9]/g, '_')}_chart_${Date.now()}.pdf`;
        await exportChartToPDF(`chart-${tableId}`, {
          filename,
          orientation: 'landscape',
          format: 'a4'
        });
        alert(`✅ Chart ${table.name} berhasil diexport ke PDF!`);
      } catch (error) {
        console.error('Export error:', error);
        alert('❌ Gagal mengexport chart. Silakan coba lagi.');
      } finally {
        setIsExporting(false);
      }
    }
  };

  const exportAllVisibleCharts = async () => {
    try {
      setIsExporting(true);
      const visibleChartIds = Array.from(visibleTables).map(id => `chart-${id}`);
      const filename = `all_charts_${Date.now()}.pdf`;
      await exportMultipleChartsToPDF(visibleChartIds, {
        filename,
        orientation: 'portrait',
        format: 'a4'
      });
      alert(`✅ ${visibleChartIds.length} chart berhasil diexport ke PDF!`);
    } catch (error) {
      console.error('Export error:', error);
      alert('❌ Gagal mengexport charts. Silakan coba lagi.');
    } finally {
      setIsExporting(false);
    }
  };

  const exportDashboard = async () => {
    try {
      setIsExporting(true);
      const filename = `dashboard_${Date.now()}.pdf`;
      await exportDashboardToPDF('chart-dashboard', {
        filename,
        orientation: 'portrait',
        format: 'a4'
      });
      alert('✅ Dashboard berhasil diexport ke PDF!');
    } catch (error) {
      console.error('Export error:', error);
      alert('❌ Gagal mengexport dashboard. Silakan coba lagi.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportData = (format: 'excel' | 'csv') => {
    try {
      const exportData = { tables, selectedYears };
      let filename = '';
      
      if (format === 'excel') {
        filename = exportToExcel(exportData);
      } else {
        filename = exportToCSV(exportData);
      }
      
      alert(`Data berhasil diexport ke ${filename}`);
    } catch (error) {
      console.error('Export error:', error);
      alert('Gagal mengexport data. Silakan coba lagi.');
    }
  };

  const getChartTitle = (tableName: string) => {
    if (selectedChartType === 'pie' || selectedChartType === 'doughnut') {
      const yearToShow = selectedYearForPie || selectedYears[0];
      return `${tableName} (Tahun ${yearToShow})`;
    }
    return `${tableName} (${selectedYears.join(', ')})`;
  };

  const getDataSummary = (data: any[][]) => {
    if (!data || data.length < 2) return null;

    const headers = data[0];
    const rows = data.slice(1);
    
    const summary = {
      totalRegions: rows.length,
      totalYears: headers.length - 1,
      dataPoints: (headers.length - 1) * rows.length,
      averageValue: 0,
      maxValue: 0,
      minValue: Infinity,
    };

    let totalSum = 0;
    let validValues = 0;

    // Calculate statistics
    for (let i = 1; i < headers.length; i++) {
      for (let j = 0; j < rows.length; j++) {
        const value = parseFloat(String(rows[j][i] || 0));
        if (!isNaN(value)) {
          totalSum += value;
          validValues++;
          summary.maxValue = Math.max(summary.maxValue, value);
          summary.minValue = Math.min(summary.minValue, value);
        }
      }
    }

    summary.averageValue = validValues > 0 ? totalSum / validValues : 0;
    summary.minValue = summary.minValue === Infinity ? 0 : summary.minValue;

    return summary;
  };

  if (tables.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">📊</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">Belum Ada Data Dipilih</h3>
        <p className="text-gray-500">Pilih tabel dan tahun terlebih dahulu untuk melihat visualisasi</p>
      </div>
    );
  }

  return (
    <div id="chart-dashboard" className="space-y-6 p-4 bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">📊 Dashboard Visualisasi Data</h1>
            <p className="text-blue-100">
              {tables.length} tabel • {selectedYears.length} tahun dipilih • {visibleTables.size} chart aktif
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{selectedChartType.toUpperCase()}</div>
            <div className="text-blue-200">Jenis Chart</div>
          </div>
        </div>
      </div>

      {/* Chart Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart Configuration */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 text-sm mb-3">⚙️ Konfigurasi Chart</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jenis Chart
              </label>
              <select
                value={selectedChartType}
                onChange={(e) => setSelectedChartType(e.target.value as any)}
                className="bps-select text-sm w-full"
              >
                {chartTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tinggi Chart
              </label>
              <select
                value={chartHeight}
                onChange={(e) => setChartHeight(Number(e.target.value))}
                className="bps-select text-sm w-full"
              >
                <option value={300}>Kecil (300px)</option>
                <option value={400}>Sedang (400px)</option>
                <option value={500}>Besar (500px)</option>
                <option value={600}>Sangat Besar (600px)</option>
              </select>
            </div>

            {/* Year Selection for Pie Charts */}
            {(selectedChartType === 'pie' || selectedChartType === 'doughnut') && selectedYears.length > 1 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🥧 Pilih Tahun untuk {selectedChartType === 'pie' ? 'Pie Chart' : 'Doughnut Chart'}
                </label>
                <select
                  value={selectedYearForPie || selectedYears[0]}
                  onChange={(e) => {
                    const newYear = Number(e.target.value);
                    console.log(`🥧 User selected year for pie chart:`, newYear);
                    setSelectedYearForPie(newYear);
                  }}
                  className="bps-select text-sm w-full"
                >
                  {selectedYears.map(year => (
                    <option key={year} value={year}>
                      Tahun {year}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Pie chart hanya menampilkan satu tahun data
                </p>
              </div>
            )}
          </div>

          {/* Visibility Controls */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 text-sm mb-3">👁️ Kontrol Tampilan</h3>
            <div className="flex flex-col space-y-2">
              <button
                onClick={() => setVisibleTables(new Set(tables.map(t => t.id)))}
                className="bps-btn-secondary text-sm justify-start"
              >
                <Eye className="w-4 h-4 mr-2" />
                Tampilkan Semua
              </button>
              <button
                onClick={() => setVisibleTables(new Set())}
                className="bps-btn-secondary text-sm justify-start"
              >
                <EyeOff className="w-4 h-4 mr-2" />
                Sembunyikan Semua
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Layout Mode
              </label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setLayoutMode('grid')}
                  className={cn(
                    "flex-1 flex items-center justify-center px-3 py-2 rounded text-sm border",
                    layoutMode === 'grid'
                      ? "bg-blue-100 border-blue-300 text-blue-700"
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  )}
                >
                  <Grid className="w-4 h-4 mr-1" />
                  Grid
                </button>
                <button
                  onClick={() => setLayoutMode('list')}
                  className={cn(
                    "flex-1 flex items-center justify-center px-3 py-2 rounded text-sm border",
                    layoutMode === 'list'
                      ? "bg-blue-100 border-blue-300 text-blue-700"
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  )}
                >
                  <List className="w-4 h-4 mr-1" />
                  List
                </button>
              </div>
            </div>
          </div>

          {/* Export Controls */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 text-sm mb-3">📥 Export Options</h3>
            <div className="space-y-2">
              <button
                onClick={() => handleExportData('excel')}
                disabled={isExporting}
                className="bps-btn-secondary text-sm w-full justify-start"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export Data Excel
              </button>
              <button
                onClick={() => handleExportData('csv')}
                disabled={isExporting}
                className="bps-btn-secondary text-sm w-full justify-start"
              >
                <FileText className="w-4 h-4 mr-2" />
                Export Data CSV
              </button>
              <button
                onClick={exportAllVisibleCharts}
                disabled={isExporting || visibleTables.size === 0}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm w-full flex items-center justify-center disabled:opacity-50"
              >
                <FileImage className="w-4 h-4 mr-2" />
                {isExporting ? 'Exporting...' : 'Export Charts PDF'}
              </button>
              <button
                onClick={exportDashboard}
                disabled={isExporting}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm w-full flex items-center justify-center disabled:opacity-50"
              >
                <Download className="w-4 h-4 mr-2" />
                {isExporting ? 'Exporting...' : 'Export Dashboard PDF'}
              </button>
            </div>
          </div>
        </div>



        {/* Chart Type Description */}
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>💡 Tip:</strong> {chartTypes.find(t => t.id === selectedChartType)?.description}
          </p>
          {(selectedChartType === 'pie' || selectedChartType === 'doughnut') && selectedYears.length > 1 && (
            <p className="text-sm text-blue-700 mt-2">
              <strong>🥧 Fitur:</strong> Anda dapat memilih tahun yang ingin ditampilkan di pie chart menggunakan dropdown di atas.
            </p>
          )}
        </div>

        {/* Statistics Summary */}
        <div className="mt-4 grid grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg border">
            <div className="text-xl font-bold text-blue-600">{tables.length}</div>
            <div className="text-sm text-blue-800">Total Tabel</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg border">
            <div className="text-xl font-bold text-green-600">{selectedYears.length}</div>
            <div className="text-sm text-green-800">Tahun Dipilih</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg border">
            <div className="text-xl font-bold text-purple-600">{visibleTables.size}</div>
            <div className="text-sm text-purple-800">Chart Aktif</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg border">
            <div className="text-xl font-bold text-orange-600">{getDataStatistics({ tables, selectedYears }).totalDataPoints}</div>
            <div className="text-sm text-orange-800">Data Points</div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className={cn(
        "gap-6",
        layoutMode === 'grid'
          ? "grid grid-cols-1 lg:grid-cols-2"
          : "space-y-6"
      )}>
        {tables.map((table) => {
          const isVisible = visibleTables.has(table.id);
          const summary = getDataSummary(table.previewData);

          return (
            <div
              key={table.id}
              id={`chart-${table.id}`}
              className={cn(
                "bg-white rounded-lg border border-gray-200 overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md",
                isVisible ? "opacity-100" : "opacity-50",
                layoutMode === 'list' ? "w-full" : ""
              )}
            >
              {/* Chart Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => toggleTableVisibility(table.id)}
                    className="p-1 rounded hover:bg-gray-100"
                  >
                    {isVisible ? (
                      <Eye className="w-4 h-4 text-gray-600" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">{table.name}</h3>
                    <p className="text-xs text-gray-500">
                      {summary ? `${summary.totalRegions} wilayah, ${summary.totalYears} tahun` : 'Data tidak tersedia'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {summary && (
                    <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">
                      Avg: {summary.averageValue.toFixed(2)}
                    </div>
                  )}
                  <button
                    onClick={() => exportChart(table.id)}
                    disabled={isExporting}
                    className="p-2 rounded hover:bg-blue-100 text-blue-600 border border-blue-200 disabled:opacity-50"
                    title="Export Chart ke PDF"
                  >
                    <FileImage className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Chart Content */}
              {isVisible && (
                <div className="p-6">
                  {(() => {
                    console.log(`🎨 Rendering chart for table ${table.id}:`, {
                      chartType: selectedChartType,
                      selectedYearForPie,
                      tableYears: table.years,
                      selectedYears,
                      dataRows: table.previewData?.length || 0
                    });
                    return null;
                  })()}
                  <DataChart
                    key={`${table.id}-${selectedChartType}-${selectedYearForPie || 'no-year'}`}
                    type={selectedChartType}
                    data={table.previewData}
                    title={getChartTitle(table.name)}
                    height={chartHeight}
                    selectedYear={selectedYearForPie}
                  />
                  
                  {/* Data Summary */}
                  {summary && (
                    <div className="mt-6 grid grid-cols-3 gap-4 text-xs">
                      <div className="text-center p-3 bg-gradient-to-b from-red-50 to-red-100 rounded-lg border border-red-200">
                        <div className="font-bold text-red-700 text-lg">{summary.maxValue.toFixed(2)}</div>
                        <div className="text-red-600">📈 Maksimum</div>
                      </div>
                      <div className="text-center p-3 bg-gradient-to-b from-green-50 to-green-100 rounded-lg border border-green-200">
                        <div className="font-bold text-green-700 text-lg">{summary.minValue.toFixed(2)}</div>
                        <div className="text-green-600">📉 Minimum</div>
                      </div>
                      <div className="text-center p-3 bg-gradient-to-b from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                        <div className="font-bold text-blue-700 text-lg">{summary.dataPoints}</div>
                        <div className="text-blue-600">📊 Data Points</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>


    </div>
  );
};

export default ChartDashboard;
