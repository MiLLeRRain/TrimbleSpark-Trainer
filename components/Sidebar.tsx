
import React, { useRef, useState, useEffect } from 'react';
import { Category } from '../types';
import { FolderOpen, AlertTriangle, BarChart2, Trash2, Download, Upload, ShieldCheck, ShieldAlert } from 'lucide-react';

interface SidebarProps {
  currentCategory: Category | 'REVIEW';
  onSelectCategory: (cat: Category | 'REVIEW') => void;
  reviewCount: number;
  onResetData: () => void;
  onExportData: () => void;
  onImportData: (file: File) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentCategory, 
  onSelectCategory, 
  reviewCount, 
  onResetData,
  onExportData,
  onImportData
}) => {
  const categories = Object.values(Category);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isKeyActive, setIsKeyActive] = useState(false);

  useEffect(() => {
    // API key is strictly managed via environment variables per guidelines
    setIsKeyActive(!!process.env.API_KEY);
  }, []);

  const handleReset = () => {
    if (window.confirm("Are you sure you want to delete all your history and progress?")) {
      onResetData();
    }
  };

  return (
    <div className="w-64 bg-slate-900 text-slate-100 h-screen flex flex-col fixed left-0 top-0 overflow-y-auto border-r border-slate-700">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-xl font-bold flex items-center gap-2 text-blue-400">
          <BarChart2 className="w-6 h-6 flex-shrink-0" />
          <span className="truncate">TrimbleSpark</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">PySpark Training Platform</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">
          Training Modules
        </div>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onSelectCategory(cat)}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-3 group
              ${currentCategory === cat 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
          >
            <FolderOpen className={`w-4 h-4 ${currentCategory === cat ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'}`} />
            <span className="truncate flex-1">{cat}</span>
          </button>
        ))}

        <div className="mt-8">
          <button
            onClick={() => onSelectCategory('REVIEW')}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-3 justify-between group
              ${currentCategory === 'REVIEW' 
                ? 'bg-amber-600 text-white shadow-md shadow-amber-900/20' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className={`w-4 h-4 ${currentCategory === 'REVIEW' ? 'text-white' : 'text-slate-500 group-hover:text-amber-400'}`} />
              <span className="truncate">Review Mistakes</span>
            </div>
            {reviewCount > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-red-500 text-white">{reviewCount}</span>}
          </button>
        </div>
      </nav>

      {/* API Key Status - Read Only per strict security guidelines */}
      <div className="mx-4 mb-4 p-4 bg-slate-800/50 border border-slate-700 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Environment</span>
          {isKeyActive ? (
            <span className="flex items-center gap-1 text-[10px] font-bold text-green-400 uppercase">
              <ShieldCheck className="w-3 h-3" /> Ready
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 uppercase">
              <ShieldAlert className="w-3 h-3" /> No Key
            </span>
          )}
        </div>
        <p className="text-[9px] text-slate-500 leading-tight">
          System using environment API key for secure processing.
        </p>
      </div>

      <div className="p-4 border-t border-slate-800 space-y-1">
        <button onClick={onExportData} className="w-full flex items-center gap-3 px-3 py-2 text-xs text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors group">
          <Download className="w-4 h-4 text-slate-500 group-hover:text-blue-400" />
          Backup Progress
        </button>
        <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-3 px-3 py-2 text-xs text-slate-400 hover:text-green-400 hover:bg-slate-800 rounded-lg transition-colors group">
          <Upload className="w-4 h-4 text-slate-500 group-hover:text-green-400" />
          Restore Backup
        </button>
        <button onClick={handleReset} className="w-full flex items-center gap-3 px-3 py-2 text-xs text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors group">
          <Trash2 className="w-4 h-4 text-slate-600 group-hover:text-red-400" />
          Clear History
        </button>
        <input type="file" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && onImportData(e.target.files[0])} className="hidden" accept=".json" />
      </div>
    </div>
  );
};
