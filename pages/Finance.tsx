import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { MOCK_POPS } from '../services/mockData';
import { POPStatus } from '../types';
import { Check, X, Eye, Upload } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const Finance: React.FC = () => {
  const [pops, setPops] = useState(MOCK_POPS);
  const [selectedPop, setSelectedPop] = useState<string | null>(null);

  const handleVerify = (id: string, status: POPStatus) => {
    setPops(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    setSelectedPop(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-bold">Financials</h2>
           <p className="text-slate-500">Ledgers & Payment Verification</p>
        </div>
        <Button variant="secondary">
          <Upload size={16} className="mr-2" />
          Upload Manual POP
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Verification Queue */}
        <div className="lg:col-span-2 space-y-4">
           <h3 className="font-semibold text-lg flex items-center gap-2">
             Verification Queue 
             <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">{pops.filter(p => p.status === POPStatus.PENDING).length} Pending</span>
           </h3>
           
           {pops.map(pop => (
             <Card key={pop.id} className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                <div 
                  className="w-full md:w-24 h-24 bg-slate-100 rounded-lg overflow-hidden cursor-pointer relative group"
                  onClick={() => setSelectedPop(pop.id)}
                >
                  <img src={pop.imageUrl} alt="POP" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Eye className="text-white" />
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 text-xs rounded font-medium ${
                      pop.status === POPStatus.PENDING ? 'bg-amber-100 text-amber-700' :
                      pop.status === POPStatus.VERIFIED ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {pop.status}
                    </span>
                    <span className="text-xs text-slate-400">{new Date(pop.timestamp).toLocaleDateString()}</span>
                  </div>
                  <h4 className="font-bold text-lg">R {pop.amount.toFixed(2)}</h4>
                  <p className="text-sm text-slate-600">Ref: {pop.reference}</p>
                  <p className="text-xs text-slate-400 mt-1">Uploaded by Customer #{pop.uploadedBy}</p>
                </div>

                {pop.status === POPStatus.PENDING && (
                  <div className="flex gap-2 w-full md:w-auto">
                    <Button variant="outline" size="sm" onClick={() => handleVerify(pop.id, POPStatus.REJECTED)} className="flex-1 md:flex-none border-red-200 text-red-600 hover:bg-red-50">
                      <X size={16} />
                    </Button>
                    <Button size="sm" onClick={() => handleVerify(pop.id, POPStatus.VERIFIED)} className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700">
                      <Check size={16} className="mr-2" /> Verify
                    </Button>
                  </div>
                )}
             </Card>
           ))}
        </div>

        {/* Mini Ledger */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Ledger Summary</h3>
          <Card className="space-y-4">
             <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-100">
               <p className="text-xs text-indigo-600 font-medium uppercase tracking-wide">Cash on Hand</p>
               <h4 className="text-2xl font-bold text-indigo-900 mt-1">R 12,450.00</h4>
             </div>
             <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100">
               <p className="text-xs text-emerald-600 font-medium uppercase tracking-wide">Bank (Verified)</p>
               <h4 className="text-2xl font-bold text-emerald-900 mt-1">R 85,200.00</h4>
             </div>
             <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
               <p className="text-xs text-amber-600 font-medium uppercase tracking-wide">Outstanding Loans</p>
               <h4 className="text-2xl font-bold text-amber-900 mt-1">R 5,750.00</h4>
             </div>
          </Card>
        </div>
      </div>

      {/* POP Modal Overlay */}
      {selectedPop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedPop(null)}>
          <div className="bg-white rounded-xl overflow-hidden max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-bold">Proof of Payment</h3>
              <button onClick={() => setSelectedPop(null)}><X size={20}/></button>
            </div>
            <div className="flex-1 overflow-auto bg-slate-900 flex items-center justify-center p-4">
               <img src={MOCK_POPS.find(p => p.id === selectedPop)?.imageUrl} alt="Full POP" className="max-w-full max-h-full rounded shadow-lg" />
            </div>
            <div className="p-4 border-t bg-slate-50 flex justify-end gap-2">
               <Button onClick={() => handleVerify(selectedPop!, POPStatus.VERIFIED)}>Confirm & Ledger</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};