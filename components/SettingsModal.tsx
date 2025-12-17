import React, { useState, useEffect } from 'react';
import { AppSettings } from '../types';
import { X, Save, Key } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave }) => {
  const [formData, setFormData] = useState<AppSettings>(settings);

  useEffect(() => {
    setFormData(settings);
  }, [settings, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
        <div className="bg-slate-900 p-4 flex justify-between items-center border-b border-slate-700">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            Platform Settings
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <Key className="w-5 h-5 text-blue-600" />
              <label className="text-sm font-bold text-blue-900 uppercase">Google Gemini API Key</label>
            </div>
            
            <p className="text-xs text-blue-700 mb-2 leading-relaxed">
              This app runs entirely in your browser.
              Paste your personal API key here to connect to Gemini.
            </p>

            <input 
               type="password"
              placeholder="Paste your Google AI Studio Key"
               value={formData.geminiApiKey}
               onChange={(e) => setFormData({...formData, geminiApiKey: e.target.value})}
               className="w-full bg-white border border-blue-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-700"
            />
          </div>
          
          <div className="text-xs text-slate-400 text-center">
            Get a key at <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" className="underline hover:text-blue-500">Google AI Studio</a>
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => onSave(formData)}
            className="px-6 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Key
          </button>
        </div>
      </div>
    </div>
  );
};