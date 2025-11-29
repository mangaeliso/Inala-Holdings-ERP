import React, { useState, useEffect } from 'react';
import { getProducts, getTenants, getCustomers, addTransaction, addCustomer } from '../services/firestore';
import { Product, PaymentMethod, TransactionType, Customer, Tenant } from '../types';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { 
  Search, Plus, Minus, CreditCard, Banknote, Smartphone, 
  UserPlus, ShoppingCart, Trash2, CheckCircle, Printer, X, 
  ChevronRight, Delete, User, Sparkles
} from 'lucide-react';

interface POSProps {
  tenantId?: string | null;
  onBack?: () => void;
}

export const POS: React.FC<POSProps> = ({ tenantId, onBack }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [tenant, setTenant] = useState<Tenant | null>(null);

  const [cart, setCart] = useState<{ product: Product; qty: number }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [paymentMode, setPaymentMode] = useState<PaymentMethod | null>(null);
  
  // Modals
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showQtyModal, setShowQtyModal] = useState(false);
  const [selectedProductForQty, setSelectedProductForQty] = useState<Product | null>(null);
  const [inputQty, setInputQty] = useState('');

  const [lastTransactionId, setLastTransactionId] = useState<string | null>(null);

  // Customer State for Credit
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');

  useEffect(() => {
    const loadData = async () => {
        if (tenantId) {
            const p = await getProducts(tenantId);
            setProducts(p);
            const c = await getCustomers(tenantId);
            setCustomers(c);
            const tList = await getTenants();
            setTenant(tList.find(t => t.id === tenantId) || null);
        } else {
             const p = await getProducts();
             setProducts(p);
        }
    };
    loadData();
  }, [tenantId]);

  // Derive categories
  const allCategories = Array.from(new Set(products.map(p => p.category)));
  const categories = ['All', ...allCategories];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleProductClick = (product: Product) => {
      setSelectedProductForQty(product);
      setInputQty('');
      setShowQtyModal(true);
  };

  const handleNumpadInput = (val: string) => {
    if (val === 'backspace') {
      setInputQty(prev => prev.slice(0, -1));
    } else if (val === '.') {
      if (!inputQty.includes('.')) setInputQty(prev => prev + '.');
    } else {
      setInputQty(prev => prev + val);
    }
  };

  const confirmAddToCart = () => {
    if (!selectedProductForQty) return;
    
    // Default to 1 if empty
    const qtyVal = inputQty === '' ? 1 : parseFloat(inputQty);
    
    if (qtyVal <= 0) return;

    setCart(prev => {
      const existing = prev.find(item => item.product.id === selectedProductForQty.id);
      if (existing) {
        return prev.map(item => item.product.id === selectedProductForQty.id ? { ...item, qty: item.qty + qtyVal } : item);
      }
      return [...prev, { product: selectedProductForQty, qty: qtyVal }];
    });

    setShowQtyModal(false);
    setSelectedProductForQty(null);
    setInputQty('');
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

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
      setPaymentMode(method);
      // Auto-focus search if credit is selected and no customer is assigned
      if (method === PaymentMethod.CREDIT && !selectedCustomer) {
          setCustomerSearch('');
      }
  };

  const handlePayment = () => {
    if (!paymentMode) return;
    
    if (paymentMode === PaymentMethod.CREDIT && !selectedCustomer) {
        // Should not happen if button is disabled, but safety check
        return;
    }
    
    processTransaction();
  };

  const processTransaction = async () => {
    const txId = `tx_${Date.now()}`;
    await addTransaction({
        id: txId,
        tenantId: tenantId || 'global',
        branchId: 'b_001', // mock
        customerId: selectedCustomer?.id || 'walk_in',
        customerName: selectedCustomer?.name || 'Walk-in Customer',
        type: TransactionType.SALE,
        amount: total,
        currency: tenant?.currency || 'ZAR',
        method: paymentMode!,
        status: 'COMPLETED',
        timestamp: new Date().toISOString(),
        reference: `INV-${Math.floor(Math.random() * 10000)}`,
        items: cart.map(item => ({
            productId: item.product.id,
            name: item.product.name,
            qty: item.qty,
            price: item.product.price,
            subtotal: item.product.price * item.qty
        }))
    });

    setLastTransactionId(txId);
    setShowCustomerModal(false);
    setShowReceiptModal(true);
    setCart([]);
    setSelectedCustomer(null);
    setPaymentMode(null);
  };

  const handleCreateAndSelectCustomer = async () => {
      if (!customerSearch) return;
      const newId = `c_${Date.now()}`;
      const newCus: Customer = {
          id: newId,
          tenantId: tenantId!,
          name: customerSearch,
          phone: '',
          creditLimit: 1000, 
          currentDebt: 0
      };
      await addCustomer(newCus);
      setCustomers(prev => [...prev, newCus]);
      setSelectedCustomer(newCus);
      
      // If we are in credit mode, keep it selected
      if (paymentMode === null) {
          setPaymentMode(PaymentMethod.CREDIT);
      }
      
      setCustomerSearch('');
      setShowCustomerModal(false);
  };

  const filteredCustomers = customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()));
  const exactMatch = customers.find(c => c.name.toLowerCase() === customerSearch.toLowerCase());

  // Helper for placeholder colors based on product name
  const getPlaceholderColor = (name: string) => {
    const gradients = [
      'from-rose-400 to-orange-300', 
      'from-amber-400 to-yellow-300', 
      'from-emerald-400 to-teal-300', 
      'from-blue-400 to-indigo-300', 
      'from-violet-400 to-fuchsia-300',
      'from-slate-400 to-gray-300'
    ];
    const index = name.length % gradients.length;
    return `bg-gradient-to-br ${gradients[index]}`;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full font-sans">
      {/* Product Catalog Area (Left) */}
      <div className="flex-1 flex flex-col min-w-0 bg-transparent">
        
        {/* Search & Categories */}
        <div className="flex flex-col gap-4 mb-4 sticky top-0 z-10 bg-slate-50 dark:bg-slate-950 pt-1 pb-4">
            <div className="relative group shadow-sm rounded-2xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={22} />
                <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 dark:text-white rounded-2xl border-none ring-1 ring-slate-200 dark:ring-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-lg font-medium"
                />
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {categories.map(cat => (
                <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-200 transform active:scale-95 border shadow-sm ${
                    selectedCategory === cat 
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md dark:bg-indigo-600 dark:border-indigo-600' 
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300'
                    }`}
                >
                    {cat}
                </button>
                ))}
            </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto pr-1 pb-24">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map(product => {
                const gradientClass = getPlaceholderColor(product.name);
                return (
                    <div 
                        key={product.id} 
                        onClick={() => handleProductClick(product)}
                        className="group bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 cursor-pointer hover:shadow-xl hover:border-indigo-100 dark:hover:border-indigo-900/50 hover:-translate-y-1 transition-all duration-300 flex flex-col relative overflow-hidden"
                    >
                        {/* Image Placeholder */}
                        <div className={`h-32 ${gradientClass} relative p-4 flex items-center justify-center`}>
                            <span className="font-black text-4xl text-white opacity-40 mix-blend-overlay">{product.name.substring(0, 2).toUpperCase()}</span>
                            
                            {/* Stock Badge */}
                            <div className="absolute top-3 right-3 bg-white/30 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-lg border border-white/20">
                                {product.stockLevel} {product.unit}
                            </div>
                            
                            {/* Hover Add Icon */}
                            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <div className="bg-white text-slate-900 p-3 rounded-full shadow-lg transform scale-50 group-hover:scale-100 transition-transform">
                                    <Plus size={24} strokeWidth={3} />
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-4 flex flex-col flex-1 justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-1">
                                  <h4 className="font-bold text-slate-900 dark:text-white leading-tight line-clamp-2">{product.name}</h4>
                                </div>
                                <div className="flex gap-2 mb-2">
                                  {product.subcategory && (
                                    <span className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">
                                      {product.subcategory}
                                    </span>
                                  )}
                                </div>
                            </div>
                            <div className="flex items-end justify-between mt-2">
                                <div>
                                    <p className="text-[10px] text-slate-400 font-medium uppercase">Price</p>
                                    <p className="font-extrabold text-lg text-slate-900 dark:text-white">R {product.price.toFixed(2)}</p>
                                </div>
                                <span className="text-xs font-medium text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg">/{product.unit}</span>
                            </div>
                        </div>
                    </div>
                )
            })}
            </div>
        </div>
      </div>

      {/* Cart (Right) */}
      <div className="w-full lg:w-[420px] flex flex-col h-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl shadow-slate-200/50 dark:shadow-slate-950/50 border border-slate-200 dark:border-slate-800 overflow-hidden shrink-0 z-20">
        {/* Cart Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm z-10 flex flex-col gap-3">
          <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg dark:text-white flex items-center gap-2">
                  <ShoppingCart size={20} className="text-indigo-600"/> Current Order
              </h3>
              <button 
                className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                onClick={() => setCart([])}
                title="Clear Cart"
              >
                  <Trash2 size={18}/>
              </button>
          </div>
          
          {/* Customer Selector (Generic/Manual) */}
          <button 
            onClick={() => setShowCustomerModal(true)}
            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${selectedCustomer 
                ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800' 
                : 'bg-white border-slate-200 hover:border-indigo-300 dark:bg-slate-800 dark:border-slate-700'}`}
          >
              <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${selectedCustomer 
                    ? 'bg-indigo-500 text-white' 
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                      {selectedCustomer ? selectedCustomer.name.charAt(0) : <User size={18}/>}
                  </div>
                  <div className="text-left">
                      <p className={`text-sm font-bold ${selectedCustomer ? 'text-indigo-900 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}`}>
                          {selectedCustomer ? selectedCustomer.name : 'Walk-in Customer'}
                      </p>
                      {selectedCustomer && (
                          <p className="text-[10px] text-indigo-600 dark:text-indigo-400">
                             Credit: R {(selectedCustomer.creditLimit - selectedCustomer.currentDebt).toFixed(2)}
                          </p>
                      )}
                  </div>
              </div>
              {selectedCustomer ? <X size={16} onClick={(e) => { e.stopPropagation(); setSelectedCustomer(null); }} className="text-indigo-400"/> : <ChevronRight size={16} className="text-slate-400"/>}
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-2 bg-slate-50/50 dark:bg-slate-950/50">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 space-y-4 opacity-60">
              <ShoppingCart size={48} strokeWidth={1.5} />
              <p className="text-sm font-medium">Cart is empty</p>
            </div>
          ) : (
            <div className="space-y-2 p-2">
                {cart.map((item, idx) => (
                <div key={`${item.product.id}_${idx}`} className="group relative bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex gap-3 animate-scale-in">
                    <div className={`w-12 h-12 rounded-xl shrink-0 flex items-center justify-center font-bold text-lg text-white ${getPlaceholderColor(item.product.name)}`}>
                        {item.product.name.charAt(0)}
                    </div>
                    
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <h5 className="font-bold text-sm truncate dark:text-white">{item.product.name}</h5>
                        <p className="text-xs text-slate-500">@{item.product.price.toFixed(2)} / {item.product.unit}</p>
                    </div>

                    <div className="flex flex-col items-end justify-between gap-2">
                        <span className="font-extrabold text-slate-900 dark:text-white">R {(item.product.price * item.qty).toFixed(2)}</span>
                        
                        <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
                            <button onClick={() => updateQty(item.product.id, -1)} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-md shadow-sm transition-all text-slate-500"><Minus size={12}/></button>
                            <span className="w-8 text-center text-xs font-bold">{item.qty}</span>
                            <button onClick={() => updateQty(item.product.id, 1)} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-md shadow-sm transition-all text-slate-500"><Plus size={12}/></button>
                        </div>
                    </div>
                </div>
                ))}
            </div>
          )}
        </div>

        {/* Totals & Payment */}
        <div className="bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-20">
           {/* Summary */}
           <div className="px-6 pt-4 pb-2 space-y-2">
             <div className="flex justify-between text-xs text-slate-500 font-medium">
               <span>Subtotal</span>
               <span>R {subtotal.toFixed(2)}</span>
             </div>
             <div className="flex justify-between text-xs text-slate-500 font-medium">
               <span>VAT (15%)</span>
               <span>R {tax.toFixed(2)}</span>
             </div>
             <div className="flex justify-between items-baseline pt-2 border-t border-dashed border-slate-200 dark:border-slate-700">
               <span className="text-sm font-bold text-slate-900 dark:text-white">Total Amount</span>
               <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">R {total.toFixed(2)}</span>
             </div>
           </div>

           {/* Payment Methods Grid */}
           <div className="grid grid-cols-4 gap-2 px-4 py-3">
             {[
               { id: PaymentMethod.CASH, icon: Banknote, label: 'Cash', color: 'bg-emerald-500' },
               { id: PaymentMethod.EFT, icon: CreditCard, label: 'Card', color: 'bg-blue-500' },
               { id: PaymentMethod.MOMO, icon: Smartphone, label: 'MoMo', color: 'bg-amber-500' },
               { id: PaymentMethod.CREDIT, icon: UserPlus, label: 'Credit', color: 'bg-purple-500' }
             ].map((method) => (
                <button 
                  key={method.id}
                  onClick={() => handlePaymentMethodSelect(method.id as PaymentMethod)}
                  className={`flex flex-col items-center justify-center py-3 rounded-2xl border-2 transition-all duration-200 active:scale-95 ${
                    paymentMode === method.id
                    ? `border-transparent text-white shadow-lg scale-105 ${method.color}`
                    : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                    <method.icon size={20} className="mb-1" strokeWidth={2.5} />
                    <span className="text-[10px] font-bold uppercase tracking-wide">{method.label}</span>
                </button>
             ))}
           </div>

           {/* INLINE CREDIT CUSTOMER SEARCH */}
           {paymentMode === PaymentMethod.CREDIT && !selectedCustomer && (
               <div className="px-4 pb-3 animate-fade-in">
                   <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
                       <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-500 uppercase tracking-wide">
                          <UserPlus size={12} /> Assign Client
                       </div>
                       
                       <div className="relative mb-2">
                           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                           <input 
                               type="text" 
                               autoFocus
                               placeholder="Type client name..."
                               value={customerSearch}
                               onChange={(e) => setCustomerSearch(e.target.value)}
                               className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                           />
                       </div>
                       
                       <div className="max-h-32 overflow-y-auto space-y-1 custom-scrollbar">
                           {/* Create New Option */}
                           {customerSearch && !exactMatch && (
                               <button 
                                   onClick={handleCreateAndSelectCustomer}
                                   className="w-full text-left px-3 py-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold hover:bg-indigo-200 transition-colors flex items-center gap-2"
                               >
                                   <Plus size={14} className="bg-indigo-600 text-white rounded-full p-0.5" />
                                   Create New: "{customerSearch}"
                               </button>
                           )}

                           {/* Existing Customers */}
                           {filteredCustomers.map(c => (
                               <button
                                   key={c.id}
                                   onClick={() => { setSelectedCustomer(c); setCustomerSearch(''); }}
                                   className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 flex justify-between items-center group transition-colors"
                               >
                                   <div>
                                       <p className="font-bold text-slate-700 dark:text-slate-300 text-xs">{c.name}</p>
                                       <p className="text-[10px] text-slate-400">{c.phone}</p>
                                   </div>
                                   <span className={`text-[10px] font-bold ${c.currentDebt > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                       R {c.currentDebt}
                                   </span>
                               </button>
                           ))}
                           {filteredCustomers.length === 0 && !customerSearch && (
                               <p className="text-center text-xs text-slate-400 py-2 italic">Search or add new client</p>
                           )}
                       </div>
                   </div>
               </div>
           )}
           
           <div className="p-4 pt-0">
                <Button 
                        className={`w-full h-16 text-xl font-bold rounded-2xl shadow-xl transition-all duration-300 flex items-center justify-center gap-3 ${
                            (cart.length > 0 && paymentMode && (paymentMode !== PaymentMethod.CREDIT || selectedCustomer)) ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-50 cursor-not-allowed'
                        }`} 
                        disabled={cart.length === 0 || !paymentMode || (paymentMode === PaymentMethod.CREDIT && !selectedCustomer)} 
                        onClick={handlePayment}
                >
                    {paymentMode === PaymentMethod.CREDIT 
                        ? (selectedCustomer ? <>Confirm Credit Sale <ChevronRight strokeWidth={3}/></> : <>Select Client to Proceed</>)
                        : <>Confirm Payment <CheckCircle strokeWidth={3}/></>}
                </Button>
           </div>
        </div>
      </div>

      {/* Quantity Numpad Modal */}
      <Modal isOpen={showQtyModal} onClose={() => setShowQtyModal(false)} title="Enter Quantity" size="sm">
          <div className="flex flex-col h-full pt-2">
              <div className="text-center mb-6">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                      {selectedProductForQty?.name}
                  </h3>
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-bold">{selectedProductForQty?.category}</p>
              </div>
              
              {/* Display */}
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border-2 border-indigo-500/20 mb-6">
                  <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                    {inputQty || <span className="text-slate-300">0</span>}
                  </span>
                  <span className="text-sm font-bold text-slate-500 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700">
                      {selectedProductForQty?.unit}
                  </span>
              </div>

              {/* Quick Add Pills */}
              <div className="flex justify-center gap-2 mb-6">
                  {[1, 2, 5, 10].map(num => (
                      <button 
                        key={num}
                        onClick={() => setInputQty(num.toString())}
                        className="px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 font-bold text-slate-600 transition-colors text-sm"
                      >
                          {num}
                      </button>
                  ))}
              </div>

              {/* Numpad */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                  {[1,2,3,4,5,6,7,8,9,'.',0,'backspace'].map((key) => (
                      <button
                        key={key}
                        onClick={() => handleNumpadInput(key.toString())}
                        className={`h-16 rounded-2xl font-bold text-2xl transition-all active:scale-95 flex items-center justify-center shadow-sm ${
                            key === 'backspace' 
                            ? 'bg-red-50 text-red-500 hover:bg-red-100' 
                            : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-50 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                          {key === 'backspace' ? <Delete size={24}/> : key}
                      </button>
                  ))}
              </div>

              <Button className="w-full h-14 text-lg font-bold rounded-xl" onClick={confirmAddToCart}>
                  Add Item
              </Button>
          </div>
      </Modal>

      {/* Customer Selection Modal (Optional / Manual Trigger from Top Bar) */}
      <Modal 
        isOpen={showCustomerModal} 
        onClose={() => setShowCustomerModal(false)} 
        title="Select Customer" 
        size="md"
      >
        <div className="space-y-4 pt-2">
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                    type="text" 
                    placeholder="Type name to search or add new..." 
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 rounded-xl border-none outline-none font-medium focus:ring-2 focus:ring-indigo-500 text-lg"
                    autoFocus
                />
            </div>
            
            {/* Quick Add Button showing immediately when typing if no exact match */}
            {customerSearch && !exactMatch && (
                <div className="mb-2">
                    <button 
                        onClick={handleCreateAndSelectCustomer} 
                        className="w-full flex items-center gap-3 p-4 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 rounded-xl border border-indigo-200 dark:border-indigo-800 transition-all text-left group"
                    >
                        <div className="w-12 h-12 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <UserPlus size={24} />
                        </div>
                        <div>
                            <p className="font-bold text-indigo-900 dark:text-indigo-300 text-lg">Create New Client: "{customerSearch}"</p>
                            <p className="text-sm text-indigo-600 dark:text-indigo-400">Click to add and select immediately</p>
                        </div>
                    </button>
                </div>
            )}

            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {filteredCustomers.length > 0 ? (
                    filteredCustomers.map(c => (
                        <button 
                            key={c.id} 
                            onClick={() => { setSelectedCustomer(c); setShowCustomerModal(false); }}
                            className="w-full flex justify-between items-center p-4 rounded-xl border border-slate-100 hover:border-indigo-500 hover:ring-1 hover:ring-indigo-500 hover:bg-indigo-50/30 dark:border-slate-800 dark:hover:bg-slate-800 transition-all group text-left"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                    {c.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-bold text-lg text-slate-900 dark:text-white">{c.name}</p>
                                    <p className="text-sm text-slate-500">{c.phone}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Owing</p>
                                <p className={`font-bold text-lg ${c.currentDebt > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                    R {c.currentDebt.toFixed(2)}
                                </p>
                            </div>
                        </button>
                    ))
                ) : (
                    !customerSearch && (
                        <div className="text-center py-8 text-slate-400">
                            <Sparkles className="mx-auto mb-2 opacity-50" size={32}/>
                            <p>Type to find a client</p>
                        </div>
                    )
                )}
            </div>
        </div>
      </Modal>

      {/* Receipt / Success Modal */}
      <Modal isOpen={showReceiptModal} onClose={() => setShowReceiptModal(false)} title="Payment Success" size="sm">
          <div className="text-center pt-4 pb-6">
              <div className="relative inline-block mb-6">
                  <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse"></div>
                  <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 text-white rounded-full flex items-center justify-center relative shadow-xl shadow-emerald-500/30 animate-scale-in">
                      <CheckCircle size={48} strokeWidth={3} />
                  </div>
              </div>
              
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Paid Successfully</h3>
              <p className="text-slate-500 font-medium mt-1">Transaction Completed</p>
              
              <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl text-left space-y-4 border border-slate-200 dark:border-slate-700 my-8 relative overflow-hidden">
                  {/* Receipt Teeth */}
                  <div className="absolute top-0 left-0 w-full h-2 bg-[radial-gradient(circle,transparent_4px,#f8fafc_4px)] dark:bg-[radial-gradient(circle,transparent_4px,#1e293b_4px)] bg-[length:12px_12px] -mt-1"></div>
                  <div className="absolute bottom-0 left-0 w-full h-2 bg-[radial-gradient(circle,transparent_4px,#f8fafc_4px)] dark:bg-[radial-gradient(circle,transparent_4px,#1e293b_4px)] bg-[length:12px_12px] -mb-1 rotate-180"></div>
                  
                  <div className="flex justify-between items-center pb-4 border-b border-dashed border-slate-300 dark:border-slate-600">
                      <span className="font-bold text-slate-600 dark:text-slate-300 uppercase text-xs tracking-wider">Amount Paid</span>
                      <span className="font-black text-2xl text-slate-900 dark:text-white">R {total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-500">
                      <span>Reference</span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{lastTransactionId?.slice(-8).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-500">
                      <span>Date</span>
                      <span>{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</span>
                  </div>
                  {selectedCustomer && (
                    <div className="flex justify-between text-sm text-slate-500">
                        <span>Customer</span>
                        <span className="font-bold text-indigo-600">{selectedCustomer.name}</span>
                    </div>
                  )}
              </div>

              <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 h-12 font-bold rounded-xl" onClick={() => setShowReceiptModal(false)}>New Sale</Button>
                  <Button className="flex-1 h-12 bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold rounded-xl shadow-lg">
                      <Printer size={18} className="mr-2" /> Print Receipt
                  </Button>
              </div>
          </div>
      </Modal>
    </div>
  );
};
