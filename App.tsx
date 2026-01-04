
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ExerciseCard } from './components/ExerciseCard';
import { SandboxView } from './components/SandboxView';
import { ExamView } from './components/ExamView';
import { Category, Difficulty, Exercise, ExerciseStatus, PointCloudTopic, GeospatialTopic, ExamSession } from './types';
import { generateExercise, evaluateSubmission } from './services/geminiService';
import { storageService } from './services/storage';
import { Sparkles, Loader2, BookOpen, GraduationCap, ArrowLeft, AlertCircle, History, PlayCircle } from 'lucide-react';

export default function App() {
  const [currentCategory, setCurrentCategory] = useState<Category | 'REVIEW'>(Category.POINT_CLOUD);
  const [currentTopic, setCurrentTopic] = useState<string>(PointCloudTopic.MIXED);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentExerciseId, setCurrentExerciseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.BEGINNER);
  const [isStorageLoaded, setIsStorageLoaded] = useState(false);
  const [isSandboxOpen, setIsSandboxOpen] = useState(false);
  
  const [examSession, setExamSession] = useState<ExamSession | null>(null);
  const [examLoading, setExamLoading] = useState(false);

  useEffect(() => {
    const savedData = storageService.load();
    if (savedData && savedData.length > 0) setExercises(savedData);
    setIsStorageLoaded(true);
  }, []);

  useEffect(() => {
    if (isStorageLoaded) storageService.save(exercises);
  }, [exercises, isStorageLoaded]);

  const handleCreateExercise = async () => {
    if (currentCategory === 'REVIEW') return;
    setLoading(true);
    try {
      const topicToUse = (currentCategory === Category.POINT_CLOUD || currentCategory === Category.GEOSPATIAL) ? currentTopic : undefined;
      const generated = await generateExercise(currentCategory, difficulty, topicToUse);
      const newEx: Exercise = {
        id: crypto.randomUUID(),
        category: currentCategory,
        topic: topicToUse,
        difficulty,
        ...generated,
        status: ExerciseStatus.NEW,
        timestamp: Date.now()
      };
      setExercises(prev => [...prev, newEx]);
      setCurrentExerciseId(newEx.id);
    } catch (err: any) {
      alert("AI generation failed. Check your network.");
    } finally { setLoading(false); }
  };

  const handleGenerateNextAuto = async (baseExercise: Exercise) => {
    setLoading(true);
    try {
      const generated = await generateExercise(baseExercise.category, baseExercise.difficulty, baseExercise.topic);
      const newEx: Exercise = {
        id: crypto.randomUUID(),
        category: baseExercise.category,
        topic: baseExercise.topic,
        difficulty: baseExercise.difficulty,
        ...generated,
        status: ExerciseStatus.NEW,
        timestamp: Date.now()
      };
      setExercises(prev => [...prev, newEx]);
      setCurrentExerciseId(newEx.id);
    } catch (err: any) {
      console.error(err);
    } finally { setLoading(false); }
  };

  const handleStartExam = async () => {
    if (currentCategory === 'REVIEW') return;
    setExamLoading(true);
    try {
      const q1Gen = await generateExercise(currentCategory, Difficulty.BEGINNER);
      const q1: Exercise = {
        id: crypto.randomUUID(),
        category: currentCategory,
        difficulty: Difficulty.BEGINNER,
        ...q1Gen,
        status: ExerciseStatus.NEW,
        timestamp: Date.now()
      };
      setExamSession({
        id: crypto.randomUUID(),
        category: currentCategory,
        questions: [q1],
        currentIndex: 0,
        results: {},
        startTime: Date.now(),
        isFinished: false
      });
    } catch (err: any) {
      console.error(err);
    } finally { setExamLoading(false); }
  };

  const handleExamQuestionSubmit = async (code: string) => {
    if (!examSession) return;
    setExamLoading(true);
    try {
      const currentQ = examSession.questions[examSession.currentIndex];
      const evaluation = await evaluateSubmission(currentQ, code);
      
      const updatedResults = { ...examSession.results, [currentQ.id]: evaluation };
      const updatedQuestions = examSession.questions.map(q => 
        q.id === currentQ.id ? { ...q, userCode: code, status: evaluation.isCorrect ? ExerciseStatus.CORRECT : ExerciseStatus.REVIEW, feedback: evaluation.feedback } : q
      );

      if (examSession.currentIndex < 9) {
        let nextDiff = Difficulty.BEGINNER;
        if (examSession.currentIndex >= 2) nextDiff = Difficulty.INTERMEDIATE;
        if (examSession.currentIndex >= 6) nextDiff = Difficulty.ADVANCED;

        const nextGen = await generateExercise(examSession.category, nextDiff);
        const nextQ: Exercise = {
          id: crypto.randomUUID(),
          category: examSession.category,
          difficulty: nextDiff,
          ...nextGen,
          status: ExerciseStatus.NEW,
          timestamp: Date.now()
        };

        setExamSession({
          ...examSession,
          questions: [...updatedQuestions, nextQ],
          currentIndex: examSession.currentIndex + 1,
          results: updatedResults
        });
      } else {
        setExamSession({
          ...examSession,
          questions: updatedQuestions,
          results: updatedResults,
          isFinished: true
        });
      }
    } catch (err: any) {
      console.error(err);
    } finally { setExamLoading(false); }
  };

  const activeExercise = exercises.find(ex => ex.id === currentExerciseId);
  const reviewList = exercises.filter(ex => ex.status === ExerciseStatus.REVIEW);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar 
        currentCategory={currentCategory} 
        isSandboxOpen={isSandboxOpen}
        onSelectCategory={(cat) => { 
          setCurrentCategory(cat); 
          setExamSession(null); 
          setCurrentExerciseId(null); 
          setIsSandboxOpen(false);
          if (cat === Category.POINT_CLOUD) setCurrentTopic(PointCloudTopic.MIXED);
          else if (cat === Category.GEOSPATIAL) setCurrentTopic(GeospatialTopic.MIXED);
        }}
        onOpenSandbox={() => setIsSandboxOpen(true)}
        reviewCount={reviewList.length}
        onResetData={() => { storageService.clear(); setExercises([]); setCurrentExerciseId(null); setExamSession(null); }}
        onExportData={() => {
          const blob = new Blob([JSON.stringify(exercises, null, 2)], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `progress.json`;
          link.click();
        }}
        onImportData={(file) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const parsed = JSON.parse(e.target?.result as string);
            if (Array.isArray(parsed)) { setExercises(parsed); setCurrentExerciseId(null); }
          };
          reader.readAsText(file);
        }}
      />

      <main className="ml-64 flex-1 flex flex-col h-screen overflow-hidden bg-slate-50">
        {isSandboxOpen ? (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="bg-slate-50 border-b border-slate-200/60 px-8 py-3 flex items-center flex-shrink-0">
              <button onClick={() => setIsSandboxOpen(false)} className="group flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold text-slate-500 uppercase tracking-wider transition-all hover:bg-slate-200/50 hover:text-slate-900">
                <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
                Back
              </button>
              <div className="h-4 w-px bg-slate-300 mx-4" />
              <div className="text-[10px] font-medium text-slate-400 uppercase tracking-widest truncate">Sandbox</div>
            </div>
            <div className="flex-1 overflow-hidden">
              <SandboxView />
            </div>
          </div>
        ) : examSession ? (
          <ExamView session={examSession} onQuestionSubmit={handleExamQuestionSubmit} onFinish={() => { setExercises(prev => [...prev, ...examSession.questions]); setExamSession(null); }} isLoadingNext={examLoading} />
        ) : activeExercise ? (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="bg-slate-50 border-b border-slate-200/60 px-8 py-3 flex items-center flex-shrink-0">
              <button onClick={() => setCurrentExerciseId(null)} className="group flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold text-slate-500 uppercase tracking-wider transition-all hover:bg-slate-200/50 hover:text-slate-900">
                <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
                Back to {currentCategory === 'REVIEW' ? 'Review Center' : 'Dashboard'}
              </button>
              <div className="h-4 w-px bg-slate-300 mx-4" />
              <div className="text-[10px] font-medium text-slate-400 uppercase tracking-widest truncate">{activeExercise.category} / {activeExercise.topic || 'General Exercise'}</div>
            </div>
            <div className="flex-1 overflow-hidden">
              {/* CRITICAL: Use exercise.id as key to force remount of editor on exercise change */}
              <ExerciseCard 
                key={activeExercise.id}
                exercise={activeExercise} 
                onUpdateStatus={(id, status, code, fb) => setExercises(prev => prev.map(ex => ex.id === id ? { ...ex, status, userCode: code, feedback: fb } : ex))} 
                onNext={() => handleGenerateNextAuto(activeExercise)} 
                evaluator={(ex, code) => evaluateSubmission(ex, code)} 
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
            <header className="mb-10 flex justify-between items-start">
              <div className="animate-fade-in">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                  {currentCategory === 'REVIEW' ? 'Review Center' : currentCategory}
                </h1>
                <p className="text-slate-500 text-lg">
                  {currentCategory === 'REVIEW' 
                    ? `You have ${reviewList.length} topics that need correction.` 
                    : `Master ${currentCategory} with AI challenges.`}
                </p>
              </div>
              {currentCategory !== 'REVIEW' && (
                <button onClick={handleStartExam} disabled={examLoading} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 shadow-xl transition-all">
                  {examLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <GraduationCap className="w-5 h-5" />}
                  Take 10-Question Exam
                </button>
              )}
            </header>

            {currentCategory === 'REVIEW' ? (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
                  <AlertCircle className="w-4 h-4 text-red-500" /> Pending Corrections
                </div>
                {reviewList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-slate-200 rounded-3xl bg-white/50">
                    <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-4">
                      <Sparkles className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">Clean Slate!</h3>
                    <p className="text-slate-500">You've mastered all recent challenges. No mistakes found.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
                    {reviewList.map(ex => (
                      <div 
                        key={ex.id} 
                        onClick={() => setCurrentExerciseId(ex.id)}
                        className="group bg-white p-6 rounded-2xl border border-slate-200 hover:border-red-400 cursor-pointer transition-all hover:shadow-xl hover:shadow-red-500/5 flex flex-col gap-4"
                      >
                        <div className="flex justify-between items-start">
                          <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-bold rounded uppercase">
                            {ex.difficulty}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {new Date(ex.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 group-hover:text-red-600 transition-colors mb-1 truncate">{ex.title}</h4>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{ex.category}</p>
                        </div>
                        <div className="mt-2 pt-4 border-t border-slate-50 flex items-center justify-between">
                           <span className="text-xs text-slate-400 flex items-center gap-1.5 italic">
                             <History className="w-3.5 h-3.5" /> 1 attempt failed
                           </span>
                           <div className="flex items-center gap-1.5 text-blue-600 font-bold text-xs">
                             Fix Now <PlayCircle className="w-4 h-4" />
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                <div className="xl:col-span-5 bg-white p-8 rounded-2xl border shadow-sm space-y-8">
                  <h3 className="text-xl font-bold flex items-center gap-2"><Sparkles className="w-5 h-5 text-blue-500" /> Generator</h3>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Difficulty</label>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.values(Difficulty).map(d => (
                        <button key={d} onClick={() => setDifficulty(d)} className={`py-2 rounded-lg text-xs font-bold border transition-all ${difficulty === d ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200'}`}>{d}</button>
                      ))}
                    </div>
                  </div>
                  {(currentCategory === Category.POINT_CLOUD || currentCategory === Category.GEOSPATIAL) && (
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Topic</label>
                      <div className="space-y-1">
                        {(currentCategory === Category.POINT_CLOUD ? Object.values(PointCloudTopic) : Object.values(GeospatialTopic)).map(t => (
                          <button key={t} onClick={() => setCurrentTopic(t)} className={`w-full text-left py-2 px-3 rounded text-xs transition-all flex justify-between items-center ${currentTopic === t ? 'bg-slate-900 text-white font-bold' : 'bg-slate-50 text-slate-600 border border-slate-100 hover:border-slate-300'}`}>{t} {currentTopic === t && <div className="w-1 h-1 bg-blue-400 rounded-full" />}</button>
                        ))}
                      </div>
                    </div>
                  )}
                  <button onClick={handleCreateExercise} disabled={loading} className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 disabled:bg-slate-300 transition-all flex justify-center items-center gap-2">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <BookOpen className="w-5 h-5" />} Generate Challenge
                  </button>
                </div>

                <div className="xl:col-span-7">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Activity History</h4>
                  <div className="space-y-3">
                    {exercises.filter(e => e.category === currentCategory).length === 0 ? (
                      <div className="py-20 text-center text-slate-300 border border-dashed rounded-xl">No history found.</div>
                    ) : (
                      exercises.filter(e => e.category === currentCategory).reverse().slice(0, 10).map(ex => (
                        <div key={ex.id} onClick={() => setCurrentExerciseId(ex.id)} className="p-4 bg-white rounded-xl border hover:border-blue-400 cursor-pointer transition-all flex items-center justify-between group shadow-sm">
                          <div className="flex items-center gap-4">
                            <div className={`w-2 h-2 rounded-full ${ex.status === ExerciseStatus.CORRECT ? 'bg-green-500' : ex.status === ExerciseStatus.REVIEW ? 'bg-red-500' : 'bg-slate-300'}`} />
                            <div>
                              <div className="text-[10px] text-slate-400 font-bold uppercase">{ex.topic || 'General'}</div>
                              <div className="font-bold text-slate-800 group-hover:text-blue-600">{ex.title}</div>
                            </div>
                          </div>
                          <div className="text-right text-[10px] text-slate-400">{new Date(ex.timestamp).toLocaleDateString()}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
