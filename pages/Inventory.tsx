import React, { useState, useEffect } from 'react';
import { getProducts, addProduct, updateProduct, deleteProduct } from '../services/firestore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Product } from '../types';
import { Search, Plus, AlertTriangle, Edit2, Trash2, Box } from 'lucide-react';
import { useUI } from '../context/UIContext';

interface InventoryProps {
    tenantId: string;
}

export const Inventory: React.FC<InventoryProps> = ({ tenantId }) => {
  const { addToast } = useUI();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [refresh, setRefresh] = useState(0); 
  const [isLoading, setIsLoading] = useState(true);

  const activeTenantId = tenantId;

  const [formData, setFormData] = useState<Partial<Product>>({
      name: '', sku: '', category: '', subcategory: '', price: 0, stockLevel: 0, minStockThreshold: 10, unit: 'unit'
  });

  useEffect(() => {
    const loadProducts = async () => {
      if (!activeTenantId) return;
      setIsLoading(true);
      try {
        const data = await getProducts(activeTenantId);
        setProducts(data);
      } catch (error) {
        console.error("Failed to load products:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadProducts();
  }, [activeTenantId, refresh]);

  const filteredProducts = products.filter(p => 
     (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
     (p.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
     (p.category || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (product: Product) => {
      setEditingProduct(product);
      setFormData(product);
      setShowModal(true);
  };

  const handleDelete = async (productId: string) => {
      if(window.confirm('Are you sure you want to delete this product?')) {
          await deleteProduct(activeTenantId, productId);
          setRefresh(prev => prev + 1);
          addToast('Product removed.', 'success');
      }
  };

  const handleAddNew = () => {
      setEditingProduct(null);
      setFormData({
        name: '', sku: '', category: 'General', subcategory: '', price: 0, stockLevel: 0, minStockThreshold: 10, unit: 'unit', tenantId: activeTenantId
      });
      setShowModal(true);
  };

  const handleSave = async () => {
      if (!activeTenantId) return;
      try {
        if (editingProduct) {
            await updateProduct({ 
                ...editingProduct, 
                ...formData,
                tenantId: activeTenantId 
            } as Product);
        } else {
            await addProduct({ 
                ...formData, 
                cost: 0, 
                id: `product_${Date.now()}`, 
                tenantId: activeTenantId, 
                imageUrl: '' 
            } as Product);
        }
        setShowModal(false);
        setRefresh(prev => prev + 1);
        addToast(editingProduct ? 'Product updated' : 'Product added', 'success');
      } catch (error: any) {
          console.error("Save error:", error);
          alert("Error saving product: " + error.message);
      }
  };

  const getStockStatus = (level: number, threshold: number) => {
      if (level === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' };
      if (level <= threshold) return { label: 'Low Stock', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' };
      return { label: 'In Stock', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' };
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p>Loading catalog...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Inventory</h2>
                <p className="text-sm text-slate-500">Manage stock levels for this business unit.</p>
            </div>
            <div className="flex gap-2">
                <Button onClick={handleAddNew} className="shadow-lg shadow-indigo-500/20">
                    <Plus size={18} className="mr-2" /> Add Product
                </Button>
            </div>
        </div>

        <div className="relative max-w-lg">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
                type="text" 
                placeholder="Search inventory..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm transition-all"
            />
        </div>

        <Card noPadding className="overflow-hidden border-0 shadow-soft">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                        <tr>
                            <th className="px-6 py-4 font-semibold tracking-wider">Product</th>
                            <th className="px-6 py-4 font-semibold tracking-wider">Category</th>
                            <th className="px-6 py-4 text-right font-semibold tracking-wider">Price</th>
                            <th className="px-6 py-4 text-center font-semibold tracking-wider">Stock Level</th>
                            <th className="px-6 py-4 font-semibold tracking-wider">Status</th>
                            <th className="px-6 py-4 text-right font-semibold tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-5 dark:divide-slate-800/50 bg-white dark:bg-slate-900">
                        {filteredProducts.length > 0 ? filteredProducts.map(product => {
                            const status = getStockStatus(product.stockLevel || 0, product.minStockThreshold || 0); 
                            return (
                                <tr key={product.id} className="group hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500">
                                                {(product.name || '').charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">{product.name}</p>
                                                <p className="text-xs text-slate-400 font-mono">{product.sku}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                            {product.category}
                                            {product.subcategory && <span className="opacity-50">/ {product.subcategory}</span>}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white">
                                        R {(product.price || 0).toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="font-mono font-medium">{(product.stockLevel || 0)}</span> 
                                        <span className="text-xs text-slate-400 ml-1">{(product.unit || '')}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${status.color}`}>
                                            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                            {status.label}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEdit(product)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(product.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                    No products found in this business unit.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Card>

        <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingProduct ? "Edit Product" : "Add New Product"} size="md">
            <div className="space-y-6 pt-2">
                <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Product Name</label>
                        <input type="text" className="w-full border border-slate-300 dark:border-slate-700 p-3 rounded-xl dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Sirloin Steak" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">SKU Code</label>
                        <input type="text" className="w-full border border-slate-300 dark:border-slate-700 p-3 rounded-xl dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" value={formData.sku || ''} onChange={e => setFormData({...formData, sku: e.target.value})} placeholder="e.g. BF-001" />
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Category</label>
                        <input type="text" list="categories" className="w-full border border-slate-300 dark:border-slate-700 p-3 rounded-xl dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.category || ''} onChange={e => setFormData({...formData, category: e.target.value})} placeholder="Select or type..." />
                        <datalist id="categories">
                            <option value="Meat" /><option value="Beef" /><option value="Wors" /><option value="Pork" /><option value="Chicken" />
                        </datalist>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Subcategory</label>
                        <input type="text" className="w-full border border-slate-300 dark:border-slate-700 p-3 rounded-xl dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.subcategory || ''} onChange={e => setFormData({...formData, subcategory: e.target.value})} placeholder="Optional" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Price (R)</label>
                        <input type="number" className="w-full border border-slate-300 dark:border-slate-700 p-3 rounded-xl dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none font-bold" value={formData.price || 0} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Unit</label>
                        <select className="w-full border border-slate-300 dark:border-slate-700 p-3 rounded-xl dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.unit || 'unit'} onChange={e => setFormData({...formData, unit: e.target.value as any})}>
                            <option value="unit">Item</option><option value="kg">Kg</option><option value="litre">L</option>
                        </select>
                    </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Stock Level</label>
                        <input type="number" className="w-full border border-slate-200 dark:border-slate-700 p-2 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.stockLevel || 0} onChange={e => setFormData({...formData,stockLevel: Number(e.target.value)})} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Low Stock Alert</label>
                        <div className="flex items-center gap-2">
                             <AlertTriangle size={16} className="text-amber-500" />
                             <input type="number" className="w-full border border-slate-200 dark:border-slate-700 p-2 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.minStockThreshold || 10} onChange={e => setFormData({...formData, minStockThreshold: Number(e.target.value)})} />
                        </div>
                    </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                    <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
                    <Button onClick={handleSave} className="bg-slate-900 text-white">Save Product</Button>
                </div>
            </div>
        </Modal>
    </div>
  );
};
