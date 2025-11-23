
import React, { useState } from 'react';
import { MOCK_PRODUCTS, MOCK_TENANTS, addProduct, updateProduct, deleteProduct } from '../services/mockData';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Product } from '../types';
import { Search, Plus, Filter, Package, AlertTriangle, Edit2, Trash2, Tag } from 'lucide-react';

interface InventoryProps {
    tenantId?: string | null;
}

export const Inventory: React.FC<InventoryProps> = ({ tenantId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [refresh, setRefresh] = useState(0); // Trigger re-render after delete

  // Form State
  const [formData, setFormData] = useState<Partial<Product>>({
      name: '', sku: '', category: '', subcategory: '', price: 0, cost: 0, stockLevel: 0, minStockThreshold: 10, unit: 'unit'
  });

  const products = MOCK_PRODUCTS.filter(p => !tenantId || p.tenantId === tenantId).filter(p => 
     p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
     p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (product: Product) => {
      setEditingProduct(product);
      setFormData(product);
      setShowModal(true);
  };

  const handleDelete = (productId: string) => {
      if(window.confirm('Are you sure you want to delete this product?')) {
          deleteProduct(productId);
          setRefresh(prev => prev + 1);
      }
  };

  const handleAddNew = () => {
      setEditingProduct(null);
      setFormData({
        name: '', sku: '', category: 'General', subcategory: '', price: 0, cost: 0, stockLevel: 0, minStockThreshold: 10, unit: 'unit', tenantId: tenantId || ''
      });
      setShowModal(true);
  };

  const handleSave = () => {
      if (editingProduct) {
          updateProduct({ ...editingProduct, ...formData } as Product);
      } else {
          addProduct({ 
              ...formData, 
              id: `p_${Date.now()}`, 
              tenantId: tenantId!, 
              imageUrl: '' 
          } as Product);
      }
      setShowModal(false);
      setRefresh(prev => prev + 1);
  };

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Inventory Management</h2>
            <div className="flex gap-2">
                <Button variant="outline">Import CSV</Button>
                <Button onClick={handleAddNew}>
                    <Plus size={18} className="mr-2" /> Add Product
                </Button>
            </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-4">
             <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search by name, SKU or Category..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
             </div>
        </div>

        <Card noPadding className="overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                            <th className="px-6 py-3">Product Name</th>
                            <th className="px-6 py-3">SKU</th>
                            <th className="px-6 py-3">Category / Sub</th>
                            <th className="px-6 py-3 text-right">Price</th>
                            <th className="px-6 py-3 text-center">Stock</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {products.map(product => (
                            <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                                    {product.name}
                                </td>
                                <td className="px-6 py-4 text-slate-500">{product.sku}</td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="font-medium text-slate-700 dark:text-slate-300">{product.category}</span>
                                        {product.subcategory && (
                                            <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                <Tag size={10} /> {product.subcategory}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right font-bold">R {product.price.toFixed(2)}</td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex flex-col items-center">
                                        <span>{product.stockLevel} {product.unit}</span>
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
                                <td className="px-6 py-4 text-right flex justify-end gap-2">
                                    <button onClick={() => handleEdit(product)} className="text-slate-400 hover:text-indigo-600">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(product.id)} className="text-slate-400 hover:text-red-600">
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>

        {/* Add/Edit Modal */}
        <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingProduct ? "Edit Product" : "Add New Product"}>
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-sm font-medium">Name</label>
                        <input type="text" className="w-full border p-2 rounded dark:bg-slate-800 dark:border-slate-700" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium">SKU</label>
                        <input type="text" className="w-full border p-2 rounded dark:bg-slate-800 dark:border-slate-700" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-sm font-medium">Category</label>
                        <input type="text" list="categories" className="w-full border p-2 rounded dark:bg-slate-800 dark:border-slate-700" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} placeholder="e.g. Beef" />
                        <datalist id="categories">
                            <option value="Beef" />
                            <option value="Wors" />
                            <option value="Pork" />
                            <option value="Bones" />
                            <option value="Oxtail" />
                            <option value="Head & Hooves" />
                            <option value="Liver & Lungs" />
                            <option value="Layers Chicken" />
                            <option value="Offals" />
                        </datalist>
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium">Subcategory</label>
                        <input type="text" className="w-full border p-2 rounded dark:bg-slate-800 dark:border-slate-700" value={formData.subcategory || ''} onChange={e => setFormData({...formData, subcategory: e.target.value})} placeholder="e.g. Stewing Meat" />
                    </div>
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-medium">Unit Type</label>
                    <select className="w-full border p-2 rounded dark:bg-slate-800 dark:border-slate-700" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value as any})}>
                        <option value="unit">Unit (Item)</option>
                        <option value="kg">Kilogram (kg)</option>
                        <option value="litre">Litre (L)</option>
                    </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-sm font-medium">Cost Price (R)</label>
                        <input type="number" className="w-full border p-2 rounded dark:bg-slate-800 dark:border-slate-700" value={formData.cost} onChange={e => setFormData({...formData, cost: Number(e.target.value)})} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium">Selling Price (R)</label>
                        <input type="number" className="w-full border p-2 rounded dark:bg-slate-800 dark:border-slate-700" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-sm font-medium">Current Stock</label>
                        <input type="number" className="w-full border p-2 rounded dark:bg-slate-800 dark:border-slate-700" value={formData.stockLevel} onChange={e => setFormData({...formData, stockLevel: Number(e.target.value)})} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium">Alert Threshold</label>
                        <input type="number" className="w-full border p-2 rounded dark:bg-slate-800 dark:border-slate-700" value={formData.minStockThreshold} onChange={e => setFormData({...formData, minStockThreshold: Number(e.target.value)})} />
                    </div>
                </div>
                <div className="pt-4 flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
                    <Button onClick={handleSave}>Save Product</Button>
                </div>
            </div>
        </Modal>
    </div>
  );
};
