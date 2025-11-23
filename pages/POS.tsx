
import React, { useState } from 'react';
import { MOCK_PRODUCTS, MOCK_TENANTS, MOCK_CUSTOMERS, addTransaction, addCustomer } from '../services/mockData';
import { Product, PaymentMethod, TransactionType, Customer } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Search, Plus, Minus, CreditCard, Banknote, Smartphone, UserPlus, ShoppingCart, Trash2, CheckCircle, Printer } from 'lucide-react';

interface POSProps {
  tenantId?: string | null;
  onBack?: () => void;
}

export const POS: React.FC<POSProps> = ({ tenantId, onBack }) => {
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

  // Filter products by tenant context
  const tenantProducts = tenantId 
    ? MOCK_PRODUCTS.filter(p => p.tenantId === tenantId)
    : MOCK_PRODUCTS;

  const tenant = tenantId ? MOCK_TENANTS.find(t => t.id === tenantId) : null;
  const customers = MOCK_CUSTOMERS.filter(c => c.tenantId === tenantId);

  // Derive categories
  const allCategories = Array.from(new Set(tenantProducts.map(p => p.category)));
  const categories = ['All', ...allCategories];

  const filteredProducts = tenantProducts.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleProductClick = (product: Product) => {
      setSelectedProductForQty(product);
      setInputQty('1');
      setShowQtyModal(true);
  };

  const confirmAddToCart = () => {
    if (!selectedProductForQty || !inputQty) return;
    const qty = parseFloat(inputQty);
    if (qty <= 0) return;

    setCart(prev => {
      const existing = prev.find(item => item.product.id === selectedProductForQty.id);
      if (existing) {
        return prev.map(item => item.product.id === selectedProductForQty.id ? { ...item, qty: item.qty + qty } : item);
      }
      return [...prev, { product: selectedProductForQty, qty }];
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

  const handlePayment = () => {
    if (!paymentMode) return;
    
    if (paymentMode === PaymentMethod.CREDIT && !selectedCustomer) {
        setShowCustomerModal(true);
        return;
    }
    
    processTransaction();
  };

  const processTransaction = () => {
    const txId = `tx_${Date.now()}`;
    addTransaction({
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

  const handleCreateAndSelectCustomer = () => {
      if (!customerSearch) return;
      const newId = `c_${Date.now()}`;
      const newCus: Customer = {
          id: newId,
          tenantId: tenantId!,
          name: customerSearch,
          phone: '',
          creditLimit: 1000, // Default limit
          currentDebt: 0
      };
      addCustomer(newCus);
      setSelectedCustomer(newCus);
      setCustomerSearch('');
      // Automatically proceed or let user verify? Let's auto-select and close modal to continue payment
      setShowCustomerModal(false);
      // Wait for state update to trigger process? 
      // Better to just set it locally and rely on user clicking "Finalize" or re-trigger processTransaction immediately
      // But we are inside the modal flow.
  };

  const filteredCustomers = customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()));
  const exactMatch = customers.find(c => c.name.toLowerCase() === customerSearch.toLowerCase());

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Product Grid (Left) */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="mb-4 space-y-4">
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
              onClick={() => handleProductClick(product)}
              className="bg-white dark:bg-slate-900 p-3 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 cursor-pointer hover:shadow-md transition-all flex flex-col h-full group active:scale-95"
            >
              <div className="aspect-[4/3] bg-indigo-50 dark:bg-slate-800 rounded-lg mb-3 flex items-center justify-center relative">
                 <span className="font-bold text-2xl text-indigo-200 dark:text-slate-700">{product.name.charAt(0)}</span>
                 <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm">
                  {product.stockLevel} {product.unit}
                </div>
              </div>
              <h4 className="font-medium text-sm text-slate-900 dark:text-white line-clamp-2">{product.name}</h4>
              <div className="mt-auto pt-2 flex justify-between items-center">
                <span className="font-bold text-slate-900 dark:text-white">R {product.price.toFixed(2)}</span>
                <span className="text-xs text-slate-400">/{product.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart (Right) */}
      <Card className="w-full lg:w-96 flex flex-col h-full bg-white dark:bg-slate-900" noPadding>
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
          <div>
              <h3 className="font-bold text-lg dark:text-white">Current Sale</h3>
              {selectedCustomer && <p className="text-xs text-indigo-600 font-medium">Customer: {selectedCustomer.name}</p>}
          </div>
          <button className="text-red-500 p-2 hover:bg-red-50 rounded-full" onClick={() => setCart([])}><Trash2 size={18}/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 opacity-50">
              <ShoppingCart size={48} />
              <p className="text-sm">Select item and enter quantity</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.product.id} className="flex gap-3 animate-fade-in items-center">
                <div className="w-10 h-10 bg-indigo-50 dark:bg-slate-800 rounded-lg flex-shrink-0 flex items-center justify-center font-bold text-indigo-300">
                    {item.product.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="font-medium text-sm truncate dark:text-white">{item.product.name}</h5>
                  <p className="text-xs text-slate-500">R {item.product.price.toFixed(2)} / {item.product.unit}</p>
                </div>
                <div className="flex items-center gap-2">
                   <span className="text-sm font-bold dark:text-white">{item.qty} {item.product.unit}</span>
                   <button onClick={() => updateQty(item.product.id, -1)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 size={14}/></button>
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
             <div className="flex justify-between text-xl font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
               <span>Total</span>
               <span>R {total.toFixed(2)}</span>
             </div>
           </div>

           <div className="grid grid-cols-4 gap-2 mb-4">
             {[
               { id: PaymentMethod.CASH, icon: Banknote, label: 'Cash' },
               { id: PaymentMethod.EFT, icon: CreditCard, label: 'EFT' },
               { id: PaymentMethod.MOMO, icon: Smartphone, label: 'MoMo' },
               { id: PaymentMethod.CREDIT, icon: UserPlus, label: 'Credit' }
             ].map((method) => (
                <button 
                  key={method.id}
                  onClick={() => setPaymentMode(method.id as PaymentMethod)} 
                  className={`flex flex-col items-center justify-center py-2 rounded-lg border transition-all ${
                    paymentMode === method.id
                    ? 'bg-slate-900 border-slate-900 text-white dark:bg-indigo-600 dark:border-indigo-600'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                  }`}
                >
                    <method.icon size={18} className="mb-1" />
                    <span className="text-[10px] font-bold">{method.label}</span>
                </button>
             ))}
           </div>
           
           <Button className="w-full h-12 text-lg shadow-lg shadow-indigo-500/20" disabled={cart.length === 0 || !paymentMode} onClick={handlePayment}>
             {paymentMode === PaymentMethod.CREDIT ? 'Select Customer' : 'Finalize Sale'}
           </Button>
        </div>
      </Card>

      {/* Quantity Modal */}
      <Modal isOpen={showQtyModal} onClose={() => setShowQtyModal(false)} title="Enter Quantity" size="sm">
          <div className="space-y-4">
              <p className="text-center text-slate-500">
                  How much <strong>{selectedProductForQty?.name}</strong>?
              </p>
              <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    autoFocus
                    value={inputQty}
                    onChange={(e) => setInputQty(e.target.value)}
                    className="flex-1 text-center text-3xl font-bold border rounded-lg py-4 dark:bg-slate-800 dark:border-slate-700"
                    placeholder="0.00"
                  />
                  <span className="text-xl font-bold text-slate-400">{selectedProductForQty?.unit}</span>
              </div>
              <Button className="w-full h-12 text-lg" onClick={confirmAddToCart}>
                  Add to Cart
              </Button>
          </div>
      </Modal>

      {/* Credit Customer Modal */}
      <Modal isOpen={showCustomerModal} onClose={() => setShowCustomerModal(false)} title="Select Credit Customer">
        <div className="space-y-6">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Search name or type new..." 
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border rounded-lg dark:bg-slate-800 dark:border-slate-700 font-medium"
                    autoFocus
                />
            </div>
            
            <div className="max-h-40 overflow-y-auto space-y-2">
                {filteredCustomers.map(c => (
                    <button 
                        key={c.id} 
                        onClick={() => { setSelectedCustomer(c); setPaymentMode(PaymentMethod.CREDIT); setShowCustomerModal(false); }}
                        className="w-full flex justify-between items-center p-3 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
                    >
                        <div>
                            <p className="font-bold text-slate-900 dark:text-white">{c.name}</p>
                            <p className="text-xs text-slate-500">{c.phone}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-slate-500">Debt</p>
                            <p className="font-bold text-red-500">R {c.currentDebt.toFixed(2)}</p>
                        </div>
                    </button>
                ))}
            </div>

            {customerSearch && !exactMatch && (
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
                    <p className="text-sm text-slate-500 mb-3">Customer not found.</p>
                    <Button onClick={handleCreateAndSelectCustomer} className="w-full">
                        <UserPlus size={16} className="mr-2" />
                        Add "{customerSearch}" & Charge
                    </Button>
                </div>
            )}
            
            {/* If customer selected in this modal context, show a confirm button */}
            {selectedCustomer && (
                <Button className="w-full mt-4" onClick={() => { setShowCustomerModal(false); /* The main loop handles payment check */ }}>
                    Continue with {selectedCustomer.name}
                </Button>
            )}
        </div>
      </Modal>

      {/* Receipt Modal */}
      <Modal isOpen={showReceiptModal} onClose={() => setShowReceiptModal(false)} title="Transaction Complete" size="sm">
          <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle size={32} />
              </div>
              <h3 className="text-xl font-bold">Payment Successful</h3>
              <p className="text-slate-500">Change Due: R 0.00</p>
              
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg text-left text-sm font-mono space-y-2 border border-slate-100 dark:border-slate-700 my-4">
                  <div className="flex justify-between font-bold border-b pb-2 mb-2 dark:border-slate-700">
                      <span>INALA {tenant?.name}</span>
                      <span>#{lastTransactionId?.slice(-4)}</span>
                  </div>
                  <div className="space-y-1">
                      <p className="text-center text-slate-400 py-2">--- Digital Receipt Generated ---</p>
                  </div>
                  <div className="flex justify-between font-bold border-t pt-2 mt-2 dark:border-slate-700">
                      <span>Total Paid</span>
                      <span>R {total.toFixed(2)}</span>
                  </div>
              </div>

              <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setShowReceiptModal(false)}>Close</Button>
                  <Button className="flex-1">
                      <Printer size={16} className="mr-2" /> Print
                  </Button>
              </div>
          </div>
      </Modal>
    </div>
  );
};
