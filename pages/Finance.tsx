import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { getPOPs, updatePOP } from '../services/firestore';
import { POPStatus, POPDocument } from '../types';
import { Check, X, Eye, Upload } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useUI } from '../context/UIContext';

export const Finance: React.FC = () => {
  const { currentTenant } = useUI();
  const [pops, setPops] = useState<POPDocument[]>([]);
  const [selectedPop, setSelectedPop] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPOPs = async () => {
      setIsLoading(true);
      try {
        if (!currentTenant?.id || currentTenant.id === 'global') { // Ensure tenantId is available
          setPops([]); // Clear POPs if no tenant
          setIsLoading(false);
          return;
        }
        // Fix: Pass currentTenant.id to getPOPs
        const data = await getPOPs(currentTenant.id);
        setPops(data);
      } catch (error) {
        console.error("Failed to load POPs:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadPOPs();
  }, [currentTenant?.id]);

  const handleVerify = async (id: string, status: POPStatus) => {
    const pop = pops.find(p => p.id === id);
    if (!pop || !currentTenant?.id) return;

    const updated = { ...pop, status };
    // Fix: updatePOP now accepts tenantId
    await updatePOP(currentTenant.id, updated);
    setPops(prev => prev.map(p => p.id === id ? updated : p));
    setSelectedPop(null);
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p>Loading financials...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Financials</h2>
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
           <h3 className="font-semibold text-lg flex items-center gap-2 text-slate-900 dark:text-white">
             Verification Queue 
             <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">{(pops.filter(p => p.status === POPStatus.PENDING).length || 0)} Pending</span>
           </h3>
           
           {pops.map(pop => (
             <Card key={pop.id} className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                <div 
                  className="w-full md:w-24 h-24 bg-slate-100 rounded-lg overflow-hidden cursor-pointer relative group"
                  onClick={() => setSelectedPop(pop.id)}
                >
                  <img src={pop.imageUrl || ''} alt="POP" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Eye className="text-white" />
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 text-xs rounded font-medium ${
                      pop.status === POPStatus.PENDING ? 'bg-amber-100 text-amber-700' :
                      pop.status === POPStatus.VERIFIED ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                        {pop.status}
                    </span>
                    <span className="text-xs text-slate-400">{new Date(pop.timestamp).toLocaleDateString()}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Ref: {pop.reference}</h4>
                  <p className="text-sm text-slate-500">Amount: <strong>R {(pop.amount || 0).toFixed(2)}</strong></p>
                  <p className="text-xs text-slate-400 mt-1">Uploaded by User ID: {pop.uploadedBy}</p>
                </div>

                {pop.status === POPStatus.PENDING && (
                    <div className="flex gap-2">
                        <Button 
                            size="sm" 
                            className="bg-red-50 text-red-600 hover:bg-red-100 border-none"
                            onClick={() => handleVerify(pop.id, POPStatus.REJECTED)}
                        >
                            <X size={16} />
                        </Button>
                        <Button 
                            size="sm" 
                            className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-none"
                            onClick={() => handleVerify(pop.id, POPStatus.VERIFIED)}
                        >
                            <Check size={16} />
                        </Button>
                    </div>
                )}
             </Card>
           ))}
           {pops.length === 0 && (
               <div className="p-8 text-center text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                   No proofs of payment to review.
               </div>
           )}
        </div>

        {/* Quick Stats or Details */}
        <div className="space-y-6">
            <Card className="bg-gradient-to-br from-slate-900 to-indigo-900 text-white">
                <h3 className="font-bold text-lg mb-2">Total Verified</h3>
                <p className="text-4xl font-black">
                    R {(pops.filter(p => p.status === POPStatus.VERIFIED).reduce((acc, p) => acc + (p.amount || 0), 0) || 0).toLocaleString()}
                </p>
                <p className="text-indigo-200 text-sm mt-2">All time processed volume</p>
            </Card>

            {selectedPop && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedPop(null)}>
                    <div className="max-w-3xl w-full bg-white p-2 rounded-xl" onClick={e => e.stopPropagation()}>
                        <img 
                            src={pops.find(p => p.id === selectedPop)?.imageUrl || ''} 
                            alt="Full POP" 
                            className="w-full max-h-[80vh] object-contain rounded-lg"
                        />
                        <div className="p-4 flex justify-between items-center">
                            <span className="font-bold">Document Preview</span>
                            <Button size="sm" onClick={() => setSelectedPop(null)}>Close</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};