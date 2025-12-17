import React, { useState, useEffect } from 'react';
import { Exercise, ExerciseStatus, GeneratedExerciseResponse, EvaluationResponse } from '../types';
import { Play, Check, X, RefreshCw, ChevronRight, CheckCircle } from 'lucide-react';

interface ExerciseCardProps {
  exercise: Exercise;
  onUpdateStatus: (id: string, status: ExerciseStatus, userCode: string, feedback: string) => void;
  onNext: () => void;
  evaluator: (exercise: GeneratedExerciseResponse, userCode: string) => Promise<EvaluationResponse>;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({ exercise, onUpdateStatus, onNext, evaluator }) => {
  const [code, setCode] = useState(exercise.userCode || "from pyspark.sql import SparkSession\nfrom pyspark.sql.functions import *\n\n# Write your code here to transform 'df'\nresult_df = ");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [localFeedback, setLocalFeedback] = useState<string | null>(exercise.feedback || null);
  const [showSolution, setShowSolution] = useState(false);
  
  // Reset local state when exercise ID changes
  useEffect(() => {
    setCode(exercise.userCode || "from pyspark.sql import SparkSession\nfrom pyspark.sql.functions import *\n\n# Write your code here to transform 'df'\nresult_df = ");
    setLocalFeedback(exercise.feedback || null);
    setShowSolution(false);
  }, [exercise.id]);

  const handleSubmit = async () => {
    setIsEvaluating(true);
    setLocalFeedback(null);
    setShowSolution(false);

    try {
      // Re-construct the generator response shape for the evaluator
      const genResponse: GeneratedExerciseResponse = {
        title: exercise.title,
        description: exercise.description,
        inputSchema: exercise.inputSchema,
        sampleData: exercise.sampleData,
        expectedOutputDescription: exercise.expectedOutputDescription,
        standardSolution: exercise.standardSolution
      };

      const result = await evaluator(genResponse, code);
      
      setLocalFeedback(result.feedback);
      
      const newStatus = result.isCorrect ? ExerciseStatus.CORRECT : ExerciseStatus.REVIEW;
      onUpdateStatus(exercise.id, newStatus, code, result.feedback);
      
      if (!result.isCorrect) {
        // Automatically show helpful hints/solution if wrong? No, let user decide to see solution.
      }

    } catch (e) {
      console.error(e);
      setLocalFeedback("Error evaluating code. Check console or API settings.");
    } finally {
      setIsEvaluating(false);
    }
  };

  const getStatusColor = () => {
    switch (exercise.status) {
      case ExerciseStatus.CORRECT: return 'border-green-500 bg-green-50';
      case ExerciseStatus.REVIEW: return 'border-red-500 bg-red-50';
      default: return 'border-slate-200 bg-white';
    }
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto p-6 gap-6">
      
      {/* Header Area */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-semibold uppercase">{exercise.category}</span>
            <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded font-semibold uppercase">{exercise.difficulty}</span>
            {exercise.status === ExerciseStatus.CORRECT && <span className="flex items-center gap-1 text-green-600 text-sm font-bold"><Check className="w-4 h-4" /> Solved</span>}
            {exercise.status === ExerciseStatus.REVIEW && <span className="flex items-center gap-1 text-red-600 text-sm font-bold"><AlertTriangleIcon /> Needs Review</span>}
          </div>
          <h2 className="text-2xl font-bold text-slate-800">{exercise.title}</h2>
        </div>
        
        {exercise.status === ExerciseStatus.CORRECT && (
          <button onClick={onNext} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-all shadow-sm">
            Next Exercise <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        
        {/* Left Column: Problem Description */}
        <div className="flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-2">Scenario</h3>
            <p className="text-slate-600 leading-relaxed text-sm whitespace-pre-wrap">{exercise.description}</p>
          </div>

          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
            <h3 className="font-semibold text-slate-800 mb-2 text-sm">Input Data Schema</h3>
            <pre className="text-xs text-slate-600 bg-white p-3 rounded border border-slate-200 overflow-x-auto">
              {exercise.inputSchema}
            </pre>
            
            <h3 className="font-semibold text-slate-800 mt-4 mb-2 text-sm">Sample Data</h3>
            <pre className="text-xs text-slate-600 bg-white p-3 rounded border border-slate-200 overflow-x-auto">
              {exercise.sampleData}
            </pre>
          </div>

          <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-100">
             <h3 className="font-semibold text-indigo-900 mb-2 text-sm">Goal</h3>
             <p className="text-indigo-800 text-sm">{exercise.expectedOutputDescription}</p>
          </div>
        </div>

        {/* Right Column: Editor & Feedback */}
        <div className="flex flex-col gap-4 h-full">
          <div className="flex-1 flex flex-col relative rounded-xl overflow-hidden border border-slate-300 shadow-sm bg-slate-900">
            <div className="bg-slate-800 px-4 py-2 flex justify-between items-center text-slate-400 text-xs border-b border-slate-700">
              <span>solution.py</span>
              <span>PySpark</span>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="flex-1 w-full bg-slate-900 text-slate-100 p-4 font-mono text-sm resize-none focus:outline-none leading-relaxed custom-scrollbar"
              spellCheck={false}
            />
            <div className="p-3 bg-slate-800 border-t border-slate-700 flex justify-end gap-3">
               <button 
                onClick={() => setShowSolution(!showSolution)}
                className="px-4 py-2 text-slate-300 hover:text-white text-sm font-medium transition-colors"
              >
                {showSolution ? "Hide Answer" : "Peek Answer"}
              </button>
              <button
                onClick={handleSubmit}
                disabled={isEvaluating}
                className={`px-6 py-2 rounded-lg text-sm font-bold text-white flex items-center gap-2 transition-all
                  ${isEvaluating ? 'bg-slate-600 cursor-wait' : 'bg-blue-600 hover:bg-blue-500 hover:shadow-lg hover:-translate-y-0.5'}
                `}
              >
                {isEvaluating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                {isEvaluating ? 'AI Checking...' : 'Run & Check'}
              </button>
            </div>
          </div>

          {/* Feedback Section */}
          {(localFeedback || showSolution) && (
            <div className={`p-5 rounded-xl border animate-fade-in ${getStatusColor()} shadow-sm`}>
              
              {localFeedback && (
                <div className="mb-4">
                  <h3 className="font-bold flex items-center gap-2 mb-2">
                    {exercise.status === ExerciseStatus.CORRECT 
                      ? <><CheckCircle className="w-5 h-5 text-green-600" /> <span className="text-green-800">Excellent!</span></>
                      : <><X className="w-5 h-5 text-red-600" /> <span className="text-red-800">Keep Trying / Review</span></>
                    }
                  </h3>
                  <div className="prose prose-sm max-w-none text-slate-700">
                    <p>{localFeedback}</p>
                  </div>
                </div>
              )}

              {showSolution && (
                <div className="mt-4 pt-4 border-t border-slate-200/50">
                  <h4 className="font-semibold text-slate-800 mb-2 text-sm">Standard Solution</h4>
                  <pre className="bg-slate-800 text-blue-100 p-3 rounded-lg text-xs overflow-x-auto border border-slate-700">
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

const AlertTriangleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
);