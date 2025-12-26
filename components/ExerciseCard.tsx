
import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as monaco from 'monaco-editor';
import { setupMonacoPySpark } from '../services/monacoSetup';
import { Exercise, ExerciseStatus, GeneratedExerciseResponse, EvaluationResponse } from '../types';
import { Play, Check, X, RefreshCw, ChevronRight, CheckCircle, Loader2, Maximize2, Minimize2, Terminal, Database, Target } from 'lucide-react';

interface ExerciseCardProps {
  exercise: Exercise;
  onUpdateStatus: (id: string, status: ExerciseStatus, userCode: string, feedback: string) => void;
  onNext: () => void | Promise<void>;
  evaluator: (exercise: GeneratedExerciseResponse, userCode: string) => Promise<EvaluationResponse>;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({ exercise, onUpdateStatus, onNext, evaluator }) => {
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isNextLoading, setIsNextLoading] = useState(false);
  const [localFeedback, setLocalFeedback] = useState<string | null>(exercise.feedback || null);
  const [showSolution, setShowSolution] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastExerciseId = useRef<string | null>(null);

  // 初始化编辑器（仅运行一次）
  useEffect(() => {
    setupMonacoPySpark();
    
    if (containerRef.current && !editorRef.current) {
      editorRef.current = monaco.editor.create(containerRef.current, {
        value: exercise.userCode || "from pyspark.sql import SparkSession\nfrom pyspark.sql.functions import *\n\n# Write your code here to transform 'df'\nresult_df = ",
        language: 'python',
        theme: 'vs-dark',
        automaticLayout: true,
        fontSize: 14,
        fontFamily: "'Fira Code', monospace",
        minimap: { enabled: true },
        scrollBeyondLastLine: false,
        lineNumbers: 'on',
        padding: { top: 16, bottom: 16 },
        autoClosingBrackets: 'always',
        tabSize: 4,
      });

      // 注册常用命令
      editorRef.current.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyD, () => {
        editorRef.current?.trigger('keyboard', 'editor.action.copyLinesDownAction', null);
      });
    }

    return () => {
      if (editorRef.current) {
        editorRef.current.dispose();
        editorRef.current = null;
      }
    };
  }, []);

  // 仅在题目切换时更新编辑器内容，防止编辑时内容被重置
  useEffect(() => {
    if (editorRef.current && exercise.id !== lastExerciseId.current) {
      const newValue = exercise.userCode || "from pyspark.sql import SparkSession\nfrom pyspark.sql.functions import *\n\n# Write your code here to transform 'df'\nresult_df = ";
      editorRef.current.setValue(newValue);
      lastExerciseId.current = exercise.id;
      
      // 布局重置
      setTimeout(() => editorRef.current?.layout(), 50);
    }
    
    setLocalFeedback(exercise.feedback || null);
    setShowSolution(false);
    setIsNextLoading(false);
  }, [exercise.id]);

  // 监听全屏模式切换，强制刷新编辑器布局
  useEffect(() => {
    setTimeout(() => editorRef.current?.layout(), 300);
  }, [isMaximized]);

  const formattedSampleData = useMemo(() => {
    try {
      if (exercise.sampleData.includes('\n')) return exercise.sampleData;
      const parsed = JSON.parse(exercise.sampleData);
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      return exercise.sampleData;
    }
  }, [exercise.sampleData]);

  const handleSubmit = async () => {
    const code = editorRef.current?.getValue() || "";
    setIsEvaluating(true);
    setLocalFeedback(null);
    setShowSolution(false);

    try {
      const genResponse: GeneratedExerciseResponse = {
        title: exercise.title,
        description: exercise.description,
        inputSchema: exercise.inputSchema,
        sampleData: exercise.sampleData,
        expectedOutputDescription: exercise.expectedOutputDescription,
        expectedOutputExample: exercise.expectedOutputExample,
        standardSolution: exercise.standardSolution
      };
      const result = await evaluator(genResponse, code);
      setLocalFeedback(result.feedback);
      const newStatus = result.isCorrect ? ExerciseStatus.CORRECT : ExerciseStatus.REVIEW;
      onUpdateStatus(exercise.id, newStatus, code, result.feedback);
    } catch (e) {
      setLocalFeedback("Evaluation failed.");
    } finally { setIsEvaluating(false); }
  };

  return (
    <div className="flex flex-col h-full max-w-full mx-auto p-8 gap-6 overflow-hidden">
      <div className="flex justify-between items-start flex-shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded font-bold uppercase">{exercise.category}</span>
            <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded font-bold uppercase">{exercise.difficulty}</span>
            {exercise.status === ExerciseStatus.CORRECT && <span className="flex items-center gap-1 text-green-600 text-sm font-bold"><Check className="w-4 h-4" /> Solved</span>}
          </div>
          <h2 className="text-2xl font-black text-slate-800 leading-tight">{exercise.title}</h2>
        </div>
        
        {exercise.status === ExerciseStatus.CORRECT && (
          <button onClick={() => { setIsNextLoading(true); onNext(); }} disabled={isNextLoading} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 font-bold transition-all shadow-lg shadow-blue-900/20 disabled:bg-slate-400">
            {isNextLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />} Next Exercise
          </button>
        )}
      </div>

      <div className={`grid grid-cols-1 transition-all duration-500 ease-in-out flex-1 min-h-0 ${isMaximized ? 'lg:grid-cols-[0px_1fr]' : 'lg:grid-cols-[40%_1fr] gap-6'}`}>
        <div className={`flex flex-col gap-5 overflow-y-auto pr-2 custom-scrollbar transition-all duration-500 ${isMaximized ? 'opacity-0 invisible pointer-events-none' : 'opacity-100 visible'}`}>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Terminal className="w-3.5 h-3.5" /> Scenario</h3>
            <p className="text-slate-700 leading-relaxed text-sm whitespace-pre-wrap">{exercise.description}</p>
          </div>
          
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
            <div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Database className="w-3 h-3" /> Input Schema</h3>
              <pre className="text-[11px] text-blue-900 bg-white p-4 rounded-xl border border-slate-200 overflow-x-auto font-mono">{exercise.inputSchema}</pre>
            </div>
            <div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Database className="w-3 h-3" /> Sample Data (Initial)</h3>
              <pre className="text-[11px] text-slate-600 bg-white p-4 rounded-xl border border-slate-200 overflow-x-auto font-mono">{formattedSampleData}</pre>
            </div>
          </div>

          <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100/50 space-y-3">
             <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2"><Target className="w-3.5 h-3.5" /> Goal</h3>
             <p className="text-indigo-900 text-sm font-semibold">{exercise.expectedOutputDescription}</p>
             <div className="mt-2">
               <h4 className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1.5">Target Result (Example)</h4>
               <div className="bg-indigo-100/30 rounded-xl border border-indigo-200/50 p-4 overflow-x-auto">
                  <pre className="text-[11px] text-indigo-800 font-mono whitespace-pre leading-tight tracking-normal" style={{ fontVariantLigatures: 'none' }}>
                    {exercise.expectedOutputExample}
                  </pre>
               </div>
             </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 h-full min-w-0">
          <div className="flex-1 flex flex-col relative rounded-2xl overflow-hidden border border-slate-300 shadow-sm bg-[#1e1e1e]">
            <div className="bg-[#252526] px-4 py-2 flex justify-between items-center text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-white/10 z-10">
              <div className="flex items-center gap-3"><span className="text-blue-400">solution.py</span><span className="text-slate-500">IntelliSense Active</span></div>
              <button onClick={() => setIsMaximized(!isMaximized)} className="flex items-center gap-1.5 hover:text-white transition-colors px-2 py-1 rounded bg-white/5">
                {isMaximized ? <><Minimize2 className="w-3 h-3" /> Restore Split</> : <><Maximize2 className="w-3 h-3" /> Focus Mode</>}
              </button>
            </div>
            <div ref={containerRef} className="flex-1 w-full overflow-hidden" />
            <div className="p-4 bg-[#252526] border-t border-white/10 flex justify-between items-center z-10">
              <button onClick={() => setShowSolution(!showSolution)} className="px-4 py-2 text-slate-400 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors">
                {showSolution ? "Hide Answer" : "Peek Answer"}
              </button>
              <button onClick={handleSubmit} disabled={isEvaluating} className="px-8 py-2.5 rounded-xl text-sm font-black text-white bg-blue-600 hover:bg-blue-500 transition-all flex items-center gap-2 shadow-xl">
                {isEvaluating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                {isEvaluating ? 'Checking...' : 'Check Code'}
              </button>
            </div>
          </div>

          {(localFeedback || showSolution) && (
            <div className={`p-6 rounded-2xl border animate-fade-in bg-white shadow-sm overflow-y-auto max-h-[300px] flex-shrink-0 custom-scrollbar`}>
              {localFeedback && (
                <div className="mb-4">
                  <h3 className="font-bold flex items-center gap-2 mb-3">
                    {exercise.status === ExerciseStatus.CORRECT 
                      ? <><CheckCircle className="w-5 h-5 text-green-600" /> <span className="text-green-800">Mastered!</span></>
                      : <><X className="w-5 h-5 text-red-600" /> <span className="text-red-800">Review Required</span></>
                    }
                  </h3>
                  <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap italic bg-slate-50 p-4 rounded-xl border border-black/5">{localFeedback}</div>
                </div>
              )}
              {showSolution && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase mb-3">Ideal Solution</h4>
                  <pre className="bg-slate-950 text-blue-50 p-6 rounded-2xl text-sm overflow-x-auto font-mono leading-relaxed whitespace-pre-wrap">
                    <code>{exercise.standardSolution}</code>
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
