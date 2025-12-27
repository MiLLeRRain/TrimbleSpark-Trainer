import React, { useState, useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';
import { setupMonacoPySpark } from '../services/monacoSetup';
import { ExamSession, EvaluationResponse, Exercise } from '../types';
import { Loader2, ChevronRight, Trophy, Clock, CheckCircle2, XCircle, AlertCircle, Maximize2, Minimize2 } from 'lucide-react';

interface ExamViewProps {
  session: ExamSession;
  onQuestionSubmit: (code: string) => Promise<void>;
  onFinish: () => void;
  isLoadingNext: boolean;
}

export const ExamView: React.FC<ExamViewProps> = ({ session, onQuestionSubmit, onFinish, isLoadingNext }) => {
  const currentQuestion = session.questions[session.currentIndex];
  const [isMaximized, setIsMaximized] = useState(false);
  
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const progress = ((session.currentIndex + 1) / 10) * 100;

  useEffect(() => {
    setupMonacoPySpark();
  }, []);

  useEffect(() => {
    if (containerRef.current && !editorRef.current) {
      editorRef.current = monaco.editor.create(containerRef.current, {
        value: "from pyspark.sql import SparkSession\nfrom pyspark.sql.functions import *\n\n# Write your code here to transform 'df'\ndef solution (df): \n    # Your logic here\n    return result\n",
        language: 'python',
        theme: 'vs-dark',
        automaticLayout: true,
        fontSize: 14,
        fontFamily: "'Fira Code', monospace",
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        padding: { top: 0, bottom: 0 }, // 彻底移除 padding
        autoClosingBrackets: 'always',
        tabSize: 4,
      });

      // Command: Ctrl+D for Duplicate
      editorRef.current.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyD, () => {
        const editor = editorRef.current;
        if (!editor) return;
        const position = editor.getPosition();
        if (position) {
          const line = editor.getModel()?.getLineContent(position.lineNumber);
          editor.executeEdits('duplicate', [{
            range: new monaco.Range(position.lineNumber + 1, 1, position.lineNumber + 1, 1),
            text: line + '\n'
          }]);
        }
      });
    }

    if (editorRef.current) {
      editorRef.current.setValue("from pyspark.sql import SparkSession\nfrom pyspark.sql.functions import *\n\n# Write your code here to transform 'df'\ndef solution (df): \n    # Your logic here\n    return result\n");
    }
  }, [session.currentIndex]);

  const handleNextAction = async () => { 
    const code = editorRef.current?.getValue() || "";
    await onQuestionSubmit(code); 
  };

  if (session.isFinished) {
    const correctCount = (Object.values(session.results) as EvaluationResponse[]).filter(r => r.isCorrect).length;
    const score = Math.round((correctCount / 10) * 100);
    const duration = Math.round((Date.now() - session.startTime) / 60000);

    return (
      <div className="h-full overflow-y-auto p-12 flex flex-col items-center bg-slate-50 animate-fade-in">
        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl border border-slate-200 p-10 text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-blue-50 rounded-full mb-6"><Trophy className="w-12 h-12 text-blue-600" /></div>
          <h2 className="text-4xl font-black text-slate-900 mb-2">Exam Result</h2>
          <p className="text-slate-500 mb-8">Trimble PySpark Certification Drill: {session.category}</p>
          <div className="grid grid-cols-3 gap-6 mb-10">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="text-xs font-bold text-slate-400 uppercase mb-1">Score</div>
              <div className={`text-3xl font-black ${score >= 60 ? 'text-green-600' : 'text-red-600'}`}>{score}</div>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="text-xs font-bold text-slate-400 uppercase mb-1">Correct</div>
              <div className="text-3xl font-black text-slate-800">{correctCount}/10</div>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="text-xs font-bold text-slate-400 uppercase mb-1">Time</div>
              <div className="text-3xl font-black text-slate-800">{duration}m</div>
            </div>
          </div>
          <button onClick={onFinish} className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg">Finish Exam</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      <div className="bg-slate-900 text-white p-4 px-8 flex justify-between items-center shadow-lg z-20 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest animate-pulse">Exam Mode</div>
          <h2 className="font-bold text-lg">{session.category}</h2>
        </div>
        <div className="text-sm font-bold bg-slate-800 px-4 py-1.5 rounded-full border border-slate-700">
          Question <span className="text-blue-400">{session.currentIndex + 1}</span> <span className="text-slate-500 mx-1">/</span> 10
        </div>
      </div>

      <div className="h-1.5 w-full bg-slate-800 flex-shrink-0">
        <div className="h-full bg-blue-500 transition-all duration-700 ease-out" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden lg:flex-row">
        <div className={`transition-all duration-500 ease-in-out border-r border-slate-200 overflow-y-auto custom-scrollbar bg-slate-50 ${isMaximized ? 'w-0 opacity-0 overflow-hidden invisible' : 'w-full lg:w-[35%] p-8'}`}>
           <div className="space-y-6">
              <div>
                <div className="inline-block bg-blue-50 text-blue-600 text-[10px] font-black px-2 py-0.5 rounded uppercase mb-2">Level: {currentQuestion.difficulty}</div>
                <h3 className="text-2xl font-black text-slate-900 leading-tight">{currentQuestion.title}</h3>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <p className="whitespace-pre-wrap text-slate-700 text-sm leading-relaxed">{currentQuestion.description}</p>
              </div>
              <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/50">
                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Requirement</h4>
                <p className="text-sm text-indigo-900 font-medium">{currentQuestion.expectedOutputDescription}</p>
              </div>
           </div>
        </div>

        <div className={`flex flex-col bg-[#1e1e1e] relative transition-all duration-500 ease-in-out ${isMaximized ? 'w-full' : 'w-full lg:w-[65%]'}`}>
          <div className="bg-[#252526] p-3 flex justify-between items-center text-[10px] text-slate-500 px-6 font-bold uppercase tracking-widest border-b border-white/5">
            <div className="flex items-center gap-4">
              <span className="text-blue-400">Editor</span>
              <span className="text-slate-500">PySpark Environment</span>
            </div>
            <button onClick={() => setIsMaximized(!isMaximized)} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors bg-white/5 px-2 py-1 rounded">
              {isMaximized ? <><Minimize2 className="w-3 h-3" /> Restore Split</> : <><Maximize2 className="w-3 h-3" /> Focus Mode</>}
            </button>
          </div>
          
          <div ref={containerRef} className="flex-1 w-full overflow-hidden" />

          <div className="p-6 bg-[#252526] border-t border-white/5 flex justify-between items-center">
            <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2"><AlertCircle className="w-3 h-3" /> Progress auto-saved</div>
            <button onClick={handleNextAction} disabled={isLoadingNext} className="px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-sm flex items-center gap-3 transition-all shadow-xl disabled:bg-slate-800">
              {isLoadingNext ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{session.currentIndex === 9 ? 'Submit Exam' : 'Next Question'}<ChevronRight className="w-4 h-4" /></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};