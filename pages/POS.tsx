import React, { useState } from 'react';
import { MOCK_PRODUCTS, MOCK_TENANTS } from '../services/mockData';
import { Product } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Search, Plus, Minus, CreditCard, Banknote, UserPlus, ShoppingCart, ArrowLeft } from 'lucide-react';

interface POSProps {
  tenantId?: string | null;
  onBack?: () => void;
}

export const POS: React.FC<POSProps> = ({ tenantId, onBack }) => {
  const [cart, setCart] = useState<{ product: Product; qty: number }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'CARD' | 'CREDIT' | null>(null);

  // Filter products by tenant context
  const tenantProducts = tenantId 
    ? MOCK_PRODUCTS.filter(p => p.tenantId === tenantId)
    : MOCK_PRODUCTS;

  // Derive categories from filtered products
  const allCategories = Array.from(new Set(tenantProducts.map(p => p.category)));
  const categories = ['All', ...allCategories];

  const filteredProducts = tenantProducts.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const tenantName = tenantId ? MOCK_TENANTS.find(t => t.id === tenantId)?.name : 'Global POS';

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { product, qty: 1 }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQty = Math.max(0, item.qty + delta);
        return { ...item, qty: newQty };
      }
      return item;
    }).filter(item => item.qty > 0));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.qty), 0);
  const tax = subtotal * 0.15; // 15% VAT
  const total = subtotal + tax;

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)] animate-fade-in">
      {/* Product Grid (Left) */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="mb-4 space-y-4">
          <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                 {onBack && (
                     <button onClick={onBack} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full mr-2">
                         <ArrowLeft size={20} />
                     </button>
                 )}
                 {tenantName} 
                 <span className="text-sm font-normal text-slate-400">POS Terminal</span>
              </h2>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat 
                    ? 'bg-slate-900 text-white dark:bg-indigo-600' 
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
             <input
               type="text"
               placeholder="Scan barcode or search products..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 dark:text-white rounded-xl shadow-sm border-none focus:ring-2 focus:ring-indigo-500 outline-none"
             />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-20 lg:pb-0">
          {filteredProducts.map(product => (
            <div 
              key={product.id} 
              onClick={() => addToCart(product)}
              className="bg-white dark:bg-slate-900 p-3 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 cursor-pointer hover:shadow-md transition-shadow flex flex-col h-full group"
            >
              <div className="aspect-square bg-slate-100 dark:bg-slate-800 rounded-lg mb-3 overflow-hidden relative">
                {product.imageUrl ? (
                   <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                   <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">No Image</div>
                )}
                <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm">
                  {product.stockLevel}
                </div>
              </div>
              <h4 className="font-medium text-sm text-slate-900 dark:text-white line-clamp-2">{product.name}</h4>
              <div className="mt-auto pt-2 flex justify-between items-center">
                <span className="font-bold text-slate-900 dark:text-white">R {product.price.toFixed(2)}</span>
                <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-indigo-100 hover:text-indigo-600">
                  <Plus size={14} />
                </div>
              </div>
            </div>
          ))}
          {filteredProducts.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center text-slate-400 py-10">
                  <ShoppingCart size={48} className="opacity-20 mb-2" />
                  <p>No products found.</p>
              </div>
          )}
        </div>
      </div>

      {/* Cart (Right) */}
      <Card className="w-full lg:w-96 flex flex-col h-full sticky top-0 bg-white dark:bg-slate-900" noPadding>
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h3 className="font-bold text-lg dark:text-white">Current Sale</h3>
          <button className="text-red-500 text-xs font-medium hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1 rounded" onClick={() => setCart([])}>Clear All</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
              <ShoppingCart size={48} className="opacity-20" />
              <p className="text-sm">Cart is empty</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.product.id} className="flex gap-3">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-lg flex-shrink-0 overflow-hidden">
                   {item.product.imageUrl && <img src={item.product.imageUrl} className="w-full h-full object-cover"/>}
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="font-medium text-sm truncate dark:text-white">{item.product.name}</h5>
                  <p className="text-xs text-slate-500">R {item.product.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                   <button onClick={() => updateQty(item.product.id, -1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded dark:text-slate-300"><Minus size={14} /></button>
                   <span className="text-sm font-medium w-4 text-center dark:text-white">{item.qty}</span>
                   <button onClick={() => updateQty(item.product.id, 1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded dark:text-slate-300"><Plus size={14} /></button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
           <div className="space-y-2 mb-4">
             <div className="flex justify-between text-sm text-slate-500">
               <span>Subtotal</span>
               <span>R {subtotal.toFixed(2)}</span>
             </div>
             <div className="flex justify-between text-sm text-slate-500">
               <span>VAT (15%)</span>
               <span>R {tax.toFixed(2)}</span>
             </div>
             <div className="flex justify-between text-lg font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
               <span>Total</span>
               <span>R {total.toFixed(2)}</span>
             </div>
           </div>

           <div className="grid grid-cols-3 gap-2 mb-4">
             <button onClick={() => setPaymentMode('CASH')} className={`flex flex-col items-center justify-center py-2 rounded-lg border transition-colors ${paymentMode === 'CASH' ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}>
                <Banknote size={20} className="mb-1" />
                <span className="text-[10px] font-medium">Cash</span>
             </button>
             <button onClick={() => setPaymentMode('CARD')} className={`flex flex-col items-center justify-center py-2 rounded-lg border transition-colors ${paymentMode === 'CARD' ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}>
                <CreditCard size={20} className="mb-1" />
                <span className="text-[10px] font-medium">Card</span>
             </button>
             <button onClick={() => setPaymentMode('CREDIT')} className={`flex flex-col items-center justify-center py-2 rounded-lg border transition-colors ${paymentMode === 'CREDIT' ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}>
                <UserPlus size={20} className="mb-1" />
                <span className="text-[10px] font-medium">Credit</span>
             </button>
           </div>
           
           <Button className="w-full h-12 text-lg" disabled={cart.length === 0 || !paymentMode}>
             Finalize Sale
           </Button>
        </div>
      </Card>
    </div>
  );
};