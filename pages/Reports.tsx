import React from 'react';
import { MOCK_TRANSACTIONS, MOCK_PRODUCTS } from '../services/mockData';
import { Card } from '../components/ui/Card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface ReportsProps {
  tenantId: string;
}

export const Reports: React.FC<ReportsProps> = ({ tenantId }) => {
  const transactions = MOCK_TRANSACTIONS.filter(t => t.tenantId === tenantId);
  
  // Calculate Daily Sales
  const salesByDate = transactions.reduce((acc, tx) => {
      const date = new Date(tx.timestamp).toLocaleDateString();
      acc[date] = (acc[date] || 0) + tx.amount;
      return acc;
  }, {} as Record<string, number>);

  const chartData = Object.keys(salesByDate).map(date => ({
      date, amount: salesByDate[date]
  }));

  // Top Products Logic (Mock logic for now as items aren't fully populated in all mock txs)
  const topProducts = [
      { name: 'Beef Stew', value: 4500 },
      { name: 'Lamb Chops', value: 3200 },
      { name: 'Boerewors', value: 2100 },
      { name: 'Chicken', value: 1500 }
  ];

  const COLORS = ['#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Business Reports</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
                <h3 className="font-bold mb-4">Sales Revenue (Last 7 Days)</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip cursor={{fill: 'transparent'}} />
                            <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            <Card>
                <h3 className="font-bold mb-4">Top Selling Items</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={topProducts}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {topProducts.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center gap-4 mt-2">
                        {topProducts.map((entry, index) => (
                            <div key={index} className="flex items-center gap-1 text-xs">
                                <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[index]}}></div>
                                {entry.name}
                            </div>
                        ))}
                    </div>
                </div>
            </Card>
        </div>
    </div>
  );
};