
import React from 'react';
import { cn } from '../../lib/utils';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
  return (
    <div 
      className={cn("animate-pulse bg-slate-200 dark:bg-slate-800 rounded-md", className)}
    />
  );
};

export const CardSkeleton = () => (
    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex justify-between items-start mb-4">
             <div className="flex items-center gap-4">
                 <Skeleton className="w-12 h-12 rounded-xl" />
                 <div className="space-y-2">
                     <Skeleton className="w-32 h-5" />
                     <Skeleton className="w-20 h-3" />
                 </div>
             </div>
             <Skeleton className="w-8 h-8 rounded-full" />
        </div>
        <div className="space-y-2 mt-6">
             <Skeleton className="w-full h-2" />
             <Skeleton className="w-3/4 h-2" />
        </div>
    </div>
)
