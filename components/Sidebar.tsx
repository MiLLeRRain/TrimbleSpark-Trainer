
import React, { useRef, useState, useEffect } from 'react';
import { Category } from '../types';
import { listAvailableModels } from '../services/geminiService';
import { getSelectedModel, getStoredApiKeys, saveApiKeys, saveSelectedModel } from '../services/apiKeyStore';
import { FolderOpen, AlertTriangle, BarChart2, Trash2, Download, Upload, ShieldCheck, ShieldAlert, Key, RefreshCw } from 'lucide-react';

interface SidebarProps {
  currentCategory: Category | 'REVIEW';
  onSelectCategory: (cat: Category | 'REVIEW') => void;
  reviewCount: number;
  onResetData: () => void;
  onExportData: () => void;
  onImportData: (file: File) => void;
}

// Fix: Removed redundant AIStudio interface and declare global block.
// The environment provides these types globally, and redeclaring them with 
// a local interface causes subsequent property declaration errors.

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
  const [apiKeysInput, setApiKeysInput] = useState("");
  const [savedKeyCount, setSavedKeyCount] = useState(0);
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModelState] = useState("");
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

  const loadModels = async (preferredModel?: string | null) => {
    setIsLoadingModels(true);
    setModelError(null);
    try {
      const available = await listAvailableModels();
      setModels(available);
      const candidate = preferredModel || selectedModel;
      if (!available.includes(candidate)) {
        const nextModel = available[0] || "";
        if (nextModel) {
          setSelectedModelState(nextModel);
          saveSelectedModel(nextModel);
        }
      } else if (candidate && candidate !== selectedModel) {
        setSelectedModelState(candidate);
      }
    } catch (e) {
      setModelError("Failed to load models.");
    } finally {
      setIsLoadingModels(false);
    }
  };

  useEffect(() => {
    const storedKeys = getStoredApiKeys();
    setSavedKeyCount(storedKeys.length);
    setIsKeyActive(storedKeys.length > 0);
    setApiKeysInput("");

    const storedModel = getSelectedModel();
    if (storedModel) setSelectedModelState(storedModel);

    loadModels(storedModel);

    const handleKeyError = () => {
      setIsKeyActive(false);
    };
    window.addEventListener('gemini:keyError', handleKeyError);
    return () => window.removeEventListener('gemini:keyError', handleKeyError);
  }, []);

  const handleSaveKeys = () => {
    const keys = apiKeysInput
      .split(/[\n,]+/g)
      .map((key) => key.trim())
      .filter((key) => key.length > 0);
    saveApiKeys(keys);
    setSavedKeyCount(keys.length);
    setIsKeyActive(keys.length > 0);
    setApiKeysInput("");
    setIsKeyModalOpen(false);
    loadModels();
  };

  const handleModelChange = (model: string) => {
    setSelectedModelState(model);
    saveSelectedModel(model);
  };

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

      <div className="mx-4 mb-4 p-4 bg-slate-800/50 border border-slate-700 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Credentials</span>
          {isKeyActive ? (
            <span className="flex items-center gap-1 text-[10px] font-bold text-green-400 uppercase">
              <ShieldCheck className="w-3 h-3" /> Active
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 uppercase">
              <ShieldAlert className="w-3 h-3" /> Setup Required
            </span>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Gemini API Keys</label>
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>{savedKeyCount > 0 ? `${savedKeyCount} saved` : "None saved"}</span>
            <button
              onClick={() => setIsKeyModalOpen(true)}
              className="text-blue-400 hover:underline"
            >
              {savedKeyCount > 0 ? "Update" : "Add"}
            </button>
          </div>
          <input
            type="password"
            value={savedKeyCount > 0 ? "saved" : ""}
            readOnly
            placeholder="No keys saved"
            className="w-full rounded-lg bg-slate-900/60 text-slate-500 text-[11px] p-2 border border-slate-700"
          />
          <p className="text-[9px] text-slate-500 leading-tight">
            Keys are stored locally and rotated on each request.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Model</label>
            <button
              onClick={loadModels}
              className="text-[9px] text-blue-400 hover:underline flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${isLoadingModels ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
          <select
            value={selectedModel}
            onChange={(e) => handleModelChange(e.target.value)}
            className="w-full rounded-lg bg-slate-900/60 text-slate-200 text-[11px] p-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            {models.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
          {modelError && (
            <div className="text-[9px] text-amber-400">{modelError}</div>
          )}
        </div>
      </div>

      {isKeyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
              <h3 className="text-sm font-bold text-slate-200">Add Gemini API Keys</h3>
              <button
                onClick={() => setIsKeyModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-sm"
              >
                Close
              </button>
            </div>
            <div className="p-5 space-y-3">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                One key per line
              </label>
              <textarea
                value={apiKeysInput}
                onChange={(e) => setApiKeysInput(e.target.value)}
                placeholder="Paste one or more keys"
                rows={6}
                className="w-full resize-none rounded-lg bg-slate-950 text-slate-200 text-[12px] p-3 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setIsKeyModalOpen(false)}
                  className="px-4 py-2 text-[11px] font-bold text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveKeys}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold rounded-lg flex items-center gap-2"
                >
                  <Key className="w-3 h-3" /> Save Keys
                </button>
              </div>
              <p className="text-[9px] text-slate-500">
                Keys never leave your browser and are stored in localStorage.
              </p>
            </div>
          </div>
        </div>
      )}

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
