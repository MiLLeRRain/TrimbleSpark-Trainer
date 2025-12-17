import React, { useRef } from 'react';
import { Category } from '../types';
import { FolderOpen, AlertTriangle, BarChart2, Trash2, Zap, Settings, Download, Upload } from 'lucide-react';

interface SidebarProps {
  currentCategory: Category | 'REVIEW';
  onSelectCategory: (cat: Category | 'REVIEW') => void;
  reviewCount: number;
  onResetData: () => void;
  onOpenSettings: () => void;
  onExportData: () => void;
  onImportData: (file: File) => void;
  isConnected: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentCategory, 
  onSelectCategory, 
  reviewCount, 
  onResetData,
  onOpenSettings,
  onExportData,
  onImportData,
  isConnected,
}) => {
  const categories = Object.values(Category);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleReset = () => {
    if (window.confirm("Are you sure you want to delete all your history and progress? This cannot be undone.")) {
      onResetData();
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportData(file);
    }
    // Reset value so same file can be selected again if needed
    if (e.target.value) e.target.value = '';
  };

  return (
    <div className="w-64 bg-slate-900 text-slate-100 h-screen flex flex-col fixed left-0 top-0 overflow-y-auto border-r border-slate-700">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-xl font-bold flex items-center gap-2 text-blue-400">
          <BarChart2 className="w-6 h-6" />
          TrimbleSpark
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
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2
              ${currentCategory === cat 
                ? 'bg-blue-600 text-white' 
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
          >
            <FolderOpen className="w-4 h-4" />
            <span className="truncate">{cat}</span>
          </button>
        ))}

        <div className="mt-8">
           <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">
            Personal Growth
          </div>
          <button
            onClick={() => onSelectCategory('REVIEW')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 justify-between
              ${currentCategory === 'REVIEW' 
                ? 'bg-amber-600 text-white' 
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Review Mistakes</span>
            </div>
            {reviewCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                {reviewCount}
              </span>
            )}
          </button>
        </div>
      </nav>

      <div className="p-4 border-t border-slate-800 space-y-2">
        {/* System Status Indicator */}
        <div className="flex items-center justify-between bg-slate-800 rounded px-3 py-2 mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-xs font-medium text-slate-300">
              Gemini Service
            </span>
          </div>
          {isConnected && <Zap className="w-3 h-3 text-yellow-400 fill-current" />}
        </div>
        
        <button 
          onClick={onOpenSettings}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
        >
          <Settings className="w-3 h-3" />
          API Settings
        </button>

        {/* Data Management Section */}
        <div className="pt-2 border-t border-slate-800 mt-2 space-y-1">
          <div className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1 px-2">Data Management</div>
          
          <button 
            onClick={onExportData}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded transition-colors"
          >
            <Download className="w-3 h-3" />
            Backup Progress
          </button>

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept=".json"
          />
          <button 
            onClick={handleImportClick}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-green-400 hover:bg-slate-800 rounded transition-colors"
          >
            <Upload className="w-3 h-3" />
            Restore Progress
          </button>

          <button 
            onClick={handleReset}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            Clear All Data
          </button>
        </div>
        
      </div>
    </div>
  );
};