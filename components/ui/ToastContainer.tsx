
import React from 'react';
import { useUI } from '../../context/UIContext';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useUI();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            layout
            className={`
              flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border w-80 backdrop-blur-md
              ${toast.type === 'success' ? 'bg-white dark:bg-slate-900 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : ''}
              ${toast.type === 'error' ? 'bg-white dark:bg-slate-900 border-red-500/20 text-red-600 dark:text-red-400' : ''}
              ${toast.type === 'warning' ? 'bg-white dark:bg-slate-900 border-amber-500/20 text-amber-600 dark:text-amber-400' : ''}
              ${toast.type === 'info' ? 'bg-white dark:bg-slate-900 border-blue-500/20 text-blue-600 dark:text-blue-400' : ''}
            `}
          >
            <div className="shrink-0">
              {toast.type === 'success' && <CheckCircle size={20} />}
              {toast.type === 'error' && <AlertCircle size={20} />}
              {toast.type === 'warning' && <AlertTriangle size={20} />}
              {toast.type === 'info' && <Info size={20} />}
            </div>
            <p className="text-sm font-medium flex-1 text-slate-700 dark:text-slate-200">{toast.message}</p>
            <button 
              onClick={() => removeToast(toast.id)} 
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
