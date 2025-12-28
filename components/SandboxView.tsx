import React, { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';
import { setupMonacoPySpark } from '../services/monacoSetup';
import { RotateCcw } from 'lucide-react';

const DEFAULT_CODE = `from pyspark.sql import functions as F

# Sandbox playground
# Load your data into "df" and transform it as needed.
result_df = `;

const SANDBOX_STORAGE_KEY = 'sandbox:code';

export const SandboxView: React.FC = () => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setupMonacoPySpark();

    if (containerRef.current && !editorRef.current) {
      const saved = localStorage.getItem(SANDBOX_STORAGE_KEY);
      const initialValue = saved && saved.trim().length > 0 ? saved : DEFAULT_CODE;

      editorRef.current = monaco.editor.create(containerRef.current, {
        value: initialValue,
        language: 'python',
        theme: 'vs-dark',
        automaticLayout: true,
        fontSize: 14,
        fontFamily: "'Fira Code', 'Courier New', monospace",
        minimap: { enabled: true },
        scrollBeyondLastLine: false,
        lineNumbers: 'on',
        renderLineHighlight: 'all',
        wordWrap: 'on',
        padding: { top: 0, bottom: 0 },
        autoClosingBrackets: 'always',
        autoClosingQuotes: 'always',
        tabSize: 4,
        fixedOverflowWidgets: true,
      });

      editorRef.current.onDidChangeModelContent(() => {
        const value = editorRef.current?.getValue() || '';
        localStorage.setItem(SANDBOX_STORAGE_KEY, value);
      });

      requestAnimationFrame(() => editorRef.current?.layout());
    }

    return () => {
      if (editorRef.current) {
        editorRef.current.dispose();
        editorRef.current = null;
      }
    };
  }, []);

  const handleReset = () => {
    editorRef.current?.setValue(DEFAULT_CODE);
    localStorage.setItem(SANDBOX_STORAGE_KEY, DEFAULT_CODE);
  };

  return (
    <div className="flex flex-col h-full max-w-full mx-auto p-8 gap-4 overflow-hidden">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sandbox</div>
          <h2 className="text-2xl font-black text-slate-800 leading-tight">Instant Editor</h2>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </button>
      </div>

      <div className="flex-1 flex flex-col relative rounded-2xl overflow-hidden border border-slate-300 shadow-sm bg-[#1e1e1e]">
        <div className="bg-[#252526] px-4 py-2 flex justify-between items-center text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-blue-400">sandbox.py</span>
            <span className="text-slate-500">Freeform Playground</span>
          </div>
        </div>
        <div ref={containerRef} className="flex-1 w-full overflow-hidden" />
      </div>
    </div>
  );
};
