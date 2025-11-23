import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', noPadding = false, hover = false }) => {
  return (
    <div className={`
      glass-panel rounded-2xl shadow-soft border border-white/60 bg-white/70 
      dark:bg-slate-900/60 dark:border-slate-800/50 
      transition-all duration-300 ease-out
      ${hover ? 'hover:shadow-lg hover:-translate-y-1' : ''}
      ${noPadding ? '' : 'p-6'} 
      ${className}
    `}>
      {children}
    </div>
  );
};