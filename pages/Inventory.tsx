
import React, { useState, useEffect } from 'react';
import { getProducts, addProduct, updateProduct, deleteProduct, seedInalaFragrances } from '../services/firestore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Product, UserRole } from '../types';
import { Search, Plus, Edit2, Trash2, RotateCw, RefreshCw, Sparkles, Box } from 'lucide-react';
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
  const [isSyncing, setIsSyncing] = useState(false);

  const [formData, setFormData] = useState<Partial<Product>>({
      name: '', sku: '', category: 'General', price: 0, stockLevel: 0, minStockThreshold: 1, unit: 'unit', isActive: true
  });

  useEffect(() => {
    const loadProducts = async () => {
      if (!tenantId) return;
      setIsLoading(true);
      try {
        const data = await getProducts(tenantId);
        setProducts(data);
      } catch (error) {
        console.error("Failed to load products:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadProducts();
  }, [tenantId, refresh]);

  const handleSyncMaster = async () => {
      setIsSyncing(true);
      try {
          await seedInalaFragrances(tenantId);
          setRefresh(prev => prev + 1);
          addToast('Master catalog synced.', 'success');
      } catch (err) {
          addToast('Sync failed.', 'error');
      } finally {
          setIsSyncing(false);
      }
  };

  const filteredProducts = products.filter(p => 
     (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
     (p.sku || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (product: Product) => {
      setEditingProduct(product);
      setFormData({ 
          ...product,
          price: Number(product.price || 0),
          stockLevel: Number(product.stockLevel || 0)
      });
      setShowModal(true);
  };

  const handleDelete = async (productId: string) => {
      if(window.confirm('Purge this record from the organizational ledger?')) {
          await deleteProduct(tenantId, productId);
          setRefresh(prev => prev + 1);
          addToast('Item purged.', 'success');
      }
  };

  const handleSave = async () => {
      if (!tenantId || !formData.name) return;
      try {
        const payload = {
            ...formData,
            price: Number(formData.price || 0),
            stockLevel: Number(formData.stockLevel || 0),
            cost: Number(formData.cost || (Number(formData.price) * 0.7)),
            tenantId
        } as Product;

        if (editingProduct) {
            // Write to the captured AUTHORITATIVE path
            await updateProduct({ ...editingProduct, ...payload });
        } else {
            await addProduct({ ...payload, id: `p_${Date.now()}` });
        }
        
        setShowModal(false);
        setRefresh(prev => prev + 1);
        addToast('Authoritative ledger updated.', 'success');
      } catch (error: any) {
          addToast(`Ledger update failed: ${error.message}`, 'error');
      }
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400">
          <RefreshCw size={32} className="animate-spin text-indigo-500 mb-4" />
          <p className="font-bold">Syncing Organizational Ledger...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Organizational Inventory</h2>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Direct Master Ledger Control</p>
            </div>
            <div className="flex gap-2">
                {products.length === 0 && (
                    <Button onClick={handleSyncMaster} isLoading={isSyncing} variant="outline" className="bg-white border-indigo-200 text-indigo-600 font-bold rounded-xl h-11">
                        <Sparkles size={16} className="mr-2"/> Initialize Catalog
                    </Button>
                )}
                <Button onClick={() => { setEditingProduct(null); setFormData({name:'', sku:'', category:'General', price:0, stockLevel:0, minStockThreshold:1, unit:'unit', isActive: true}); setShowModal(true); }} className="bg-slate-900 text-white font-black h-11 shadow-lg rounded-xl uppercase text-xs tracking-widest">
                    <Plus size={18} className="mr-2" /> Add Item
                </Button>
            </div>
        </div>

        <div className="relative max-w-lg">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
                type="text" 
                placeholder="Find in master catalog..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm transition-all font-bold"
            />
        </div>

        <Card noPadding className="overflow-hidden border-0 shadow-xl rounded-3xl">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-[10px] text-slate-400 uppercase bg-slate-50/50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800 tracking-widest font-black">
                        <tr>
                            <th className="px-6 py-5">Authoritative Details</th>
                            <th className="px-6 py-5">Classification</th>
                            <th className="px-6 py-5 text-right">Master Price</th>
                            <th className="px-6 py-5 text-center">Available Stock</th>
                            <th className="px-6 py-5 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                        {filteredProducts.map((product: any) => (
                            <tr key={product.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-indigo-500 text-xl uppercase shadow-inner">
                                            {(product.name || 'P').charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none mb-1">{product.name}</p>
                                            <p className="text-[10px] text-slate-400 font-mono font-bold">{product.sku}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                        {product.category || 'General'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <p className="font-black text-slate-900 dark:text-white text-lg">R {(product.price || 0).toFixed(2)}</p>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex flex-col items-center">
                                        <span className={`text-lg font-black ${product.stockLevel > (product.minStockThreshold || 2) ? 'text-indigo-600' : 'text-red-500'}`}>{(product.stockLevel || 0)}</span> 
                                        <span className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">{(product.unit || 'unit')}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => handleEdit(product)} className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 rounded-xl transition-all shadow-sm">
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(product.id)} className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/40 rounded-xl transition-all shadow-sm">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredProducts.length === 0 && (
                            <tr><td colSpan={5} className="px-6 py-20 text-center text-slate-400 uppercase font-black tracking-widest text-xs opacity-50">Master Ledger Empty</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Card>

        <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingProduct ? "Modify Ledger Entry" : "Register Catalog Item"} size="md">
            <div className="space-y-6 pt-2">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Legal Product Name</label>
                        <input type="text" className="w-full bg-slate-50 dark:bg-slate-800 border-none p-4 rounded-2xl dark:text-white focus:ring-2 focus:ring-indigo-500 font-bold outline-none shadow-inner" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">SKU / ID</label>
                        <input type="text" className="w-full bg-slate-50 dark:bg-slate-800 border-none p-4 rounded-2xl dark:text-white focus:ring-2 focus:ring-indigo-500 font-mono outline-none shadow-inner uppercase" value={formData.sku || ''} onChange={e => setFormData({...formData, sku: e.target.value})} />
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Retail Price (R)</label>
                        <input type="number" step="0.01" className="w-full bg-slate-50 dark:bg-slate-800 border-none p-4 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-black text-emerald-600 text-2xl outline-none shadow-inner" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Stock Units</label>
                        <input type="number" className="w-full bg-slate-50 dark:bg-slate-800 border-none p-4 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-black text-indigo-600 text-2xl outline-none shadow-inner" value={formData.stockLevel} onChange={e => setFormData({...formData, stockLevel: Number(e.target.value)})} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Measure</label>
                        <select className="w-full bg-slate-50 dark:bg-slate-800 border-none p-4 rounded-2xl dark:text-white focus:ring-2 focus:ring-indigo-500 font-black outline-none shadow-inner" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value as any})}>
                            <option value="unit">Individual Unit</option>
                            <option value="kg">Kilograms (kg)</option>
                            <option value="box">Bulk Box</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">System Status</label>
                        <select className="w-full bg-slate-50 dark:bg-slate-800 border-none p-4 rounded-2xl dark:text-white focus:ring-2 focus:ring-indigo-500 font-black outline-none shadow-inner" value={formData.isActive ? 'true' : 'false'} onChange={e => setFormData({...formData, isActive: e.target.value === 'true'})}>
                            <option value="true">Active / Sellable</option>
                            <option value="false">Archived / Hidden</option>
                        </select>
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                    <Button onClick={handleSave} className="w-full bg-slate-900 text-white font-black h-14 rounded-2xl shadow-2xl active:scale-95 transition-all text-xs uppercase tracking-widest">
                        Commit Authoritative Changes
                    </Button>
                </div>
            </div>
        </Modal>
    </div>
  );
};
