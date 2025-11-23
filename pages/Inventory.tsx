import React, { useState } from 'react';
import { MOCK_PRODUCTS, MOCK_TENANTS } from '../services/mockData';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Search, Plus, Filter, Package, AlertTriangle } from 'lucide-react';

interface InventoryProps {
    tenantId?: string | null;
}

export const Inventory: React.FC<InventoryProps> = ({ tenantId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter products by tenant if provided, otherwise show all (Super Admin view)
  const products = MOCK_PRODUCTS.filter(p => !tenantId || p.tenantId === tenantId).filter(p => 
     p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const tenantName = tenantId ? MOCK_TENANTS.find(t => t.id === tenantId)?.name : 'All Businesses';

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Inventory Management</h2>
                <p className="text-slate-500 text-sm">Managing stock for: <span className="font-semibold text-indigo-600">{tenantName}</span></p>
            </div>
            <div className="flex gap-2">
                <Button variant="outline">Import CSV</Button>
                <Button>
                    <Plus size={18} className="mr-2" /> Add Product
                </Button>
            </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-4">
             <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search by name or SKU..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
             </div>
             <Button variant="outline" className="flex items-center gap-2">
                 <Filter size={18} /> Filters
             </Button>
        </div>

        <Card noPadding className="overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                            <th className="px-6 py-3">Product</th>
                            <th className="px-6 py-3">SKU</th>
                            <th className="px-6 py-3">Category</th>
                            <th className="px-6 py-3 text-right">Cost</th>
                            <th className="px-6 py-3 text-right">Price</th>
                            <th className="px-6 py-3 text-center">Stock</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {products.length > 0 ? (
                            products.map(product => (
                                <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white flex items-center gap-3">
                                        <div className="w-10 h-10 rounded bg-slate-100 dark:bg-slate-800 flex-shrink-0 overflow-hidden">
                                            {product.imageUrl ? <img src={product.imageUrl} className="w-full h-full object-cover"/> : <Package className="m-2 text-slate-400"/>}
                                        </div>
                                        {product.name}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">{product.sku}</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300">
                                            {product.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">R {product.cost.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-right font-bold">R {product.price.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex flex-col items-center">
                                            <span>{product.stockLevel}</span>
                                            {product.stockLevel <= product.minStockThreshold && (
                                                <span className="text-[10px] text-red-500 flex items-center gap-1 mt-0.5"><AlertTriangle size={10}/> Low</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                            product.stockLevel > 0 
                                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' 
                                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                        }`}>
                                            {product.stockLevel > 0 ? 'In Stock' : 'Out of Stock'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Button variant="ghost" size="sm">Edit</Button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                                    No products found for this criteria.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    </div>
  );
};