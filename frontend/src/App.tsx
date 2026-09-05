import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  LayoutDashboard,
  Package,
  TrendingUp,
  Coins,
  AlertTriangle,
  Search,
  Filter,
  Plus,
  Edit3,
  Trash2,
  ShoppingCart,
  RefreshCw,
  X,
  CheckCircle,
  Database,
  ArrowUpRight,
  Info,
  FileSpreadsheet,
  Upload,
  Download,
  Receipt,
  Menu
} from 'lucide-react';

// Types
interface Equipment {
  id: string;
  name: string;
  category: string;
  current_stock: number;
  min_stock_threshold: number;
  cost_price: number;
  selling_price: number;
  created_at: string;
}

interface SalesRecord {
  id: string;
  equipment_id: string;
  equipment_name: string;
  category: string;
  quantity_sold: number;
  sale_price: number;
  total_revenue: number;
  profit: number;
  created_at: string;
  stock_arrival_date: string;
}

interface DashboardMetrics {
  total_investment: number;
  potential_revenue: number;
  potential_profit: number;
  low_stock_count: number;
  low_stock_alerts: Equipment[];
  total_unique_items: number;
  total_stock_count: number;
}

const CATEGORIES = ['Bats', 'Balls', 'Gloves', 'Pads', 'Helmets', 'Accessories', 'Bags', 'Clothing'];
const API_URL = import.meta.env.VITE_API_URL || '/api';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'sales'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // Data States
  const [inventory, setInventory] = useState<Equipment[]>([]);
  const [salesRecords, setSalesRecords] = useState<SalesRecord[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    total_investment: 0,
    potential_revenue: 0,
    potential_profit: 0,
    low_stock_count: 0,
    low_stock_alerts: [],
    total_unique_items: 0,
    total_stock_count: 0
  });

  // UX States
  const [loading, setLoading] = useState<boolean>(true);
  const [dbConnected, setDbConnected] = useState<boolean>(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showLowStockOnly, setShowLowStockOnly] = useState<boolean>(false);

  // Sales Filters
  const [salesSearchQuery, setSalesSearchQuery] = useState<string>('');
  const [salesCategoryFilter, setSalesCategoryFilter] = useState<string>('All');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: ''
  });

  // Custom categories (user-added during this session)
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const allCategories = [...CATEGORIES, ...customCategories];



  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isSellModalOpen, setIsSellModalOpen] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isSalesImportModalOpen, setIsSalesImportModalOpen] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<Equipment | null>(null);

  // Import Excel state
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<{
    imported_count: number;
    updated_count: number;
    errors: string[];
  } | null>(null);

  // Sales Import state
  const [salesImportFile, setSalesImportFile] = useState<File | null>(null);
  const [salesImportLoading, setSalesImportLoading] = useState<boolean>(false);
  const [salesImportResult, setSalesImportResult] = useState<{
    imported_count: number;
    errors: string[];
  } | null>(null);

  // Form States
  const [formData, setFormData] = useState({
    name: '',
    category: 'Bats',
    current_stock: 10,
    min_stock_threshold: 5,
    cost_price: 50.0,
    selling_price: 90.0
  });

  const [sellData, setSellData] = useState({
    quantity_sold: 1,
    sale_price: 0
  });

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [invRes, metricsRes, salesRes] = await Promise.all([
        fetch(`${API_URL}/inventory`),
        fetch(`${API_URL}/dashboard/metrics`),
        fetch(`${API_URL}/sales`)
      ]);

      if (!invRes.ok || !metricsRes.ok || !salesRes.ok) {
        throw new Error('API request failed');
      }

      const invData = await invRes.json();
      const metData = await metricsRes.json();
      const salesData = await salesRes.json();

      setInventory(invData);
      setMetrics(metData);
      setSalesRecords(salesData);
      setDbConnected(true);
    } catch (error) {
      console.error('Error fetching data from API:', error);
      setDbConnected(false);
      showNotification('error', 'Failed to connect to backend server. Ensure FastAPI is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  // CRUD Operations
  const handleAddEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const categoryToSave = formData.category.trim();

      const response = await fetch(`${API_URL}/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          category: categoryToSave
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add item');
      }

      if (categoryToSave && !CATEGORIES.includes(categoryToSave) && !customCategories.includes(categoryToSave)) {
        setCustomCategories(prev => [...prev, categoryToSave]);
      }

      showNotification('success', `Successfully added ${formData.name} to inventory!`);
      setIsAddModalOpen(false);
      setFormData({
        name: '',
        category: 'Bats',
        current_stock: 10,
        min_stock_threshold: 5,
        cost_price: 50.0,
        selling_price: 90.0
      });
      fetchData();
    } catch (error) {
      showNotification('error', 'Error adding item to inventory.');
    }
  };

  const handleEditEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      const categoryToSave = formData.category.trim();

      const response = await fetch(`${API_URL}/inventory/${selectedItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          category: categoryToSave
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update item');
      }

      if (categoryToSave && !CATEGORIES.includes(categoryToSave) && !customCategories.includes(categoryToSave)) {
        setCustomCategories(prev => [...prev, categoryToSave]);
      }

      showNotification('success', `Successfully updated ${formData.name}!`);
      setIsEditModalOpen(false);
      setSelectedItem(null);
      fetchData();
    } catch (error) {
      showNotification('error', 'Error updating inventory item.');
    }
  };

  const handleDeleteEquipment = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from inventory?`)) return;

    try {
      const response = await fetch(`${API_URL}/inventory/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete item');
      }

      showNotification('success', `Removed ${name} from catalog.`);
      fetchData();
    } catch (error) {
      showNotification('error', 'Error deleting item.');
    }
  };

  const handleLogSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      const response = await fetch(`${API_URL}/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipment_id: selectedItem.id,
          quantity_sold: sellData.quantity_sold,
          sale_price: sellData.sale_price
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to log sale');
      }

      const profit = (sellData.sale_price - selectedItem.cost_price) * sellData.quantity_sold;
      showNotification('success', `Logged sale of ${sellData.quantity_sold}x ${selectedItem.name}! Actual profit generated: ₹${profit.toFixed(2)}`);
      setIsSellModalOpen(false);
      setSelectedItem(null);
      fetchData();
    } catch (error: any) {
      showNotification('error', error.message || 'Error logging sale.');
    }
  };

  const handleDeleteSale = async (saleId: string, equipmentName: string, quantity: number) => {
    if (!window.confirm(`Are you sure you want to delete this sale of ${quantity}x ${equipmentName}? This will restore the stock quantity.`)) return;

    try {
      const response = await fetch(`${API_URL}/sales/${saleId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete sale record');
      }

      showNotification('success', `Sale of ${quantity}x ${equipmentName} has been deleted. Stock has been restored.`);
      fetchData();
    } catch (error: any) {
      showNotification('error', error.message || 'Error deleting sale record.');
    }
  };

  const openEditModal = (item: Equipment) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      current_stock: item.current_stock,
      min_stock_threshold: item.min_stock_threshold,
      cost_price: item.cost_price,
      selling_price: item.selling_price
    });
    setIsEditModalOpen(true);
  };

  const openSellModal = (item: Equipment) => {
    setSelectedItem(item);
    setSellData({
      quantity_sold: 1,
      sale_price: item.selling_price
    });
    setIsSellModalOpen(true);
  };

  const handleExportInventoryExcel = async () => {
    try {
      const response = await fetch(`${API_URL}/inventory/export`);
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'inventory_catalog.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showNotification('success', 'Inventory catalog exported successfully!');
    } catch (error) {
      showNotification('error', 'Failed to export inventory catalog.');
    }
  };

  const handleExportSalesExcel = async () => {
    try {
      const filteredData = filteredSales.map(sale => ({
        'Item Name': sale.equipment_name,
        'Category': sale.category,
        'Quantity Sold': sale.quantity_sold,
        'Sale Price (₹)': sale.sale_price.toFixed(2),
        'Total Revenue (₹)': sale.total_revenue.toFixed(2),
        'Profit (₹)': sale.profit.toFixed(2),
        'Stock Arrival Date': new Date(sale.stock_arrival_date).toLocaleDateString('en-GB'),
        'Sale Date': new Date(sale.created_at).toLocaleDateString('en-GB'),
        'Sale Time': new Date(sale.created_at).toLocaleTimeString('en-GB')
      }));

      if (filteredData.length === 0) {
        showNotification('error', 'No sales data to export.');
        return;
      }

      const response = await fetch(`${API_URL}/sales/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filteredData)
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sales_log_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showNotification('success', `Sales log exported successfully! (${filteredData.length} records)`);
    } catch (error) {
      showNotification('error', 'Failed to export sales log.');
    }
  };

  const handleImportInventoryExcel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) return;
    setImportLoading(true);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      const response = await fetch(`${API_URL}/inventory/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Import failed');
      setImportResult(data);
      fetchData();
      showNotification('success', `Inventory imported successfully! ${data.imported_count} new items, ${data.updated_count} updated.`);
    } catch (error: any) {
      showNotification('error', error.message || 'Failed to import Excel file.');
    } finally {
      setImportLoading(false);
    }
  };

  const handleImportSalesExcel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salesImportFile) return;
    setSalesImportLoading(true);
    setSalesImportResult(null);
    try {
      const formData = new FormData();
      formData.append('file', salesImportFile);
      const response = await fetch(`${API_URL}/sales/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Import failed');
      setSalesImportResult(data);
      fetchData();
      showNotification('success', `Sales imported successfully! ${data.imported_count} records added.`);
    } catch (error: any) {
      showNotification('error', error.message || 'Failed to import sales Excel file.');
    } finally {
      setSalesImportLoading(false);
    }
  };

  const closeImportModal = () => {
    setIsImportModalOpen(false);
    setImportFile(null);
    setImportResult(null);
  };

  const closeSalesImportModal = () => {
    setIsSalesImportModalOpen(false);
    setSalesImportFile(null);
    setSalesImportResult(null);
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesLowStock = !showLowStockOnly || item.current_stock <= item.min_stock_threshold;
    return matchesSearch && matchesCategory && matchesLowStock;
  });

  const filteredSales = salesRecords.filter(sale => {
    const matchesSearch = sale.equipment_name.toLowerCase().includes(salesSearchQuery.toLowerCase()) ||
      sale.category.toLowerCase().includes(salesSearchQuery.toLowerCase());
    const matchesCategory = salesCategoryFilter === 'All' || sale.category === salesCategoryFilter;
    const matchesDateRange = () => {
      if (!dateRange.start && !dateRange.end) return true;
      const saleDate = new Date(sale.created_at);
      const start = dateRange.start ? new Date(dateRange.start) : new Date(0);
      const end = dateRange.end ? new Date(dateRange.end) : new Date(8640000000000000);
      return saleDate >= start && saleDate <= end;
    };
    return matchesSearch && matchesCategory && matchesDateRange();
  });

  const chartData = CATEGORIES.map(category => {
    const categoryItems = inventory.filter(item => item.category === category);
    const totalCost = categoryItems.reduce((acc, curr) => acc + (curr.current_stock * curr.cost_price), 0);
    const totalRevenue = categoryItems.reduce((acc, curr) => acc + (curr.current_stock * curr.selling_price), 0);
    const potentialProfit = totalRevenue - totalCost;

    return {
      name: category,
      'Stock Value (₹)': Math.round(totalCost),
      'Potential Profit (₹)': Math.round(potentialProfit)
    };
  }).filter(data => data['Stock Value (₹)'] > 0 || data['Potential Profit (₹)'] > 0);

  const totalSalesRevenue = salesRecords.reduce((acc, sale) => acc + sale.total_revenue, 0);
  const totalSalesProfit = salesRecords.reduce((acc, sale) => acc + sale.profit, 0);
  const totalItemsSold = salesRecords.reduce((acc, sale) => acc + sale.quantity_sold, 0);

  return (
    <div className="flex h-screen overflow-hidden bg-cricket-cream">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 flex items-center p-4 rounded-xl shadow-premium border transition-all duration-300 transform translate-y-0 ${notification.type === 'success'
          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
          : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
          <div className="mr-3">
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            )}
          </div>
          <p className="text-sm font-medium">{notification.message}</p>
          <button onClick={() => setNotification(null)} className="ml-4 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="lg:hidden p-2.5 rounded-xl bg-cricket-pitch text-white fixed top-4 left-4 z-50 shadow-lg hover:bg-cricket-forest transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation - Responsive */}
      <aside className={`
        fixed lg:relative inset-y-0 left-0 z-50 
        w-64 bg-cricket-pitch text-white 
        flex flex-col justify-between border-r border-cricket-forest shadow-premium
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div>
          {/* Brand Header */}
          <div className="p-6 border-b border-cricket-forest flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cricket-gold flex items-center justify-center shadow-lg flex-shrink-0">
                <span className="text-cricket-pitch font-bold text-xl">🏏</span>
              </div>
              <div>
                <h1 className="font-extrabold text-lg tracking-tight text-white m-0 leading-tight">STOCK YARD</h1>
                <p className="text-[10px] text-cricket-goldlight font-medium uppercase tracking-wider">Maintenance Engine</p>
              </div>
            </div>
            {/* Close button for mobile */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            <button
              onClick={() => {
                setActiveTab('dashboard');
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${activeTab === 'dashboard'
                ? 'bg-cricket-grass text-white shadow-inner border-l-4 border-cricket-gold'
                : 'text-slate-400 hover:bg-cricket-forest hover:text-white'
                }`}
            >
              <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
              Dashboard Overview
            </button>
            <button
              onClick={() => {
                setActiveTab('inventory');
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${activeTab === 'inventory'
                ? 'bg-cricket-grass text-white shadow-inner border-l-4 border-cricket-gold'
                : 'text-slate-400 hover:bg-cricket-forest hover:text-white'
                }`}
            >
              <Package className="w-4 h-4 flex-shrink-0" />
              Inventory Catalog
            </button>
            <button
              onClick={() => {
                setActiveTab('sales');
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${activeTab === 'sales'
                ? 'bg-cricket-grass text-white shadow-inner border-l-4 border-cricket-gold'
                : 'text-slate-400 hover:bg-cricket-forest hover:text-white'
                }`}
            >
              <Receipt className="w-4 h-4 flex-shrink-0" />
              Sales Log
            </button>
          </nav>
        </div>

        {/* Database Connection Status Block */}
        <div className="p-4 border-t border-cricket-forest">
          <div className={`p-3 rounded-lg flex items-center gap-3 ${dbConnected ? 'bg-emerald-950/40 border border-emerald-900/60' : 'bg-rose-950/40 border border-rose-900/60'
            }`}>
            <Database className={`w-4 h-4 flex-shrink-0 ${dbConnected ? 'text-emerald-400' : 'text-rose-400'}`} />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-300">Supabase Connection</p>
              <p className={`text-[10px] font-bold uppercase ${dbConnected ? 'text-emerald-400' : 'text-rose-400'}`}>
                {dbConnected ? 'Active / Online' : 'Disconnected'}
              </p>
            </div>
            {loading && <RefreshCw className="w-3 h-3 text-slate-400 animate-spin ml-auto flex-shrink-0" />}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-cricket-cream">
        <div className="max-w-7xl mx-auto">
          {/* Top Header */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 md:mb-8">
            <div className="w-full md:w-auto">
              <h2 className="text-2xl md:text-3xl font-extrabold text-cricket-pitch m-0 tracking-tight">
                {activeTab === 'dashboard' ? 'Dashboard Overview' :
                  activeTab === 'inventory' ? 'Inventory Catalog' :
                    'Sales Log'}
              </h2>
              <p className="text-slate-500 text-xs md:text-sm mt-1">
                {activeTab === 'dashboard'
                  ? 'High-level financial summaries and active category allocations.'
                  : activeTab === 'inventory'
                    ? 'Search, filter, update or register items in the cricket stock database.'
                    : 'Track all sales transactions, revenue, and profits.'
                }
              </p>
            </div>

            <div className="flex gap-2 flex-wrap w-full md:w-auto">
              <button
                onClick={fetchData}
                disabled={loading}
                className="p-2.5 rounded-xl border border-cricket-border bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
                title="Refresh Data"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              {activeTab === 'inventory' && (
                <>
                  <button
                    onClick={handleExportInventoryExcel}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-cricket-border text-slate-700 px-3 md:px-4 py-2.5 rounded-xl hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-colors shadow-sm text-xs md:text-sm font-semibold"
                    title="Export inventory as Excel file"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Export Excel</span>
                    <span className="sm:hidden">Export</span>
                  </button>
                  <button
                    onClick={() => { setIsImportModalOpen(true); setImportResult(null); setImportFile(null); }}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-cricket-border text-slate-700 px-3 md:px-4 py-2.5 rounded-xl hover:bg-sky-50 hover:border-sky-300 hover:text-sky-700 transition-colors shadow-sm text-xs md:text-sm font-semibold"
                    title="Import inventory from Excel file"
                  >
                    <Upload className="w-4 h-4" />
                    <span className="hidden sm:inline">Import Excel</span>
                    <span className="sm:hidden">Import</span>
                  </button>
                  <button
                    onClick={() => {
                      setFormData({
                        name: '',
                        category: 'Bats',
                        current_stock: 10,
                        min_stock_threshold: 5,
                        cost_price: 50.0,
                        selling_price: 90.0
                      });
                      setIsAddModalOpen(true);
                    }}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-cricket-grass text-white px-4 md:px-5 py-2.5 rounded-xl hover:bg-cricket-forest transition-colors shadow-md text-xs md:text-sm font-semibold"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Add Equipment</span>
                    <span className="sm:hidden">Add</span>
                  </button>
                </>
              )}
              {activeTab === 'sales' && (
                <>
                  <button
                    onClick={handleExportSalesExcel}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-cricket-border text-slate-700 px-3 md:px-4 py-2.5 rounded-xl hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-colors shadow-sm text-xs md:text-sm font-semibold"
                    title="Export sales log as Excel file"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Export Excel</span>
                    <span className="sm:hidden">Export</span>
                  </button>
                  <button
                    onClick={() => { setIsSalesImportModalOpen(true); setSalesImportResult(null); setSalesImportFile(null); }}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-cricket-border text-slate-700 px-3 md:px-4 py-2.5 rounded-xl hover:bg-sky-50 hover:border-sky-300 hover:text-sky-700 transition-colors shadow-sm text-xs md:text-sm font-semibold"
                    title="Import sales from Excel file"
                  >
                    <Upload className="w-4 h-4" />
                    <span className="hidden sm:inline">Import Excel</span>
                    <span className="sm:hidden">Import</span>
                  </button>
                </>
              )}
            </div>
          </header>

          {/* LOADING INDICATOR */}
          {loading && inventory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96">
              <div className="w-12 h-12 border-4 border-cricket-grass border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-500 mt-4 font-semibold text-sm">Syncing with stock register...</p>
            </div>
          ) : (
            <>
              {/* VIEW 1: DASHBOARD VIEW */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6 md:space-y-8 animate-fadeIn">
                  {/* Metric Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                    {/* Metric 1 */}
                    <div className="bg-white p-4 md:p-6 rounded-2xl border border-cricket-border shadow-premium flex justify-between items-start">
                      <div>
                        <span className="text-[10px] md:text-xs font-bold uppercase text-slate-400 tracking-wider">Total Stock Value</span>
                        <h3 className="text-lg md:text-2xl font-black text-cricket-pitch mt-1 md:mt-2">
                          ₹{metrics.total_investment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h3>
                        <p className="text-[8px] md:text-[10px] text-slate-500 font-semibold mt-0.5 md:mt-1">Valued at aggregate cost prices</p>
                      </div>
                      <div className="p-2 md:p-3 bg-emerald-50 text-cricket-grass rounded-xl">
                        <Coins className="w-5 h-5 md:w-6 md:h-6" />
                      </div>
                    </div>

                    {/* Metric 2 */}
                    <div className="bg-white p-4 md:p-6 rounded-2xl border border-cricket-border shadow-premium flex justify-between items-start border-b-4 border-b-cricket-gold">
                      <div>
                        <span className="text-[10px] md:text-xs font-bold uppercase text-slate-400 tracking-wider">Projected Profit</span>
                        <h3 className="text-lg md:text-2xl font-black text-cricket-gold mt-1 md:mt-2">
                          ₹{metrics.potential_profit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h3>
                        <p className="text-[8px] md:text-[10px] text-slate-500 font-semibold mt-0.5 md:mt-1">If all items are sold at selling price</p>
                      </div>
                      <div className="p-2 md:p-3 bg-amber-50 text-cricket-gold rounded-xl">
                        <TrendingUp className="w-5 h-5 md:w-6 md:h-6" />
                      </div>
                    </div>

                    {/* Metric 3 */}
                    <div className="bg-white p-4 md:p-6 rounded-2xl border border-cricket-border shadow-premium flex justify-between items-start">
                      <div>
                        <span className="text-[10px] md:text-xs font-bold uppercase text-slate-400 tracking-wider">Active Catalog items</span>
                        <h3 className="text-lg md:text-2xl font-black text-cricket-pitch mt-1 md:mt-2">{metrics.total_unique_items}</h3>
                        <p className="text-[8px] md:text-[10px] text-slate-500 font-semibold mt-0.5 md:mt-1">
                          Total in stock: <span className="font-bold">{metrics.total_stock_count} units</span>
                        </p>
                      </div>
                      <div className="p-2 md:p-3 bg-sky-50 text-sky-600 rounded-xl">
                        <Package className="w-5 h-5 md:w-6 md:h-6" />
                      </div>
                    </div>

                    {/* Metric 4 - Low Stock Card */}
                    <div className={`p-4 md:p-6 rounded-2xl border shadow-premium flex justify-between items-start transition-all ${metrics.low_stock_count > 0
                      ? 'bg-rose-50 border-rose-200 border-b-4 border-b-rose-500 animate-pulse'
                      : 'bg-white border-cricket-border'
                      }`}>
                      <div>
                        <span className="text-[10px] md:text-xs font-bold uppercase text-slate-400 tracking-wider">Low Stock Alerts</span>
                        <h3 className={`text-lg md:text-2xl font-black mt-1 md:mt-2 ${metrics.low_stock_count > 0 ? 'text-rose-600' : 'text-cricket-pitch'}`}>
                          {metrics.low_stock_count}
                        </h3>
                        <p className="text-[8px] md:text-[10px] text-slate-500 font-semibold mt-0.5 md:mt-1">Items at or below thresholds</p>
                      </div>
                      <div className={`p-2 md:p-3 rounded-xl ${metrics.low_stock_count > 0 ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-400'}`}>
                        <AlertTriangle className="w-5 h-5 md:w-6 md:h-6" />
                      </div>
                    </div>
                  </div>

                  {/* Dashboard Secondary Layout: Chart & Low Stock Alerts */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                    {/* Recharts Allocation */}
                    <div className="lg:col-span-2 bg-white p-4 md:p-6 rounded-2xl border border-cricket-border shadow-premium">
                      <div className="flex justify-between items-center mb-4 md:mb-6">
                        <div>
                          <h4 className="text-base md:text-lg font-bold text-cricket-pitch m-0">Category Breakdown</h4>
                          <p className="text-[10px] md:text-xs text-slate-500">Stock Asset Valuation vs. Potential Profits</p>
                        </div>
                      </div>
                      <div className="h-64 md:h-80 w-full">
                        {chartData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                              <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} />
                              <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
                              <Tooltip
                                contentStyle={{ background: '#0A251C', border: 'none', borderRadius: '12px', color: '#fff' }}
                                labelStyle={{ fontWeight: 'bold', color: '#C5A85A' }}
                              />
                              <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                              <Bar dataKey="Stock Value (₹)" fill="#1A5C45" radius={[4, 4, 0, 0]} />
                              <Bar dataKey="Potential Profit (₹)" fill="#C5A85A" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <Package className="w-8 h-8 md:w-10 md:h-10 mb-2 stroke-[1.5]" />
                            <p className="text-xs md:text-sm font-semibold text-center px-4">No equipment registered yet. Go to Inventory tab to add items.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Low Stock Alert details */}
                    <div className="bg-white p-4 md:p-6 rounded-2xl border border-cricket-border shadow-premium flex flex-col">
                      <div className="flex justify-between items-center mb-3 md:mb-4 pb-3 md:pb-4 border-b border-slate-100">
                        <div>
                          <h4 className="text-base md:text-lg font-bold text-cricket-pitch m-0">Action Items</h4>
                          <p className="text-[10px] md:text-xs text-slate-500">Replenish stock list immediately</p>
                        </div>
                        <span className="bg-rose-100 text-rose-700 text-[10px] md:text-xs px-2.5 py-1 rounded-full font-bold">
                          {metrics.low_stock_count} Alert(s)
                        </span>
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-3 max-h-[200px] md:max-h-[280px]">
                        {metrics.low_stock_alerts && metrics.low_stock_alerts.length > 0 ? (
                          metrics.low_stock_alerts.map(item => (
                            <div key={item.id} className="p-3 bg-rose-50/50 rounded-xl border border-rose-100 flex items-center justify-between">
                              <div>
                                <p className="text-sm font-bold text-slate-800">{item.name}</p>
                                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{item.category}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-xs font-bold text-rose-600 block bg-rose-100/80 px-2 py-0.5 rounded-md">
                                  Stock: {item.current_stock} / {item.min_stock_threshold}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full py-8 md:py-12 text-slate-400">
                            <CheckCircle className="w-6 h-6 md:w-8 md:h-8 text-emerald-500 mb-2" />
                            <p className="text-xs md:text-sm font-semibold text-center px-4">All stocks are above minimum thresholds.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Sales Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 mt-6 md:mt-8">
                    <div className="bg-white p-4 md:p-6 rounded-2xl border border-cricket-border shadow-premium flex justify-between items-start">
                      <div>
                        <span className="text-[10px] md:text-xs font-bold uppercase text-slate-400 tracking-wider">Total Revenue</span>
                        <h3 className="text-lg md:text-2xl font-black text-cricket-pitch mt-1 md:mt-2">
                          ₹{totalSalesRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h3>
                        <p className="text-[8px] md:text-[10px] text-slate-500 font-semibold mt-0.5 md:mt-1">From all sales transactions</p>
                      </div>
                      <div className="p-2 md:p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <TrendingUp className="w-5 h-5 md:w-6 md:h-6" />
                      </div>
                    </div>

                    <div className="bg-white p-4 md:p-6 rounded-2xl border border-cricket-border shadow-premium flex justify-between items-start border-b-4 border-b-emerald-500">
                      <div>
                        <span className="text-[10px] md:text-xs font-bold uppercase text-slate-400 tracking-wider">Total Profit</span>
                        <h3 className="text-lg md:text-2xl font-black text-emerald-600 mt-1 md:mt-2">
                          ₹{totalSalesProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h3>
                        <p className="text-[8px] md:text-[10px] text-slate-500 font-semibold mt-0.5 md:mt-1">Actual profit from sales</p>
                      </div>
                      <div className="p-2 md:p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                        <Coins className="w-5 h-5 md:w-6 md:h-6" />
                      </div>
                    </div>

                    <div className="bg-white p-4 md:p-6 rounded-2xl border border-cricket-border shadow-premium flex justify-between items-start">
                      <div>
                        <span className="text-[10px] md:text-xs font-bold uppercase text-slate-400 tracking-wider">Total Items Sold</span>
                        <h3 className="text-lg md:text-2xl font-black text-cricket-pitch mt-1 md:mt-2">{totalItemsSold}</h3>
                        <p className="text-[8px] md:text-[10px] text-slate-500 font-semibold mt-0.5 md:mt-1">Across all transactions</p>
                      </div>
                      <div className="p-2 md:p-3 bg-purple-50 text-purple-600 rounded-xl">
                        <ShoppingCart className="w-5 h-5 md:w-6 md:h-6" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW 2: INVENTORY VIEW */}
              {activeTab === 'inventory' && (
                <div className="bg-white rounded-2xl border border-cricket-border shadow-premium overflow-hidden animate-fadeIn">
                  {/* Search / Filters Panel */}
                  <div className="p-4 md:p-6 border-b border-cricket-border bg-slate-50/60 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
                    {/* Search box */}
                    <div className="relative w-full md:max-w-md">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search items by name or category..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-cricket-border rounded-xl focus:outline-none focus:ring-2 focus:ring-cricket-grass/40 focus:border-cricket-grass text-sm bg-white"
                      />
                    </div>

                    {/* Filter Toolbar options */}
                    <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full md:w-auto">
                      <div className="flex items-center gap-2 flex-1 md:flex-none">
                        <Filter className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="flex-1 md:flex-none border border-cricket-border rounded-xl px-3 py-2 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-cricket-grass/40"
                        >
                          <option value="All">All Categories</option>
                          {allCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 border border-cricket-border rounded-xl hover:bg-slate-50 transition-colors flex-1 md:flex-none justify-center">
                        <input
                          type="checkbox"
                          checked={showLowStockOnly}
                          onChange={(e) => setShowLowStockOnly(e.target.checked)}
                          className="rounded border-slate-300 text-cricket-grass focus:ring-cricket-grass/40 w-3.5 h-3.5"
                        />
                        <span className="text-xs font-bold text-slate-600">Low Stock</span>
                      </label>
                    </div>
                  </div>

                  {/* Table list - Scrollable on mobile */}
                  <div className="overflow-x-auto -mx-4 md:mx-0">
                    <div className="inline-block min-w-full align-middle">
                      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                        <table className="min-w-[700px] md:min-w-full divide-y divide-slate-200">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-bold uppercase text-slate-500 tracking-wider">Item</th>
                              <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-bold uppercase text-slate-500 tracking-wider">Category</th>
                              <th className="px-4 md:px-6 py-3 md:py-4 text-center text-xs font-bold uppercase text-slate-500 tracking-wider">Total Quantity</th>
                              <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-bold uppercase text-slate-500 tracking-wider">Cost Per Unit</th>
                              <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-bold uppercase text-slate-500 tracking-wider">Total Cost</th>
                              <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-bold uppercase text-slate-500 tracking-wider">Item Entry Date</th>
                              <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-bold uppercase text-slate-500 tracking-wider">Item Exit Date</th>
                              <th className="px-4 md:px-6 py-3 md:py-4 text-center text-xs font-bold uppercase text-slate-500 tracking-wider">Item Exit Quantity</th>
                              <th className="px-4 md:px-6 py-3 md:py-4 text-right text-xs font-bold uppercase text-slate-500 tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {filteredInventory.length > 0 ? (
                              filteredInventory.map(item => {
                                const isLowStock = item.current_stock <= item.min_stock_threshold;
                                const totalCost = item.current_stock * item.cost_price;

                                // Filter sales records for this item
                                const itemSales = salesRecords.filter(s => s.equipment_id === item.id || s.equipment_name === item.name);
                                const totalExitQuantity = itemSales.reduce((acc, s) => acc + s.quantity_sold, 0);

                                // Get latest sale exit date if available
                                const sortedSales = itemSales.length > 0
                                  ? [...itemSales].sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
                                  : [];
                                const latestSale = sortedSales.length > 0 ? sortedSales[0] : null;

                                const exitDateFormatted = latestSale
                                  ? new Date(latestSale.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                                  : 'N/A';
                                const exitTimeFormatted = latestSale
                                  ? new Date(latestSale.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
                                  : '';

                                return (
                                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                                    <td className="px-4 md:px-6 py-3 md:py-4">
                                      <div className="font-bold text-slate-800 text-sm md:text-base">{item.name}</div>
                                    </td>
                                    <td className="px-4 md:px-6 py-3 md:py-4">
                                      <span className="inline-block px-2 py-0.5 md:px-2.5 md:py-1 text-[8px] md:text-[10px] font-bold rounded-full bg-slate-100 text-slate-600 uppercase tracking-wider">
                                        {item.category}
                                      </span>
                                    </td>
                                    <td className="px-4 md:px-6 py-3 md:py-4 text-center">
                                      <div className="flex items-center justify-center gap-1">
                                        <span className={`text-xs md:text-sm font-extrabold ${isLowStock ? 'text-rose-600' : 'text-slate-800'}`}>
                                          {item.current_stock}
                                        </span>
                                        <span className="text-slate-400 text-[8px] md:text-[10px] font-semibold hidden sm:inline">/ {item.min_stock_threshold}</span>
                                        {isLowStock && (
                                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" title="Low stock alert" />
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-4 md:px-6 py-3 md:py-4">
                                      <span className="text-xs md:text-sm font-semibold text-slate-700">₹{Number(item.cost_price).toFixed(2)}</span>
                                    </td>
                                    <td className="px-4 md:px-6 py-3 md:py-4">
                                      <span className="text-xs md:text-sm font-bold text-slate-800">₹{totalCost.toFixed(2)}</span>
                                    </td>
                                    <td className="px-4 md:px-6 py-3 md:py-4">
                                      <div className="flex flex-col">
                                        <span className="text-xs md:text-sm font-semibold text-slate-700">
                                          {new Date(item.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </span>
                                        <span className="text-[8px] md:text-[10px] text-slate-400 font-medium">
                                          {new Date(item.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="px-4 md:px-6 py-3 md:py-4">
                                      <div className="flex flex-col">
                                        <span className={`text-xs md:text-sm font-semibold ${latestSale ? 'text-slate-700' : 'text-slate-400 italic'}`}>
                                          {exitDateFormatted}
                                        </span>
                                        {latestSale && (
                                          <span className="text-[8px] md:text-[10px] text-slate-400 font-medium">
                                            {exitTimeFormatted}
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-4 md:px-6 py-3 md:py-4 text-center">
                                      <span className={`text-xs md:text-sm font-extrabold ${totalExitQuantity > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                                        {totalExitQuantity}
                                      </span>
                                    </td>
                                    <td className="px-4 md:px-6 py-3 md:py-4 text-right">
                                      <div className="flex justify-end gap-1">
                                        <button
                                          onClick={() => openSellModal(item)}
                                          disabled={item.current_stock === 0}
                                          className={`flex items-center gap-0.5 md:gap-1 px-2 md:px-3 py-1 rounded-lg text-[10px] md:text-xs font-bold shadow-sm transition-colors ${item.current_stock === 0
                                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                                            : 'bg-cricket-gold text-cricket-pitch hover:bg-cricket-accent'
                                            }`}
                                          title={item.current_stock === 0 ? "Out of stock" : "Log a Sale"}
                                        >
                                          <ShoppingCart className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                          <span className="hidden sm:inline">Sell</span>
                                        </button>
                                        <button
                                          onClick={() => openEditModal(item)}
                                          className="p-1 text-slate-500 hover:text-cricket-grass hover:bg-slate-100 rounded-lg transition-colors"
                                          title="Edit Details"
                                        >
                                          <Edit3 className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteEquipment(item.id, item.name)}
                                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                          title="Delete Equipment"
                                        >
                                          <Trash2 className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })
                            ) : (
                              <tr>
                                <td colSpan={9} className="text-center py-8 md:py-12 text-slate-400">
                                  <Info className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-slate-300" />
                                  <p className="text-sm font-semibold">No equipment found matching filters.</p>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW 3: SALES LOG */}
              {activeTab === 'sales' && (
                <div className="space-y-4 md:space-y-6 animate-fadeIn">
                  {/* Sales Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                    <div className="bg-white p-4 md:p-6 rounded-2xl border border-cricket-border shadow-premium flex justify-between items-start">
                      <div>
                        <span className="text-[10px] md:text-xs font-bold uppercase text-slate-400 tracking-wider">Total Revenue</span>
                        <h3 className="text-lg md:text-2xl font-black text-cricket-pitch mt-1 md:mt-2">
                          ₹{totalSalesRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h3>
                        <p className="text-[8px] md:text-[10px] text-slate-500 font-semibold mt-0.5 md:mt-1">From {salesRecords.length} transactions</p>
                      </div>
                      <div className="p-2 md:p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <TrendingUp className="w-5 h-5 md:w-6 md:h-6" />
                      </div>
                    </div>

                    <div className="bg-white p-4 md:p-6 rounded-2xl border border-cricket-border shadow-premium flex justify-between items-start border-b-4 border-b-emerald-500">
                      <div>
                        <span className="text-[10px] md:text-xs font-bold uppercase text-slate-400 tracking-wider">Total Profit</span>
                        <h3 className="text-lg md:text-2xl font-black text-emerald-600 mt-1 md:mt-2">
                          ₹{totalSalesProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h3>
                        <p className="text-[8px] md:text-[10px] text-slate-500 font-semibold mt-0.5 md:mt-1">Actual profit from sales</p>
                      </div>
                      <div className="p-2 md:p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                        <Coins className="w-5 h-5 md:w-6 md:h-6" />
                      </div>
                    </div>

                    <div className="bg-white p-4 md:p-6 rounded-2xl border border-cricket-border shadow-premium flex justify-between items-start">
                      <div>
                        <span className="text-[10px] md:text-xs font-bold uppercase text-slate-400 tracking-wider">Total Items Sold</span>
                        <h3 className="text-lg md:text-2xl font-black text-cricket-pitch mt-1 md:mt-2">{totalItemsSold}</h3>
                        <p className="text-[8px] md:text-[10px] text-slate-500 font-semibold mt-0.5 md:mt-1">Across all categories</p>
                      </div>
                      <div className="p-2 md:p-3 bg-purple-50 text-purple-600 rounded-xl">
                        <ShoppingCart className="w-5 h-5 md:w-6 md:h-6" />
                      </div>
                    </div>
                  </div>

                  {/* Sales Log Table */}
                  <div className="bg-white rounded-2xl border border-cricket-border shadow-premium overflow-hidden">
                    {/* Search / Filters Panel */}
                    <div className="p-4 md:p-6 border-b border-cricket-border bg-slate-50/60 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
                      <div className="relative w-full md:max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search sales by item name..."
                          value={salesSearchQuery}
                          onChange={(e) => setSalesSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-cricket-border rounded-xl focus:outline-none focus:ring-2 focus:ring-cricket-grass/40 focus:border-cricket-grass text-sm bg-white"
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full md:w-auto">
                        <div className="flex items-center gap-2 flex-1 md:flex-none">
                          <Filter className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <select
                            value={salesCategoryFilter}
                            onChange={(e) => setSalesCategoryFilter(e.target.value)}
                            className="flex-1 md:flex-none border border-cricket-border rounded-xl px-3 py-2 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-cricket-grass/40"
                          >
                            <option value="All">All Categories</option>
                            {allCategories.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center gap-1 md:gap-2 flex-1 md:flex-none">
                          <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                            className="flex-1 md:flex-none border border-cricket-border rounded-xl px-2 md:px-3 py-2 bg-white text-[10px] md:text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-cricket-grass/40"
                            placeholder="Start"
                          />
                          <span className="text-slate-400 text-[10px] md:text-xs">to</span>
                          <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                            className="flex-1 md:flex-none border border-cricket-border rounded-xl px-2 md:px-3 py-2 bg-white text-[10px] md:text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-cricket-grass/40"
                            placeholder="End"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Sales Table - Scrollable on mobile */}
                    <div className="overflow-x-auto -mx-4 md:mx-0">
                      <div className="inline-block min-w-full align-middle">
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                          <table className="min-w-[800px] md:min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                              <tr>
                                <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-bold uppercase text-slate-500 tracking-wider">Item</th>
                                <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-bold uppercase text-slate-500 tracking-wider">Category</th>
                                <th className="px-4 md:px-6 py-3 md:py-4 text-center text-xs font-bold uppercase text-slate-500 tracking-wider">Qty</th>
                                <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-bold uppercase text-slate-500 tracking-wider">Sale Price</th>
                                <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-bold uppercase text-slate-500 tracking-wider">Revenue</th>
                                <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-bold uppercase text-slate-500 tracking-wider hidden sm:table-cell">Profit</th>
                                <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-bold uppercase text-slate-500 tracking-wider hidden lg:table-cell">Arrival Date</th>
                                <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-bold uppercase text-slate-500 tracking-wider hidden xl:table-cell">Sale Date</th>
                                <th className="px-4 md:px-6 py-3 md:py-4 text-center text-xs font-bold uppercase text-slate-500 tracking-wider">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                              {filteredSales.length > 0 ? (
                                filteredSales.map(sale => (
                                  <tr key={sale.id} className="hover:bg-slate-50/60 transition-colors">
                                    <td className="px-4 md:px-6 py-3 md:py-4">
                                      <div className="font-bold text-slate-800 text-sm md:text-base">{sale.equipment_name}</div>
                                    </td>
                                    <td className="px-4 md:px-6 py-3 md:py-4">
                                      <span className="inline-block px-2 py-0.5 md:px-2.5 md:py-1 text-[8px] md:text-[10px] font-bold rounded-full bg-slate-100 text-slate-600 uppercase tracking-wider">
                                        {sale.category}
                                      </span>
                                    </td>
                                    <td className="px-4 md:px-6 py-3 md:py-4 text-center">
                                      <span className="text-xs md:text-sm font-extrabold text-cricket-pitch">{sale.quantity_sold}</span>
                                    </td>
                                    <td className="px-4 md:px-6 py-3 md:py-4">
                                      <span className="text-xs md:text-sm font-semibold text-slate-700">₹{Number(sale.sale_price).toFixed(2)}</span>
                                    </td>
                                    <td className="px-4 md:px-6 py-3 md:py-4">
                                      <span className="text-xs md:text-sm font-bold text-blue-600">₹{Number(sale.total_revenue).toFixed(2)}</span>
                                    </td>
                                    <td className="px-4 md:px-6 py-3 md:py-4 hidden sm:table-cell">
                                      <span className={`text-xs md:text-sm font-black ${sale.profit > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        ₹{Number(sale.profit).toFixed(2)}
                                      </span>
                                    </td>
                                    <td className="px-4 md:px-6 py-3 md:py-4 hidden lg:table-cell">
                                      <span className="text-xs md:text-sm font-semibold text-slate-700">
                                        {new Date(sale.stock_arrival_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                      </span>
                                    </td>
                                    <td className="px-4 md:px-6 py-3 md:py-4 hidden xl:table-cell">
                                      <div className="flex flex-col">
                                        <span className="text-xs md:text-sm font-semibold text-slate-700">
                                          {new Date(sale.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </span>
                                        <span className="text-[8px] md:text-[10px] text-slate-400 font-medium">
                                          {new Date(sale.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="px-4 md:px-6 py-3 md:py-4 text-center">
                                      <button
                                        onClick={() => handleDeleteSale(sale.id, sale.equipment_name, sale.quantity_sold)}
                                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                        title="Delete Sale Record"
                                      >
                                        <Trash2 className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={9} className="text-center py-8 md:py-12 text-slate-400">
                                    <Receipt className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-slate-300" />
                                    <p className="text-sm font-semibold">No sales records found.</p>
                                    <p className="text-[10px] md:text-xs text-slate-400 mt-1">Start selling items from the Inventory Catalog.</p>
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* MODAL 1: ADD NEW EQUIPMENT */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-cricket-dark/60 backdrop-blur-sm p-0 md:p-4">
          <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl border border-cricket-border max-w-md w-full max-h-[90vh] overflow-y-auto animate-slideUp md:animate-scaleIn">
            <div className="bg-cricket-pitch text-white px-4 md:px-6 py-4 flex justify-between items-center sticky top-0 z-10">
              <div>
                <h3 className="font-extrabold text-base m-0 text-white">Add New Equipment</h3>
                <p className="text-[10px] text-cricket-goldlight mt-0.5">Register new batch in the database catalog</p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white transition-colors p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddEquipment} className="p-4 md:p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Equipment Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gray-Nicolls Legend Bat"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-cricket-border rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cricket-grass/40 focus:border-cricket-grass"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Category
                    <span className="ml-1 normal-case font-normal text-slate-400">(or type new)</span>
                  </label>
                  <input
                    type="text"
                    list="add-category-options"
                    required
                    placeholder="Select or type a category..."
                    value={formData.category}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData({ ...formData, category: value });
                      const trimmed = value.trim();
                      if (trimmed && !CATEGORIES.includes(trimmed) && !customCategories.includes(trimmed)) {
                        setCustomCategories(prev => [...prev, trimmed]);
                      }
                    }}
                    className="w-full border border-cricket-border rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cricket-grass/40 focus:border-cricket-grass bg-white"
                  />
                  <datalist id="add-category-options">
                    {allCategories.map(cat => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                  {formData.category.trim() && !CATEGORIES.includes(formData.category.trim()) && !customCategories.includes(formData.category.trim()) && (
                    <p className="text-[10px] text-emerald-600 mt-1 font-medium">
                      New category "{formData.category.trim()}" will be added
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Min Threshold</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.min_stock_threshold}
                    onChange={(e) => setFormData({ ...formData, min_stock_threshold: parseInt(e.target.value) || 0 })}
                    className="w-full border border-cricket-border rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cricket-grass/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Initial Stock</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.current_stock}
                    onChange={(e) => setFormData({ ...formData, current_stock: parseInt(e.target.value) || 0 })}
                    className="w-full border border-cricket-border rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cricket-grass/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Cost Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-cricket-border rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cricket-grass/40"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Selling (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-cricket-border rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cricket-grass/40"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="text-xs font-semibold text-emerald-800">
                  Potential profit per unit: ₹{(formData.selling_price - formData.cost_price).toFixed(2)}
                </span>
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-cricket-border rounded-xl text-slate-600 hover:bg-slate-50 text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cricket-grass hover:bg-cricket-forest text-white rounded-xl text-xs font-bold shadow-md transition-colors"
                >
                  Add Equipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT EQUIPMENT */}
      {isEditModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-cricket-dark/60 backdrop-blur-sm p-0 md:p-4">
          <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl border border-cricket-border max-w-md w-full max-h-[90vh] overflow-y-auto animate-slideUp md:animate-scaleIn">
            <div className="bg-cricket-pitch text-white px-4 md:px-6 py-4 flex justify-between items-center sticky top-0 z-10">
              <div>
                <h3 className="font-extrabold text-base m-0 text-white">Update Equipment</h3>
                <p className="text-[10px] text-cricket-goldlight mt-0.5">Edit attributes of {selectedItem.name}</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-white transition-colors p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditEquipment} className="p-4 md:p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Equipment Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-cricket-border rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cricket-grass/40 focus:border-cricket-grass"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Category
                    <span className="ml-1 normal-case font-normal text-slate-400">(or type new)</span>
                  </label>
                  <input
                    type="text"
                    list="edit-category-options"
                    required
                    placeholder="Select or type a category..."
                    value={formData.category}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData({ ...formData, category: value });
                      const trimmed = value.trim();
                      if (trimmed && !CATEGORIES.includes(trimmed) && !customCategories.includes(trimmed)) {
                        setCustomCategories(prev => [...prev, trimmed]);
                      }
                    }}
                    className="w-full border border-cricket-border rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cricket-grass/40 focus:border-cricket-grass bg-white"
                  />
                  <datalist id="edit-category-options">
                    {allCategories.map(cat => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                  {formData.category.trim() && !CATEGORIES.includes(formData.category.trim()) && !customCategories.includes(formData.category.trim()) && (
                    <p className="text-[10px] text-emerald-600 mt-1 font-medium">
                      New category "{formData.category.trim()}" will be added
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Min Threshold</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.min_stock_threshold}
                    onChange={(e) => setFormData({ ...formData, min_stock_threshold: parseInt(e.target.value) || 0 })}
                    className="w-full border border-cricket-border rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cricket-grass/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Stock Level</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.current_stock}
                    onChange={(e) => setFormData({ ...formData, current_stock: parseInt(e.target.value) || 0 })}
                    className="w-full border border-cricket-border rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cricket-grass/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Cost Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-cricket-border rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cricket-grass/40"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Selling (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-cricket-border rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cricket-grass/40"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-cricket-border rounded-xl text-slate-600 hover:bg-slate-50 text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cricket-grass hover:bg-cricket-forest text-white rounded-xl text-xs font-bold shadow-md transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: QUICK SELL (LOG A SALE) */}
      {isSellModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-cricket-dark/60 backdrop-blur-sm p-0 md:p-4">
          <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl border border-cricket-border max-w-md w-full max-h-[90vh] overflow-y-auto animate-slideUp md:animate-scaleIn">
            <div className="bg-cricket-pitch text-white px-4 md:px-6 py-4 flex justify-between items-center sticky top-0 z-10">
              <div>
                <h3 className="font-extrabold text-base m-0 text-white">Log Cricket Equipment Sale</h3>
                <p className="text-[10px] text-cricket-goldlight mt-0.5">Record customer purchase details</p>
              </div>
              <button onClick={() => setIsSellModalOpen(false)} className="text-slate-400 hover:text-white transition-colors p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLogSale} className="p-4 md:p-6 space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs font-bold uppercase text-slate-400 tracking-wider">Product</p>
                <h4 className="text-base font-bold text-slate-800 mt-1">{selectedItem.name}</h4>
                <div className="flex flex-wrap gap-4 mt-2 text-xs font-semibold text-slate-500">
                  <span>Available Stock: <strong className="text-slate-800">{selectedItem.current_stock} units</strong></span>
                  <span>Unit Cost: <strong className="text-slate-800">₹{selectedItem.cost_price}</strong></span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Quantity Sold</label>
                <input
                  type="number"
                  min="1"
                  max={selectedItem.current_stock}
                  required
                  value={sellData.quantity_sold}
                  onChange={(e) => setSellData({ ...sellData, quantity_sold: Math.min(selectedItem.current_stock, parseInt(e.target.value) || 1) })}
                  className="w-full border border-cricket-border rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cricket-grass/40"
                />
                <p className="text-[10px] text-slate-400 mt-1 font-medium">Cannot exceed current stock level of {selectedItem.current_stock}.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Sale Price per unit (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={sellData.sale_price}
                  onChange={(e) => setSellData({ ...sellData, sale_price: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-cricket-border rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cricket-grass/40"
                />
              </div>

              {(() => {
                const totalRevenue = sellData.quantity_sold * sellData.sale_price;
                const totalCost = sellData.quantity_sold * selectedItem.cost_price;
                const actualProfit = totalRevenue - totalCost;

                return (
                  <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-1.5 text-xs font-semibold">
                    <div className="flex justify-between text-slate-600">
                      <span>Total Revenue:</span>
                      <span>₹{totalRevenue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Cost of Goods Sold (COGS):</span>
                      <span>₹{totalCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-base font-black border-t border-emerald-100 pt-1.5 mt-1.5 text-emerald-800">
                      <span>Actual Profit:</span>
                      <span>₹{actualProfit.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })()}

              <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSellModalOpen(false)}
                  className="px-4 py-2 border border-cricket-border rounded-xl text-slate-600 hover:bg-slate-50 text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cricket-gold hover:bg-cricket-accent text-cricket-pitch rounded-xl text-xs font-bold shadow-md transition-colors"
                >
                  Confirm Sale
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: IMPORT INVENTORY EXCEL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-cricket-dark/60 backdrop-blur-sm p-0 md:p-4">
          <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl border border-cricket-border max-w-lg w-full max-h-[90vh] overflow-y-auto animate-slideUp md:animate-scaleIn">
            <div className="bg-cricket-pitch text-white px-4 md:px-6 py-4 flex justify-between items-center sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cricket-gold/20 rounded-lg">
                  <FileSpreadsheet className="w-5 h-5 text-cricket-gold" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base m-0 text-white">Import Inventory</h3>
                  <p className="text-[10px] text-cricket-goldlight mt-0.5">Bulk upload via .xlsx file</p>
                </div>
              </div>
              <button onClick={closeImportModal} className="text-slate-400 hover:text-white transition-colors p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 md:p-6 space-y-5">
              <div className="p-4 bg-sky-50 rounded-xl border border-sky-100">
                <p className="text-xs font-bold text-sky-800 uppercase tracking-wider mb-2">Required Column Headers</p>
                <div className="flex flex-wrap gap-1.5">
                  {['name', 'category', 'current_stock', 'cost_price', 'selling_price'].map(col => (
                    <code key={col} className="text-[11px] bg-sky-100 text-sky-700 px-2 py-0.5 rounded-md font-mono font-semibold">{col}</code>
                  ))}
                </div>
                <p className="text-[10px] text-sky-600 mt-2 font-medium">
                  Optional: <code className="font-mono">min_stock_threshold</code> — defaults to 5 if omitted.<br />
                  Existing items (matched by name) will be <strong>updated</strong>; new ones will be <strong>inserted</strong>.
                </p>
              </div>

              {!importResult ? (
                <form onSubmit={handleImportInventoryExcel} className="space-y-4">
                  <label
                    htmlFor="excel-upload"
                    className={`flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${importFile
                      ? 'border-cricket-grass bg-emerald-50'
                      : 'border-slate-300 bg-slate-50 hover:border-cricket-grass hover:bg-emerald-50/40'
                      }`}
                  >
                    {importFile ? (
                      <>
                        <FileSpreadsheet className="w-8 h-8 text-cricket-grass mb-2" />
                        <p className="text-sm font-bold text-cricket-grass">{importFile.name}</p>
                        <p className="text-[10px] text-slate-500 mt-1">
                          {(importFile.size / 1024).toFixed(1)} KB — click to change
                        </p>
                      </>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-slate-400 mb-2" />
                        <p className="text-sm font-semibold text-slate-600">Click to upload or drag & drop</p>
                        <p className="text-[10px] text-slate-400 mt-1">.xlsx or .xls files only</p>
                      </>
                    )}
                    <input
                      id="excel-upload"
                      type="file"
                      accept=".xlsx,.xls"
                      className="hidden"
                      onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    />
                  </label>

                  <div className="flex gap-2 justify-end pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={closeImportModal}
                      className="px-4 py-2 border border-cricket-border rounded-xl text-slate-600 hover:bg-slate-50 text-xs font-bold transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!importFile || importLoading}
                      className="flex items-center gap-2 px-5 py-2 bg-cricket-grass hover:bg-cricket-forest text-white rounded-xl text-xs font-bold shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {importLoading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          Import File
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                      <p className="text-2xl font-black text-emerald-700">{importResult.imported_count}</p>
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mt-0.5">New Items</p>
                    </div>
                    <div className="p-3 bg-sky-50 rounded-xl border border-sky-100 text-center">
                      <p className="text-2xl font-black text-sky-700">{importResult.updated_count}</p>
                      <p className="text-[10px] font-bold text-sky-600 uppercase tracking-wider mt-0.5">Updated</p>
                    </div>
                  </div>

                  {importResult.errors.length > 0 && (
                    <div className="max-h-40 overflow-y-auto space-y-1.5 p-3 bg-rose-50 rounded-xl border border-rose-100">
                      <p className="text-[10px] font-bold text-rose-700 uppercase tracking-wider mb-2">
                        {importResult.errors.length} Row Error(s)
                      </p>
                      {importResult.errors.map((err, i) => (
                        <p key={i} className="text-xs text-rose-700 font-medium">{err}</p>
                      ))}
                    </div>
                  )}

                  {importResult.errors.length === 0 && (
                    <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                      <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <p className="text-xs font-semibold text-emerald-800">All rows imported successfully!</p>
                    </div>
                  )}

                  <div className="flex gap-2 justify-end pt-1 border-t border-slate-100">
                    <button
                      onClick={() => { setImportFile(null); setImportResult(null); }}
                      className="px-4 py-2 border border-cricket-border rounded-xl text-slate-600 hover:bg-slate-50 text-xs font-bold transition-colors"
                    >
                      Import Another
                    </button>
                    <button
                      onClick={closeImportModal}
                      className="px-5 py-2 bg-cricket-grass hover:bg-cricket-forest text-white rounded-xl text-xs font-bold shadow-md transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: IMPORT SALES EXCEL */}
      {isSalesImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-cricket-dark/60 backdrop-blur-sm p-0 md:p-4">
          <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl border border-cricket-border max-w-lg w-full max-h-[90vh] overflow-y-auto animate-slideUp md:animate-scaleIn">
            <div className="bg-cricket-pitch text-white px-4 md:px-6 py-4 flex justify-between items-center sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cricket-gold/20 rounded-lg">
                  <FileSpreadsheet className="w-5 h-5 text-cricket-gold" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base m-0 text-white">Import Sales</h3>
                  <p className="text-[10px] text-cricket-goldlight mt-0.5">Bulk upload sales records</p>
                </div>
              </div>
              <button onClick={closeSalesImportModal} className="text-slate-400 hover:text-white transition-colors p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 md:p-6 space-y-5">
              <div className="p-4 bg-sky-50 rounded-xl border border-sky-100">
                <p className="text-xs font-bold text-sky-800 uppercase tracking-wider mb-2">Required Column Headers</p>
                <div className="flex flex-wrap gap-1.5">
                  {['equipment_name', 'quantity_sold', 'sale_price', 'sale_date'].map(col => (
                    <code key={col} className="text-[11px] bg-sky-100 text-sky-700 px-2 py-0.5 rounded-md font-mono font-semibold">{col}</code>
                  ))}
                </div>
                <p className="text-[10px] text-sky-600 mt-2 font-medium">
                  <code className="font-mono">equipment_name</code> must match existing inventory items.<br />
                  <code className="font-mono">sale_date</code> format: YYYY-MM-DD HH:MM:SS or YYYY-MM-DD
                </p>
              </div>

              {!salesImportResult ? (
                <form onSubmit={handleImportSalesExcel} className="space-y-4">
                  <label
                    htmlFor="sales-excel-upload"
                    className={`flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${salesImportFile
                      ? 'border-cricket-grass bg-emerald-50'
                      : 'border-slate-300 bg-slate-50 hover:border-cricket-grass hover:bg-emerald-50/40'
                      }`}
                  >
                    {salesImportFile ? (
                      <>
                        <FileSpreadsheet className="w-8 h-8 text-cricket-grass mb-2" />
                        <p className="text-sm font-bold text-cricket-grass">{salesImportFile.name}</p>
                        <p className="text-[10px] text-slate-500 mt-1">
                          {(salesImportFile.size / 1024).toFixed(1)} KB — click to change
                        </p>
                      </>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-slate-400 mb-2" />
                        <p className="text-sm font-semibold text-slate-600">Click to upload or drag & drop</p>
                        <p className="text-[10px] text-slate-400 mt-1">.xlsx or .xls files only</p>
                      </>
                    )}
                    <input
                      id="sales-excel-upload"
                      type="file"
                      accept=".xlsx,.xls"
                      className="hidden"
                      onChange={(e) => setSalesImportFile(e.target.files?.[0] || null)}
                    />
                  </label>

                  <div className="flex gap-2 justify-end pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={closeSalesImportModal}
                      className="px-4 py-2 border border-cricket-border rounded-xl text-slate-600 hover:bg-slate-50 text-xs font-bold transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!salesImportFile || salesImportLoading}
                      className="flex items-center gap-2 px-5 py-2 bg-cricket-grass hover:bg-cricket-forest text-white rounded-xl text-xs font-bold shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {salesImportLoading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          Import File
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                      <p className="text-2xl font-black text-emerald-700">{salesImportResult.imported_count}</p>
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mt-0.5">Sales Records Added</p>
                    </div>
                  </div>

                  {salesImportResult.errors.length > 0 && (
                    <div className="max-h-40 overflow-y-auto space-y-1.5 p-3 bg-rose-50 rounded-xl border border-rose-100">
                      <p className="text-[10px] font-bold text-rose-700 uppercase tracking-wider mb-2">
                        {salesImportResult.errors.length} Row Error(s)
                      </p>
                      {salesImportResult.errors.map((err, i) => (
                        <p key={i} className="text-xs text-rose-700 font-medium">{err}</p>
                      ))}
                    </div>
                  )}

                  {salesImportResult.errors.length === 0 && (
                    <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                      <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <p className="text-xs font-semibold text-emerald-800">All sales records imported successfully!</p>
                    </div>
                  )}

                  <div className="flex gap-2 justify-end pt-1 border-t border-slate-100">
                    <button
                      onClick={() => { setSalesImportFile(null); setSalesImportResult(null); }}
                      className="px-4 py-2 border border-cricket-border rounded-xl text-slate-600 hover:bg-slate-50 text-xs font-bold transition-colors"
                    >
                      Import Another
                    </button>
                    <button
                      onClick={closeSalesImportModal}
                      className="px-5 py-2 bg-cricket-grass hover:bg-cricket-forest text-white rounded-xl text-xs font-bold shadow-md transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}