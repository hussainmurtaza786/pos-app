import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { formatCurrency } from '../../helper';
import { FiFileText } from 'react-icons/fi';
import { BiDownload, BiTrendingUp } from 'react-icons/bi';

interface ReportData {
    monthlySales: Array<{ month: string; sales: number; profit: number; returns: number }>;
    categoryPerformance: Array<{ name: string; value: number }>;
    dailySales: Array<{ date: string; sales: number; profit: number; returns: number }>;
    returnSummary: {
        totalReturns: number;
        returnRate: number;
        netSales: number;
        netProfit: number;
        returnTransactions: number;
    };
}

export const Reports: React.FC = () => {
    const [reportData, setReportData] = useState<ReportData>({
        monthlySales: [],
        categoryPerformance: [],
        dailySales: [],
        returnSummary: {
            totalReturns: 0,
            returnRate: 0,
            netSales: 0,
            netProfit: 0,
            returnTransactions: 0,
        },
    });
    const [timeframe, setTimeframe] = useState('this-month');
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        fetchReportData();
    }, [timeframe]);

    const fetchReportData = async () => {
        setLoading(true);
        try {
            // Supabase logic commented
            // const { data: { user } } = await supabase.auth.getUser();
            // if (!user) return;

            // const { data: salesData } = await supabase
            //   .from('sales')
            //   .select(`*, sale_items(*, products(*, categories(name)))`)
            //   .eq('user_id', user.id)
            //   .eq('status', 'completed');

            // const { data: returnsData } = await supabase
            //   .from('returns')
            //   .select('*')
            //   .eq('user_id', user.id);

            // Replace with Prisma fetch logic...

            // Temporary dummy data for fallback
            const salesData: any[] = []; // Fetch from Prisma
            const returnsData: any[] = []; // Fetch from Prisma

            const monthlyMap = new Map();
            const returnsByMonth = new Map();

            salesData.forEach(sale => {
                const month = new Date(sale.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                });

                if (!monthlyMap.has(month)) monthlyMap.set(month, { sales: 0, profit: 0 });

                const current = monthlyMap.get(month);
                monthlyMap.set(month, {
                    sales: current.sales + sale.total_amount,
                    profit: current.profit + sale.total_profit,
                });
            });

            returnsData.forEach(ret => {
                const month = new Date(ret.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                });
                returnsByMonth.set(month, (returnsByMonth.get(month) || 0) + ret.total_refund);
            });

            const monthlySales = Array.from(monthlyMap.entries()).map(([month, data]) => ({
                month,
                sales: data.sales,
                profit: data.profit,
                returns: returnsByMonth.get(month) || 0,
            }));

            const categoryMap = new Map();
            salesData.forEach(sale => {
                sale.sale_items.forEach(item => {
                    const categoryName = item.products?.categories?.name;
                    const revenue = item.total_price;
                    if (categoryName) {
                        categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + revenue);
                    }
                });
            });

            const categoryPerformance = Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }));

            const dailyMap = new Map();
            const dailyReturnsMap = new Map();
            const last30Days = Array.from({ length: 30 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - i);
                return date.toISOString().split('T')[0];
            }).reverse();

            last30Days.forEach(date => {
                dailyMap.set(date, { sales: 0, profit: 0 });
                dailyReturnsMap.set(date, 0);
            });

            salesData.forEach(sale => {
                const date = sale.created_at.split('T')[0];
                if (dailyMap.has(date)) {
                    const current = dailyMap.get(date);
                    dailyMap.set(date, {
                        sales: current.sales + sale.total_amount,
                        profit: current.profit + sale.total_profit,
                    });
                }
            });

            returnsData.forEach(ret => {
                const date = ret.created_at.split('T')[0];
                if (dailyReturnsMap.has(date)) {
                    dailyReturnsMap.set(date, dailyReturnsMap.get(date) + ret.total_refund);
                }
            });

            const dailySales = Array.from(dailyMap.entries()).map(([date, data]) => ({
                date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                sales: data.sales,
                profit: data.profit,
                returns: dailyReturnsMap.get(date) || 0,
            }));

            const totalSales = salesData.reduce((sum, sale) => sum + sale.total_amount, 0);
            const totalProfit = salesData.reduce((sum, sale) => sum + sale.total_profit, 0);
            const totalReturns = returnsData.reduce((sum, ret) => sum + ret.total_refund, 0);
            const returnRate = totalSales > 0 ? (totalReturns / totalSales) * 100 : 0;
            const totalReturnProfit = returnsData.reduce((sum, ret) => sum + (ret.total_profit || 0), 0);

            setReportData({
                monthlySales,
                categoryPerformance,
                dailySales,
                returnSummary: {
                    totalReturns,
                    returnRate,
                    netSales: totalSales - totalReturns,
                    netProfit: totalProfit - totalReturnProfit,
                    returnTransactions: returnsData.length,
                },
            });
        } catch (error) {
            console.error('Error fetching report data:', error);
            // Optional: alert('Failed to fetch report data');
        } finally {
            setLoading(false);
        }
    };

    const generatePDF = async () => {
        setGenerating(true);
        try {
            const pdf = new jsPDF('p', 'mm', 'a4');
            pdf.setFontSize(20);
            pdf.text('Sales Report', 20, 20);
            pdf.setFontSize(12);
            pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
            const { returnSummary } = reportData;
            let yPosition = 50;
            pdf.setFontSize(16);
            pdf.text('Report Summary (Net of Returns)', 20, yPosition);
            yPosition += 15;
            pdf.setFontSize(12);
            pdf.text(`Net Sales: ${formatCurrency(returnSummary.netSales)}`, 20, yPosition);
            yPosition += 10;
            pdf.text(`Net Profit: ${formatCurrency(returnSummary.netProfit)}`, 20, yPosition);
            yPosition += 10;
            pdf.text(`Total Returns: ${formatCurrency(returnSummary.totalReturns)}`, 20, yPosition);
            yPosition += 10;
            pdf.text(`Return Rate: ${returnSummary.returnRate.toFixed(2)}%`, 20, yPosition);
            yPosition += 10;
            pdf.text(`Return Transactions: ${returnSummary.returnTransactions}`, 20, yPosition);
            const chartsContainer = document.getElementById('charts-container');
            if (chartsContainer) {
                const canvas = await html2canvas(chartsContainer, { scale: 1, useCORS: true, allowTaint: true });
                const imgData = canvas.toDataURL('image/png');
                const imgWidth = 170;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                yPosition += 20;
                if (yPosition + imgHeight > 280) {
                    pdf.addPage();
                    yPosition = 20;
                }
                pdf.addImage(imgData, 'PNG', 20, yPosition, imgWidth, imgHeight);
            }
            pdf.save(`sales-report-${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
        } finally {
            setGenerating(false);
        }
    };

    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316'];

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Sales Reports</h1>
                    <p className="text-gray-600">Analyze your sales performance and generate reports (net of returns)</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:space-x-3 w-full lg:w-auto">
                    <select
                        value={timeframe}
                        onChange={(e) => setTimeframe(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm lg:text-base"
                    >
                        <option value="this-month">This Month</option>
                        <option value="last-month">Last Month</option>
                        <option value="this-year">This Year</option>
                    </select>
                    <button
                        onClick={() => fetchReportData()}
                        className="flex items-center justify-center px-3 lg:px-4 py-2 bg-blue-600 text-white text-sm lg:text-base rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <FiFileText className="h-4 w-4 mr-2" />
                        Generate Report
                    </button>
                    <button
                        onClick={generatePDF}
                        disabled={generating}
                        className="flex items-center justify-center px-3 lg:px-4 py-2 bg-green-600 text-white text-sm lg:text-base rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <BiDownload className="h-4 w-4 mr-2" />
                        {generating ? 'Generating...' : 'Export PDF'}
                    </button>
                </div>
            </div>

            {/* Returns Impact Alert */}
            {reportData.returnSummary.totalReturns > 0 && (
                <div className="bg-red-50 border border-red-200 p-4 lg:p-6 rounded-xl">
                    <div className="flex items-start">
                        <BiTrendingUp className="h-6 w-6 text-red-600 mt-0.5 mr-3" />
                        <div className="flex-1">
                            <h3 className="text-base lg:text-lg font-semibold text-red-800 mb-2">Returns Impact on Reports</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="text-center">
                                    <p className="text-xl lg:text-2xl font-bold text-red-600">
                                        {formatCurrency(reportData.returnSummary.totalReturns)}
                                    </p>
                                    <p className="text-sm text-red-700">Total Returns</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xl lg:text-2xl font-bold text-red-600">
                                        {reportData.returnSummary.returnRate.toFixed(1)}%
                                    </p>
                                    <p className="text-sm text-red-700">Return Rate</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xl lg:text-2xl font-bold text-green-600">
                                        {formatCurrency(reportData.returnSummary.netSales)}
                                    </p>
                                    <p className="text-sm text-red-700">Net Sales</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div id="charts-container" className="space-y-6">
                {/* Monthly Sales Trend */}
                <div className="bg-white p-4 lg:p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-4">Monthly Sales Trend (Net of Returns)</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={reportData.monthlySales}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis tickFormatter={(value) => `Rs ${value.toLocaleString()}`} />
                            <Tooltip
                                formatter={(value, name) => [formatCurrency(Number(value)), name]}
                                labelFormatter={(label) => `Month: ${label}`}
                            />
                            <Bar dataKey="sales" name="Net Sales" fill="#3B82F6" />
                            <Bar dataKey="profit" name="Net Profit" fill="#10B981" />
                            <Bar dataKey="returns" name="Returns" fill="#EF4444" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Category Performance */}
                    <div className="bg-white p-4 lg:p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-4">Category Performance (Net of Returns)</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={reportData.categoryPerformance}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                    label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {reportData.categoryPerformance.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="mt-4 flex flex-wrap gap-2">
                            {reportData.categoryPerformance.map((item, index) => (
                                <div key={item.name} className="flex items-center text-sm">
                                    <div
                                        className="w-3 h-3 rounded mr-2"
                                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                    ></div>
                                    <span>{item.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Return Analysis */}
                    <div className="bg-white p-4 lg:p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-4">Return Analysis</h3>
                        <div className="space-y-6">
                            <div className="text-center">
                                <p className="text-3xl lg:text-4xl font-bold text-red-600">
                                    {reportData.returnSummary.returnRate.toFixed(1)}%
                                </p>
                                <p className="text-gray-600">Overall Return Rate</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div>
                                    <p className="text-xl lg:text-2xl font-bold text-red-600">
                                        {formatCurrency(reportData.returnSummary.totalReturns)}
                                    </p>
                                    <p className="text-sm text-gray-600">Total Returns</p>
                                </div>
                                <div>
                                    <p className="text-xl lg:text-2xl font-bold text-blue-600">
                                        {reportData.returnSummary.returnTransactions}
                                    </p>
                                    <p className="text-sm text-gray-600">Return Transactions</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Daily Sales Revenue */}
                <div className="bg-white p-4 lg:p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-4">Daily Sales Revenue (Net of Returns)</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={reportData.dailySales}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis tickFormatter={(value) => `Rs ${value.toLocaleString()}`} />
                            <Tooltip
                                formatter={(value, name) => [formatCurrency(Number(value)), name]}
                                labelFormatter={(label) => `Date: ${label}`}
                            />
                            <Line type="monotone" dataKey="sales" name="Daily Net Sales" stroke="#3B82F6" strokeWidth={2} />
                            <Line type="monotone" dataKey="profit" name="Daily Net Profit" stroke="#10B981" strokeWidth={2} />
                            <Line type="monotone" dataKey="returns" name="Daily Returns" stroke="#EF4444" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Report Summary */}
                <div className="bg-white p-4 lg:p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-4">Report Summary (Net of Returns)</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
                        <div className="text-center">
                            <p className="text-xl lg:text-2xl font-bold text-blue-600">
                                {formatCurrency(reportData.returnSummary.netSales)}
                            </p>
                            <p className="text-sm text-gray-600">Net Sales</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xl lg:text-2xl font-bold text-green-600">
                                {formatCurrency(reportData.returnSummary.netProfit)}
                            </p>
                            <p className="text-sm text-gray-600">Net Profit</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xl lg:text-2xl font-bold text-red-600">
                                {formatCurrency(reportData.returnSummary.totalReturns)}
                            </p>
                            <p className="text-sm text-gray-600">Total Returns</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xl lg:text-2xl font-bold text-purple-600">
                                {reportData.monthlySales.filter(m => m.sales > 0).length}
                            </p>
                            <p className="text-sm text-gray-600">Days with Sales</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xl lg:text-2xl font-bold text-orange-600">
                                {formatCurrency(reportData.returnSummary.netSales / Math.max(1, reportData.monthlySales.filter(m => m.sales > 0).length))}
                            </p>
                            <p className="text-sm text-gray-600">Avg Daily Net Sales</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};