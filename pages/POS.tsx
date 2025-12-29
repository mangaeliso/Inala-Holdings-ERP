
import React, { useState, useEffect } from 'react';
import { 
    getProducts, getCustomers, addTransaction, decrementStock,
    searchGlobalPeople, getOrCreatePerson, linkPersonToTenant, addCustomer 
} from '../services/firestore';
import { Product, PaymentMethod, TransactionType, Customer, Tenant, Person, Transaction, UserRole } from '../types';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { 
  Search, Plus, Minus, CreditCard, Banknote, Smartphone, 
  UserPlus, ShoppingBag, Trash2, CheckCircle, Printer, X, 
  ChevronRight, User, Users, Globe, RefreshCw, Clock, AlertCircle, Percent, Edit3, UserCheck
} from 'lucide-react';
import { useUI } from '../context/UIContext';

export const POS: React.FC<{ tenantId: string }> = ({ tenantId }) => {
  const { currentTenant, currentUser, addToast } = useUI();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cart, setCart] = useState<{ product: Product; qty: number; chargedPrice?: number }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [paymentMode, setPaymentMode] = useState<PaymentMethod | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [applyVat, setApplyVat] = useState(false);
  
  // Price Override Modal
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideTargetId, setOverrideTargetId] = useState<string | null>(null);
  const [overrideValue, setOverrideValue] = useState('');

  // Modals
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [lastTransactionId, setLastTransactionId] = useState<string | null>(null);
  const [lastSaleAmount, setLastSaleAmount] = useState(0);

  // Global Registry Search State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [globalResults, setGlobalResults] = useState<Person[]>([]);
  const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);

  const handleSelectPaymentMode = (mode: PaymentMethod) => {
    setPaymentMode(mode);
    if (mode === PaymentMethod.CREDIT && !selectedCustomer) {
        setShowCustomerModal(true);
        addToast("Identity linkage required for credit sales.", "info");
    }
  };

  useEffect(() => {
    const loadData = async () => {
        setIsLoading(true);
        try {
            const p = await getProducts(tenantId);
            setProducts(p.filter(item => item.isActive !== false));
            const c = await getCustomers(tenantId);
            setCustomers(c);
            
            if (currentTenant?.taxNumber) {
                setApplyVat(true);
            }
        } catch (err) {
            addToast('Cloud sync failed.', 'error');
        } finally {
            setIsLoading(false);
        }
    };
    loadData();
  }, [tenantId, currentTenant?.taxNumber]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
        if (customerSearch.length >= 3) {
            setIsSearchingGlobal(true);
            const results = await searchGlobalPeople(customerSearch);
            setGlobalResults(results);
            setIsSearchingGlobal(false);
        } else {
            setGlobalResults([]);
        }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [customerSearch]);

  const handleAddToCart = (product: Product) => {
      if (product.stockLevel <= 0) {
          addToast(`No stock available for ${product.name}`, 'warning');
          return;
      }
      setCart(prev => {
          const existing = prev.find(item => item.product.id === product.id);
          if (existing) {
              return prev.map(item => item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item);
          }
          return [...prev, { product, qty: 1, chargedPrice: product.price }];
      });
  };

  const updateCartQty = (id: string, delta: number) => {
      setCart(prev => prev.map(item => {
          if (item.product.id === id) {
              const newQty = Math.max(0, item.qty + delta);
              return { ...item, qty: newQty };
          }
          return item;
      }).filter(item => item.qty > 0));
  };

  const handleOverridePrice = (id: string) => {
      const item = cart.find(i => i.product.id === id);
      if (!item) return;
      setOverrideTargetId(id);
      setOverrideValue((item.chargedPrice ?? item.product.price).toString());
      setShowOverrideModal(true);
  };

  const applyOverride = () => {
      const numericValue = parseFloat(overrideValue);
      if (isNaN(numericValue)) {
          addToast('Please enter a valid price.', 'warning');
          return;
      }
      setCart(prev => prev.map(item => {
          if (item.product.id === overrideTargetId) {
              return { ...item, chargedPrice: numericValue };
          }
          return item;
      }));
      setShowOverrideModal(false);
  };

  // FINANCIAL CALCULATIONS
  const vatRate = currentTenant?.posSettings?.taxRate || 15;
  const subtotalGross = cart.reduce((sum, item) => sum + ((item.product.price || 0) * item.qty), 0);
  const subtotalCharged = cart.reduce((sum, item) => sum + ((item.chargedPrice ?? item.product.price) * item.qty), 0);
  
  const vatAmount = applyVat ? (subtotalCharged * (vatRate / 100)) : 0;
  const totalCharged = subtotalCharged + vatAmount;

  const handlePayment = async () => {
    if (!paymentMode || !tenantId || cart.length === 0) return;
    if (paymentMode === PaymentMethod.CREDIT && !selectedCustomer) {
        setShowCustomerModal(true);
        return;
    }

    setIsLoading(true);
    const txId = `tx_${Date.now()}`;
    const finalizedAmount = totalCharged;
    const tx: Transaction = {
        id: txId,
        tenantId: tenantId,
        branchId: 'b_001',
        customerId: selectedCustomer?.id || 'walk_in',
        customerName: selectedCustomer?.name || 'Walk-in Customer',
        type: TransactionType.SALE,
        amount: finalizedAmount,
        grossAmount: subtotalGross,
        subtotal: subtotalCharged,
        vatRate: applyVat ? vatRate : 0,
        vatAmount: vatAmount,
        currency: currentTenant?.cycleSettings?.currencySymbol || 'ZAR',
        method: paymentMode,
        status: 'COMPLETED',
        timestamp: new Date().toISOString(),
        receivedBy: currentUser?.name || 'Cashier',
        receivedByUserId: currentUser?.id || 'unknown',
        items: cart.map(item => ({
            productId: item.product.id,
            name: item.product.name,
            qty: item.qty,
            price: item.product.price,
            chargedPrice: item.chargedPrice,
            subtotal: (item.chargedPrice ?? item.product.price) * item.qty
        }))
    };

    try {
        await addTransaction(tx);
        for (const item of cart) {
            const path = (item.product as any).__path || `products/${item.product.id}`;
            await decrementStock(path, item.qty);
        }
        setLastTransactionId(txId);
        setLastSaleAmount(finalizedAmount);
        setShowReceiptModal(true);
        setCart([]);
        setSelectedCustomer(null);
        setPaymentMode(null);
    } catch (e) {
        addToast('Transaction failed.', 'error');
    } finally {
        setIsLoading(false);
    }
  };

  const handleQuickAddCustomer = async () => {
      if (!customerSearch) return;
      setIsLoading(true);
      try {
          const newId = `c_${Date.now()}`;
          const newCus: Customer = {
              id: newId,
              tenantId: tenantId,
              name: customerSearch,
              phone: '',
              creditLimit: 0,
              currentDebt: 0
          };
          await addCustomer(newCus);
          setCustomers(prev => [newCus, ...prev]);
          setSelectedCustomer(newCus);
          setShowCustomerModal(false);
          setCustomerSearch('');
          addToast(`Registered ${newCus.name} for Credit`, 'success');
      } catch (err) {
          addToast("Failed to add client", "error");
      } finally {
          setIsLoading(false);
      }
  };

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category || 'General')))];
  const filteredProducts = products.filter(p => 
      (selectedCategory === 'All' || (p.category || 'General') === selectedCategory) &&
      ((p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (p.sku || '').toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredLocalCustomers = customers.filter(c => 
    (c.name || '').toLowerCase().includes(customerSearch.toLowerCase()) || 
    (c.phone || '').includes(customerSearch)
  );

  const exactMatch = customers.find(c => (c.name || '').toLowerCase() === customerSearch.toLowerCase());

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full font-sans select-none overflow-hidden pb-4">
      {/* Product Search & Grid */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <div className="flex flex-col gap-3 mb-4 sticky top-0 z-10">
            <div className="relative group shadow-sm">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Search catalog..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-900 dark:text-white rounded-2xl border-none ring-1 ring-slate-200 dark:ring-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                />
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {categories.map(cat => (
                <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all uppercase tracking-widest ${
                    selectedCategory === cat 
                        ? 'bg-slate-900 text-white dark:bg-indigo-600' 
                        : 'bg-white text-slate-500 border border-slate-200 dark:bg-slate-900 dark:border-slate-800'
                    }`}
                >
                    {cat}
                </button>
                ))}
            </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-1">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                {filteredProducts.map((product) => (
                    <div 
                        key={product.id} 
                        onClick={() => handleAddToCart(product)}
                        className={`bg-white dark:bg-slate-900 p-3 rounded-2xl border transition-all cursor-pointer active:scale-95 shadow-sm group flex flex-col min-h-[140px] ${product.stockLevel <= 0 ? 'opacity-50 grayscale border-slate-200' : 'hover:border-indigo-500 border-slate-100 dark:border-slate-800'}`}
                    >
                        <div className="h-16 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex items-center justify-center font-black text-2xl text-slate-200 uppercase mb-2">
                            {(product.name || 'P').charAt(0)}
                        </div>
                        <h4 className="font-black text-[10px] leading-tight line-clamp-2 dark:text-white mb-1 uppercase tracking-tighter h-8">
                            {product.name}
                        </h4>
                        <div className="mt-auto flex justify-between items-center">
                            <span className="text-indigo-600 font-black text-xs">R {(product.price || 0).toFixed(2)}</span>
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${product.stockLevel > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                {product.stockLevel}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* Cart Sidepanel */}
      <div className="w-full lg:w-96 flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl h-full">
        <div className="p-4 border-b border-slate-50 dark:border-slate-800">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-black text-xs dark:text-white uppercase tracking-widest flex items-center gap-2">
                    <ShoppingBag size={16} className="text-indigo-600"/> Cart
                </h3>
                <button 
                  onClick={() => setApplyVat(!applyVat)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${applyVat ? 'bg-indigo-600 text-white border-indigo-700 shadow-md' : 'bg-slate-50 text-slate-400 border-slate-200 dark:bg-slate-800'}`}
                >
                  <Percent size={12} /> VAT {vatRate}%: {applyVat ? 'On' : 'Off'}
                </button>
            </div>

            <button 
                onClick={() => setShowCustomerModal(true)}
                className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all ${selectedCustomer ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20' : 'bg-slate-50 border-slate-200 dark:bg-slate-800/50'}`}
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-black text-xs uppercase">
                        {selectedCustomer ? selectedCustomer.name.charAt(0) : <User size={14}/>}
                    </div>
                    <div className="text-left overflow-hidden">
                        <p className="text-[11px] font-black truncate max-w-[150px] uppercase dark:text-white">
                            {selectedCustomer ? selectedCustomer.name : 'Walk-in Client'}
                        </p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                            {selectedCustomer ? 'Identity Linked' : 'Standard Sale'}
                        </p>
                    </div>
                </div>
                {selectedCustomer ? <X size={14} className="text-slate-400" onClick={(e) => { e.stopPropagation(); setSelectedCustomer(null); }} /> : <ChevronRight size={14} className="text-slate-300" />}
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {cart.map((item) => (
                <div key={item.product.id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl animate-scale-in">
                    <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-black truncate dark:text-white uppercase">{item.product.name}</p>
                        <div className="flex items-center gap-2">
                           <span className="text-[9px] text-slate-400 font-bold line-through">R{(item.product.price || 0).toFixed(2)}</span>
                           <button onClick={() => handleOverridePrice(item.product.id)} className="flex items-center gap-1 text-[10px] text-indigo-600 font-black hover:text-indigo-700">
                               R{(item.chargedPrice ?? item.product.price).toFixed(2)}
                               <Edit3 size={10} />
                           </button>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center bg-white dark:bg-slate-900 rounded-lg border dark:border-slate-700 px-1 shadow-sm">
                            <button onClick={() => updateCartQty(item.product.id, -1)} className="p-1.5 hover:text-red-500"><Minus size={12}/></button>
                            <span className="w-6 text-center font-black text-xs dark:text-white">{item.qty}</span>
                            <button onClick={() => updateCartQty(item.product.id, 1)} className="p-1.5 hover:text-indigo-600"><Plus size={12}/></button>
                        </div>
                        <div className="text-right min-w-[65px] font-black text-xs text-slate-900 dark:text-white">
                            R{((item.chargedPrice ?? item.product.price) * item.qty).toFixed(2)}
                        </div>
                    </div>
                </div>
            ))}
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 rounded-b-3xl">
            <div className="space-y-1 mb-4">
              <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <span>Gross (Retail Value)</span>
                  <span className="line-through">R {subtotalGross.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <span>Charged Amount</span>
                  <span>R {subtotalCharged.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-black uppercase tracking-tighter dark:text-white pt-1 border-t border-slate-200 mt-2">
                  <span>Payable</span>
                  <span className="text-indigo-600">R {totalCharged.toFixed(2)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
                <Button variant={paymentMode === PaymentMethod.CASH ? 'primary' : 'outline'} size="sm" onClick={() => handleSelectPaymentMode(PaymentMethod.CASH)} className="rounded-xl h-10 font-black uppercase text-[10px] tracking-widest">
                    <Banknote size={14} className="mr-1.5"/> Cash
                </Button>
                <Button variant={paymentMode === PaymentMethod.EFT ? 'primary' : 'outline'} size="sm" onClick={() => handleSelectPaymentMode(PaymentMethod.EFT)} className="rounded-xl h-10 font-black uppercase text-[10px] tracking-widest">
                    <CreditCard size={14} className="mr-1.5"/> Card
                </Button>
                <Button variant={paymentMode === PaymentMethod.CREDIT ? 'primary' : 'outline'} size="sm" onClick={() => handleSelectPaymentMode(PaymentMethod.CREDIT)} className="rounded-xl h-10 font-black uppercase text-[10px] tracking-widest">
                    <Clock size={14} className="mr-1.5"/> Credit
                </Button>
                <Button variant={paymentMode === PaymentMethod.MOMO ? 'primary' : 'outline'} size="sm" onClick={() => handleSelectPaymentMode(PaymentMethod.MOMO)} className="rounded-xl h-10 font-black uppercase text-[10px] tracking-widest">
                    <Smartphone size={14} className="mr-1.5"/> MoMo
                </Button>
            </div>

            <Button 
                className="w-full h-12 text-sm font-black uppercase tracking-widest shadow-xl bg-indigo-600 text-white rounded-xl"
                disabled={cart.length === 0 || !paymentMode || (paymentMode === PaymentMethod.CREDIT && !selectedCustomer)}
                onClick={handlePayment}
                isLoading={isLoading}
            >
                {paymentMode === PaymentMethod.CREDIT && !selectedCustomer ? 'Select Client First' : 'Finalize Sale'}
            </Button>
        </div>
      </div>

      {/* Sale Complete Modal */}
      <Modal isOpen={showReceiptModal} onClose={() => setShowReceiptModal(false)} title="Sale Complete" size="sm">
          <div className="text-center py-6">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-scale-in shadow-inner">
                  <CheckCircle size={48} />
              </div>
              <h4 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-1">R {lastSaleAmount.toFixed(2)}</h4>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">PAYMENT RECORDED</p>
              <div className="mt-8 space-y-2">
                  <Button className="w-full h-12 bg-slate-900 text-white font-black uppercase tracking-widest text-xs rounded-xl" onClick={() => setShowReceiptModal(false)}>Next Sale</Button>
              </div>
          </div>
      </Modal>

      {/* OVERRIDE PRICE MODAL */}
      <Modal isOpen={showOverrideModal} onClose={() => setShowOverrideModal(false)} title="Price Override" size="sm">
          <div className="space-y-4 pt-2">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-2">
                  <AlertCircle size={16} className="text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-[10px] font-black text-amber-700 uppercase leading-tight">Price overridden here only affects THIS sale. Global catalog remains unchanged.</p>
              </div>
              <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500">Negotiated Price (Per Unit)</label>
                  <input 
                    type="number" 
                    autoFocus
                    step="0.01"
                    className="w-full p-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl border border-slate-200 dark:border-slate-700 font-black text-2xl outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                    value={overrideValue}
                    onChange={e => setOverrideValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && applyOverride()}
                  />
              </div>
              <Button className="w-full h-12" onClick={applyOverride}>Update Cart Item</Button>
          </div>
      </Modal>

      {/* REGISTRY LOOKUP MODAL */}
      <Modal isOpen={showCustomerModal} onClose={() => setShowCustomerModal(false)} title="Client Identity Registry" size="md">
          <div className="space-y-6 pt-1">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                    <input 
                        type="text" 
                        autoFocus
                        placeholder="Search Client Name or Phone..."
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm shadow-inner dark:text-white"
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                    />
                </div>

                <div className="max-h-[400px] overflow-y-auto space-y-2 no-scrollbar pr-1">
                    {/* LOCAL SEARCH RESULTS - HIDE UNTIL 3 CHARS TYPED */}
                    {customerSearch.length >= 3 && filteredLocalCustomers.length > 0 && (
                        <div className="space-y-2 animate-fade-in">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">Business Records Found</p>
                            {filteredLocalCustomers.map(c => (
                                <button key={c.id} onClick={() => { setSelectedCustomer(c); setShowCustomerModal(false); if (!paymentMode) setPaymentMode(PaymentMethod.CREDIT); }} className="w-full text-left p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-indigo-900/10 transition-all flex items-center justify-between group shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-xs text-indigo-600 border border-slate-200 dark:border-slate-700 uppercase">{(c.name || 'C').charAt(0)}</div>
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-tight dark:text-white">{c.name}</p>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase">{c.phone || 'No Contact Info'}</p>
                                        </div>
                                    </div>
                                    <UserCheck size={18} className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* QUICK ADD OPTION - ALWAYS SHOW IF TYPING AND NO EXACT MATCH */}
                    {customerSearch.length > 0 && !exactMatch && (
                        <div className="pt-4 border-t border-slate-50 dark:border-slate-800 mt-4">
                            <button 
                                onClick={handleQuickAddCustomer}
                                className="w-full p-6 rounded-3xl border-2 border-dashed border-indigo-200 dark:border-slate-700 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 flex flex-col items-center justify-center text-center transition-all group"
                            >
                                <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                    <UserPlus size={24} />
                                </div>
                                <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Register "{customerSearch}"</h4>
                                <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Create new profile for credit eligibility</p>
                            </button>
                        </div>
                    )}

                    {/* EMPTY SEARCH STATE */}
                    {customerSearch.length < 3 && (
                        <div className="py-20 text-center opacity-40">
                            <Users size={48} className="mx-auto text-slate-300 mb-3" />
                            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Type at least 3 letters to search...</p>
                        </div>
                    )}

                    {customerSearch.length >= 3 && filteredLocalCustomers.length === 0 && (
                        <div className="py-20 text-center opacity-40">
                            <AlertCircle size={48} className="mx-auto text-slate-300 mb-3" />
                            <p className="text-xs font-black uppercase tracking-widest text-slate-400">No existing records for "{customerSearch}"</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Use the registration button below to add them.</p>
                        </div>
                    )}
                </div>
          </div>
      </Modal>
    </div>
  );
};
