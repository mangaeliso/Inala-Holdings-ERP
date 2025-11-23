import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', noPadding = false }) => {
  return (
    <div className={`glass-panel rounded-2xl shadow-sm border border-white/50 bg-white/60 dark:bg-slate-900/60 dark:border-slate-700/50 ${noPadding ? '' : 'p-6'} ${className}`}>
      {children}
    </div>
  );
};