
import React, { useRef, useState } from 'react';
import { Upload, X, FileText, Image as ImageIcon, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSizeMB?: number;
  label?: string;
  previewUrl?: string; // Optional existing preview
  onClear?: () => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ 
  onFileSelect, 
  accept = "image/*", 
  maxSizeMB = 2,
  label = "Upload File",
  previewUrl,
  onClear
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(previewUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  };

  const validateAndSetFile = (file: File) => {
    setError(null);
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size must be less than ${maxSizeMB}MB`);
      return;
    }
    
    setSelectedFile(file);
    onFileSelect(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setLocalPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setLocalPreview(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setLocalPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (onClear) onClear();
  };

  return (
    <div className="w-full">
      <AnimatePresence mode='wait'>
        {localPreview ? (
           <motion.div 
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             exit={{ opacity: 0, scale: 0.95 }}
             className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 group h-48 bg-slate-50 dark:bg-slate-900 flex items-center justify-center"
           >
              <img src={localPreview} alt="Preview" className="h-full w-full object-contain p-2" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                 <button 
                   onClick={clearFile}
                   className="p-2 bg-white rounded-full text-red-500 hover:text-red-600 shadow-lg transform hover:scale-110 transition-all"
                 >
                    <X size={20} />
                 </button>
              </div>
              <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/50 backdrop-blur text-white text-xs rounded-lg">
                {selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : 'Current Logo'}
              </div>
           </motion.div>
        ) : (
          <div
            className={cn(
              "relative border-2 border-dashed rounded-2xl p-8 transition-all duration-200 ease-in-out flex flex-col items-center justify-center text-center cursor-pointer min-h-[12rem]",
              isDragging 
                ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/10" 
                : "border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-slate-50 dark:bg-slate-900"
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              onChange={handleChange}
              className="hidden"
            />
            
            <div className={cn("p-4 rounded-full mb-4 transition-colors", isDragging ? "bg-indigo-100 text-indigo-600" : "bg-white dark:bg-slate-800 text-slate-400")}>
               <Upload size={32} />
            </div>
            
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
              {isDragging ? "Drop to upload" : label}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {selectedFile ? selectedFile.name : `Drag & drop or click to browse (Max ${maxSizeMB}MB)`}
            </p>
            
            {error && (
              <p className="text-xs text-red-500 mt-3 font-medium bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
                {error}
              </p>
            )}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
