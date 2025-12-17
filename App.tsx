import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ExerciseCard } from './components/ExerciseCard';
import { SettingsModal } from './components/SettingsModal';
import { Category, Difficulty, Exercise, ExerciseStatus, AppSettings, GeneratedExerciseResponse } from './types';
import { generateExercise, evaluateSubmission } from './services/geminiService';
import { storageService } from './services/storage';
import { Sparkles, Loader2, BookOpen } from 'lucide-react';

export default function App() {
  const [currentCategory, setCurrentCategory] = useState<Category | 'REVIEW'>(Category.POINT_CLOUD);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentExerciseId, setCurrentExerciseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.BEGINNER);
  const [isStorageLoaded, setIsStorageLoaded] = useState(false);
  
  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({
    geminiApiKeys: []
  });
  const [keyRotationIndex, setKeyRotationIndex] = useState(0);

  // Load data on mount
  useEffect(() => {
    const savedData = storageService.load();
    if (savedData && savedData.length > 0) {
      setExercises(savedData);
    }
    const savedSettings = storageService.loadSettings();
    if (savedSettings) {
      setSettings(savedSettings);
    }
    setIsStorageLoaded(true);
  }, []);

  // Save persistence
  useEffect(() => {
    if (isStorageLoaded) {
      storageService.save(exercises);
    }
  }, [exercises, isStorageLoaded]);

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    setKeyRotationIndex(0);
    storageService.saveSettings(newSettings);
    setIsSettingsOpen(false);
  };

  const handleResetData = () => {
    storageService.clear();
    setExercises([]);
    setCurrentExerciseId(null);
    setCurrentCategory(Category.POINT_CLOUD);
  };

  // --- Import / Export Handlers ---
  const handleExportData = () => {
    const dataStr = JSON.stringify(exercises, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trimble-spark-progress-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result as string;
        if (!result) return;
        const parsedData = JSON.parse(result);
        
        // Basic validation
        if (Array.isArray(parsedData)) {
          if (window.confirm(`Found ${parsedData.length} exercises in backup. This will overwrite your current session. Continue?`)) {
            setExercises(parsedData as Exercise[]);
            setCurrentExerciseId(null); // Reset view
            alert("Progress restored successfully!");
          }
        } else {
          alert("Invalid backup file format.");
        }
      } catch (err) {
        console.error("Import failed", err);
        alert("Failed to parse backup file.");
      }
    };
    reader.readAsText(file);
  };
  // --------------------------------

  const getValidKeys = () => settings.geminiApiKeys.filter(Boolean);
  const hasApiKey = () => getValidKeys().length > 0;
  const getNextApiKey = () => {
    const validKeys = getValidKeys();
    if (validKeys.length === 0) return null;
    const nextIndex = keyRotationIndex % validKeys.length;
    setKeyRotationIndex((prev) => (prev + 1) % validKeys.length);
    return validKeys[nextIndex];
  };

  const handleCreateExercise = async () => {
    if (currentCategory === 'REVIEW') return;
    if (!hasApiKey()) {
      setError('Add at least one Gemini API key in Settings.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const apiKey = getNextApiKey();
      if (!apiKey) throw new Error('No valid Gemini API key available.');
      const generated = await generateExercise(currentCategory, difficulty, apiKey);
      const newExercise: Exercise = {
        id: crypto.randomUUID(),
        category: currentCategory,
        difficulty: difficulty,
        ...generated,
        status: ExerciseStatus.NEW,
        timestamp: Date.now()
      };
      
      setExercises(prev => [...prev, newExercise]);
      setCurrentExerciseId(newExercise.id);
    } catch (err: any) {
      const msg = err.message || "Unknown error";
      setError(`Failed to generate: ${msg}. Check API Key in Settings.`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = (id: string, status: ExerciseStatus, userCode: string, feedback: string) => {
    setExercises(prev => prev.map(ex => 
      ex.id === id ? { ...ex, status, userCode, feedback } : ex
    ));
  };

  const evaluateExercise = async (exercise: GeneratedExerciseResponse, userCode: string) => {
    if (!hasApiKey()) {
      throw new Error('Add at least one Gemini API key in Settings.');
    }
    const apiKey = getNextApiKey();
    if (!apiKey) {
      throw new Error('No valid Gemini API key available.');
    }
    return evaluateSubmission(exercise, userCode, apiKey);
  };

  const reviewList = exercises.filter(ex => ex.status === ExerciseStatus.REVIEW);
  const activeExercise = exercises.find(ex => ex.id === currentExerciseId);
  
  const handleSelectCategory = (cat: Category | 'REVIEW') => {
    setCurrentCategory(cat);
    setCurrentExerciseId(null); 
  };

  const startReview = (id: string) => {
    setCurrentExerciseId(id);
  };

  if (!isStorageLoaded) {
    return <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-400">Loading your progress...</div>;
  }

  // Determine connection status: user has provided at least one key
  const isConnected = hasApiKey();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar 
        currentCategory={currentCategory} 
        onSelectCategory={handleSelectCategory} 
        reviewCount={reviewList.length}
        onResetData={handleResetData}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onExportData={handleExportData}
        onImportData={handleImportData}
        isConnected={isConnected}
      />

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />

      <main className="ml-64 flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* API Key Warning */}
        {!isConnected && (
           <div className="bg-amber-600 text-white p-2 text-center text-sm font-bold flex justify-center gap-2 items-center cursor-pointer hover:bg-amber-700 transition-colors" onClick={() => setIsSettingsOpen(true)}>
             <span className="flex items-center gap-2">⚠️ Gemini API Key missing. Click here to configure.</span>
           </div>
        )}

        {activeExercise ? (
          // --- Active Exercise View ---
          <div className="flex-1 overflow-hidden relative">
             <button 
              onClick={() => setCurrentExerciseId(null)}
              className="absolute top-6 left-6 z-10 bg-white/80 backdrop-blur border border-slate-200 px-3 py-1 rounded-md text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors"
             >
               ← Back to Menu
             </button>
             <ExerciseCard 
                exercise={activeExercise}
                onUpdateStatus={handleUpdateStatus}
                onNext={() => setCurrentExerciseId(null)}
               evaluator={evaluateExercise}
             />
          </div>
        ) : (
          // --- Dashboard / Menu View ---
          <div className="flex-1 overflow-y-auto p-12">
            
            <header className="mb-12">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                {currentCategory === 'REVIEW' ? 'Review Mistakes' : currentCategory}
              </h1>
              <p className="text-slate-500 text-lg">
                {currentCategory === 'REVIEW' 
                  ? 'Revisit problems you struggled with to reinforce your learning.'
                  : 'Generate specialized PySpark problems specifically for Trimble business contexts.'
                }
              </p>
            </header>

            {currentCategory === 'REVIEW' ? (
              // Review Mode List
              <div className="space-y-4 max-w-4xl">
                {reviewList.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 border-dashed">
                    <Sparkles className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-slate-800">No exercises needed for review!</h3>
                    <p className="text-slate-500">Great job. Go practice new topics.</p>
                  </div>
                ) : (
                  reviewList.map(ex => (
                    <div key={ex.id} className="bg-white p-6 rounded-xl border border-red-100 shadow-sm flex justify-between items-center hover:shadow-md transition-shadow">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-slate-500 uppercase">{ex.category}</span>
                          <span className="text-xs font-medium text-red-500 bg-red-50 px-2 py-0.5 rounded-full">Needs Review</span>
                        </div>
                        <h3 className="font-bold text-slate-800 text-lg">{ex.title}</h3>
                        <p className="text-slate-500 text-sm line-clamp-1">{ex.description}</p>
                      </div>
                      <button 
                        onClick={() => startReview(ex.id)}
                        className="bg-red-50 text-red-600 px-4 py-2 rounded-lg font-medium hover:bg-red-100 transition-colors"
                      >
                        Retry
                      </button>
                    </div>
                  ))
                )}
              </div>
            ) : (
              // Generator Mode
              <div className="max-w-xl">
                 <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-blue-500" />
                      New Session
                    </h3>

                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Difficulty Level</label>
                        <div className="grid grid-cols-3 gap-3">
                          {Object.values(Difficulty).map(diff => (
                            <button
                              key={diff}
                              onClick={() => setDifficulty(diff)}
                              className={`py-2 px-4 rounded-lg text-sm font-medium border transition-all
                                ${difficulty === diff 
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105' 
                                  : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                                }
                              `}
                            >
                              {diff}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="pt-4">
                        <button
                          onClick={handleCreateExercise}
                          disabled={loading}
                          className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg shadow-blue-500/20 transition-all flex justify-center items-center gap-3
                            ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 hover:shadow-xl hover:-translate-y-1'}
                          `}
                        >
                          {loading ? (
                            <>
                              <Loader2 className="w-6 h-6 animate-spin" />
                              Constructing Scenario...
                            </>
                          ) : (
                            <>
                              <BookOpen className="w-6 h-6" />
                              Generate Exercise
                            </>
                          )}
                        </button>
                        {error && (
                          <p className="mt-4 text-center text-red-500 text-sm">{error}</p>
                        )}
                      </div>
                    </div>
                 </div>

                 {/* History of this session */}
                 {exercises.filter(e => e.category === currentCategory).length > 0 && (
                   <div className="mt-12">
                     <h4 className="text-slate-500 font-semibold mb-4 uppercase text-xs tracking-wider">Previous Exercises ({currentCategory})</h4>
                     <div className="space-y-3">
                       {exercises.filter(e => e.category === currentCategory).reverse().map(ex => (
                         <div key={ex.id} className="group flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200 hover:border-blue-300 transition-colors cursor-pointer" onClick={() => startReview(ex.id)}>
                            <div className="flex items-center gap-3">
                              {ex.status === ExerciseStatus.CORRECT ? (
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                              ) : ex.status === ExerciseStatus.REVIEW ? (
                                <div className="w-2 h-2 rounded-full bg-red-500" />
                              ) : (
                                <div className="w-2 h-2 rounded-full bg-slate-300" />
                              )}
                              <span className="text-slate-700 font-medium">{ex.title}</span>
                            </div>
                            <span className="text-slate-400 text-xs">{new Date(ex.timestamp).toLocaleTimeString()}</span>
                         </div>
                       ))}
                     </div>
                   </div>
                 )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}