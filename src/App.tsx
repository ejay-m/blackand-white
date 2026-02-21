import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Minus, X, Divide, Delete, RotateCcw, 
  Sparkles, History as HistoryIcon, Info, 
  ChevronRight, Send, Loader2, X as CloseIcon,
  Undo, Redo, Settings, Camera, ArrowRightLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { evaluate } from 'mathjs';
import ReactMarkdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { geminiService } from './services/geminiService';
import { CalculationHistory } from './types';
import { audioService } from './utils/audio';
import { MathBackground } from './components/MathBackground';
import { UnitConverter } from './components/UnitConverter';

type Theme = 'light' | 'dark' | 'colorful';

const THEMES = {
  light: {
    bg: 'bg-zinc-50',
    panel: 'bg-white/80 border-zinc-200/50',
    display: 'bg-zinc-900 text-white',
    button: 'bg-white text-zinc-800 hover:bg-zinc-50 border-zinc-100',
    opButton: 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200',
    sidebar: 'bg-white/80 border-zinc-200/50',
    text: 'text-zinc-900',
    subtext: 'text-zinc-400',
    historyItem: 'bg-white border-zinc-100 hover:border-indigo-200',
    historyText: 'text-zinc-800'
  },
  dark: {
    bg: 'bg-zinc-950',
    panel: 'bg-zinc-900/80 border-zinc-800',
    display: 'bg-black text-white',
    button: 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700 border-zinc-700',
    opButton: 'bg-zinc-700 text-zinc-100 hover:bg-zinc-600',
    sidebar: 'bg-zinc-900/80 border-zinc-800',
    text: 'text-zinc-100',
    subtext: 'text-zinc-500',
    historyItem: 'bg-zinc-800 border-zinc-700 hover:border-indigo-500',
    historyText: 'text-zinc-100'
  },
  colorful: {
    bg: 'bg-indigo-50',
    panel: 'bg-white/90 border-indigo-100',
    display: 'bg-indigo-900 text-white',
    button: 'bg-white text-indigo-900 hover:bg-indigo-50 border-indigo-100',
    opButton: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200',
    sidebar: 'bg-white/90 border-indigo-100',
    text: 'text-indigo-900',
    subtext: 'text-indigo-400',
    historyItem: 'bg-white border-indigo-50 hover:border-indigo-300',
    historyText: 'text-indigo-900'
  }
};

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [display, setDisplay] = useState('0');
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const [history, setHistory] = useState<CalculationHistory[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [showAiInput, setShowAiInput] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showUnitConverter, setShowUnitConverter] = useState(false);
  const [theme, setTheme] = useState<Theme>((localStorage.getItem('calc-theme') as Theme) || 'light');
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini-api-key') || '');
  const [isImageAnalyzing, setIsImageAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedCalculation, setSelectedCalculation] = useState<CalculationHistory | null>(null);
  const historyEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem('calc-history');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('calc-history', JSON.stringify(history));
    if (showHistory) {
      historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history, showHistory]);

  const updateDisplay = (newVal: string | ((prev: string) => string)) => {
    setDisplay(prev => {
      const next = typeof newVal === 'function' ? newVal(prev) : newVal;
      if (next !== prev) {
        setUndoStack(u => [...u, prev]);
        setRedoStack([]);
      }
      return next;
    });
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    audioService.playAction();
    const previous = undoStack[undoStack.length - 1];
    setRedoStack(prev => [...prev, display]);
    setUndoStack(prev => prev.slice(0, -1));
    setDisplay(previous);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    audioService.playAction();
    const next = redoStack[redoStack.length - 1];
    setUndoStack(prev => [...prev, display]);
    setRedoStack(prev => prev.slice(0, -1));
    setDisplay(next);
  };

  const handleNumber = (num: string) => {
    audioService.playNumber();
    updateDisplay(prev => (prev === '0' ? num : prev + num));
  };

  const handleOperator = (op: string) => {
    audioService.playOperator();
    updateDisplay(prev => {
      const lastChar = prev.slice(-1);
      if (['+', '-', '*', '/'].includes(lastChar)) {
        return prev.slice(0, -1) + op;
      } else {
        return prev + op;
      }
    });
  };

  const handleClear = () => {
    audioService.playClear();
    updateDisplay('0');
  };

  const handleBackspace = () => {
    audioService.playAction();
    updateDisplay(prev => (prev.length > 1 ? prev.slice(0, -1) : '0'));
  };

  const handleCalculate = () => {
    try {
      const result = evaluate(display).toString();
      if (result === display) {
        audioService.playEquals();
        return;
      }
      
      audioService.playSuccess();
      const newEntry: CalculationHistory = {
        id: Date.now().toString(),
        expression: display,
        result,
        timestamp: Date.now(),
      };
      setHistory(prev => [...prev, newEntry]);
      updateDisplay(result);
    } catch (error) {
      audioService.playError();
      setDisplay('Error');
      setTimeout(() => setDisplay('0'), 1500);
    }
  };

  const handleAiSolve = async (prompt?: string) => {
    const query = prompt || aiPrompt || display;
    if (!query || query === '0') return;

    audioService.playAiStart();
    setIsAiLoading(true);
    setShowAiInput(false);
    setAiPrompt('');

    try {
      const aiResponse = await geminiService.solveMathProblem(query);
      audioService.playSuccess();
      const newEntry: CalculationHistory = {
        id: Date.now().toString(),
        expression: query,
        result: aiResponse.result,
        explanation: aiResponse.explanation,
        timestamp: Date.now(),
        isAiGenerated: true,
      };
      setHistory(prev => [...prev, newEntry]);
      updateDisplay(aiResponse.result);
      setSelectedCalculation(newEntry);
    } catch (error) {
      audioService.playError();
      console.error(error);
      alert('AI failed to solve this. Try a simpler expression.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleExplain = async (calc: CalculationHistory) => {
    audioService.playAction();
    if (calc.explanation) {
      setSelectedCalculation(calc);
      return;
    }

    setIsAiLoading(true);
    try {
      const aiResponse = await geminiService.explainCalculation(calc.expression, calc.result);
      const updatedHistory = history.map(h => 
        h.id === calc.id ? { ...h, explanation: aiResponse.explanation } : h
      );
      setHistory(updatedHistory);
      setSelectedCalculation({ ...calc, explanation: aiResponse.explanation });
    } catch (error) {
      alert('Failed to get explanation');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    audioService.playAiStart();
    setIsImageAnalyzing(true);
    setIsAiLoading(true);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = (reader.result as string).split(',')[1];
        const mimeType = file.type;

        try {
          const aiResponse = await geminiService.solveMathFromImage(base64String, mimeType);
          audioService.playSuccess();
          const newEntry: CalculationHistory = {
            id: Date.now().toString(),
            expression: "[Image Analysis]",
            result: aiResponse.result,
            explanation: aiResponse.explanation,
            timestamp: Date.now(),
            isAiGenerated: true,
          };
          setHistory(prev => [...prev, newEntry]);
          updateDisplay(aiResponse.result);
          setSelectedCalculation(newEntry);
        } catch (error) {
          audioService.playError();
          console.error(error);
          alert('AI failed to analyze the image. Try a clearer photo.');
        } finally {
          setIsImageAnalyzing(false);
          setIsAiLoading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      audioService.playError();
      console.error(error);
      setIsImageAnalyzing(false);
      setIsAiLoading(false);
    }
  };

  const t = THEMES[theme];

  return (
    <div className={cn("min-h-screen flex items-center justify-center p-4 sm:p-8 relative transition-colors duration-500", t.bg)}>
      <MathBackground theme={theme} />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start z-10"
      >
        
        {/* Main Calculator */}
        <div className="lg:col-span-7 space-y-6">
          <motion.div 
            whileHover={{ scale: 1.01 }}
            className={cn("rounded-3xl overflow-hidden shadow-2xl border transition-all duration-500", t.panel)}
          >
            {/* Display */}
            <div className={cn("p-8 text-right space-y-2 relative overflow-hidden transition-colors duration-500", t.display)}>
              {/* Decorative background for display */}
              <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
                <div className="absolute top-2 left-2 text-[10px] font-mono">CALC_V1.0</div>
                <div className="absolute bottom-2 left-2 text-[10px] font-mono">RAD</div>
              </div>
              
              <div className="text-zinc-400 text-sm font-mono h-6 overflow-hidden text-ellipsis">
                {display !== '0' && display}
              </div>
              <motion.div 
                key={display}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-5xl font-light tracking-tight truncate"
              >
                {display}
              </motion.div>
            </div>

            {/* Keypad */}
            <div className={cn("p-6 transition-colors duration-500", theme === 'dark' ? 'bg-zinc-900' : 'bg-white')}>
              <div className="calculator-grid">
                <CalcButton theme={theme} onClick={handleClear} className={t.opButton}>AC</CalcButton>
                <CalcButton theme={theme} onClick={handleBackspace} className={t.opButton}><Delete size={20} /></CalcButton>
                <CalcButton theme={theme} onClick={() => handleOperator('/')} className={t.opButton}><Divide size={20} /></CalcButton>
                <CalcButton theme={theme} onClick={() => handleOperator('*')} className={t.opButton}><X size={20} /></CalcButton>

                <CalcButton theme={theme} onClick={() => handleNumber('7')}>7</CalcButton>
                <CalcButton theme={theme} onClick={() => handleNumber('8')}>8</CalcButton>
                <CalcButton theme={theme} onClick={() => handleNumber('9')}>9</CalcButton>
                <CalcButton theme={theme} onClick={() => handleOperator('-')} className={t.opButton}><Minus size={20} /></CalcButton>

                <CalcButton theme={theme} onClick={() => handleNumber('4')}>4</CalcButton>
                <CalcButton theme={theme} onClick={() => handleNumber('5')}>5</CalcButton>
                <CalcButton theme={theme} onClick={() => handleNumber('6')}>6</CalcButton>
                <CalcButton theme={theme} onClick={() => handleOperator('+')} className={t.opButton}><Plus size={20} /></CalcButton>

                <CalcButton theme={theme} onClick={() => handleNumber('1')}>1</CalcButton>
                <CalcButton theme={theme} onClick={() => handleNumber('2')}>2</CalcButton>
                <CalcButton theme={theme} onClick={() => handleNumber('3')}>3</CalcButton>
                <CalcButton 
                  theme={theme}
                  onClick={handleCalculate} 
                  className={cn("row-span-2 text-white hover:opacity-90", theme === 'colorful' ? 'bg-indigo-600' : 'bg-zinc-900')}
                >
                  =
                </CalcButton>

                <CalcButton theme={theme} onClick={() => handleNumber('0')} className="col-span-2">0</CalcButton>
                <CalcButton theme={theme} onClick={() => handleNumber('.')}>.</CalcButton>
              </div>

              {/* AI Actions */}
              <div className={cn("mt-6 pt-6 border-t flex gap-3", theme === 'dark' ? 'border-zinc-800' : 'border-zinc-100')}>
                <motion.button 
                  whileHover={{ scale: 1.02, boxShadow: '0 0 15px rgba(79, 70, 229, 0.2)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowAiInput(!showAiInput)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-colors relative overflow-hidden group",
                    theme === 'dark' ? 'bg-indigo-900/30 text-indigo-300 hover:bg-indigo-900/50' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                  )}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />
                  <Sparkles size={18} />
                  <span>AI Solve</span>
                </motion.button>
                <div className="flex gap-2">
                  <button 
                    onClick={handleUndo}
                    disabled={undoStack.length === 0}
                    className={cn("p-3 rounded-xl transition-colors disabled:opacity-30", t.opButton)}
                    title="Undo"
                  >
                    <Undo size={20} />
                  </button>
                  <button 
                    onClick={handleRedo}
                    disabled={redoStack.length === 0}
                    className={cn("p-3 rounded-xl transition-colors disabled:opacity-30", t.opButton)}
                    title="Redo"
                  >
                    <Redo size={20} />
                  </button>
                  <button 
                    onClick={() => {
                      audioService.playAction();
                      setShowUnitConverter(!showUnitConverter);
                    }}
                    className={cn("p-3 rounded-xl transition-colors", showUnitConverter ? "bg-indigo-600 text-white" : t.opButton)}
                    title="Unit Converter"
                  >
                    <ArrowRightLeft size={20} />
                  </button>
                  <button 
                    onClick={() => {
                      audioService.playAction();
                      setShowSettings(true);
                    }}
                    className={cn("p-3 rounded-xl transition-colors", t.opButton)}
                    title="Settings"
                  >
                    <Settings size={20} />
                  </button>
                </div>
                <button 
                  onClick={() => setShowHistory(!showHistory)}
                  className={cn("p-3 rounded-xl transition-colors", t.opButton)}
                  title="History"
                >
                  <HistoryIcon size={20} />
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className={cn("p-3 rounded-xl transition-colors", t.opButton)}
                  title="Analyze Image"
                  disabled={isImageAnalyzing}
                >
                  {isImageAnalyzing ? <Loader2 className="animate-spin" size={20} /> : <Camera size={20} />}
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>

              {/* AI Input Field */}
              <AnimatePresence>
                {showAiInput && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 flex gap-2">
                      <input 
                        type="text"
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="Type a word problem..."
                        className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        onKeyDown={(e) => e.key === 'Enter' && handleAiSolve()}
                      />
                      <button 
                        onClick={() => handleAiSolve()}
                        disabled={isAiLoading}
                        className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {isAiLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        {/* Sidebar: History & Explanations / Unit Converter */}
        <div className="lg:col-span-5 space-y-6 h-full">
          <AnimatePresence mode="wait">
            {showUnitConverter ? (
              <UnitConverter 
                key="unit-converter"
                theme={theme} 
                onClose={() => setShowUnitConverter(false)} 
                onCopyResult={(val) => {
                  audioService.playSuccess();
                  setDisplay(val);
                  setShowUnitConverter(false);
                }}
              />
            ) : (
              <motion.div 
                key="history-panel"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={cn("rounded-3xl p-6 h-[600px] flex flex-col shadow-2xl border transition-all duration-500", t.sidebar)}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className={cn("text-xl font-semibold flex items-center gap-2 transition-colors duration-500", t.text)}>
                    {selectedCalculation ? (
                      <>
                        <button onClick={() => setSelectedCalculation(null)} className={cn("p-1 rounded-lg transition-colors", theme === 'dark' ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100')}>
                          <ChevronRight className="rotate-180" size={20} />
                        </button>
                        Explanation
                      </>
                    ) : (
                      <>
                        <HistoryIcon size={20} className={t.subtext} />
                        History
                      </>
                    )}
                  </h2>
                  {history.length > 0 && !selectedCalculation && (
                    <button 
                      onClick={() => {
                        audioService.playClick();
                        setHistory([]);
                        localStorage.removeItem('calc-history');
                      }}
                      className={cn("text-xs flex items-center gap-1 transition-colors", theme === 'dark' ? 'text-zinc-500 hover:text-red-400' : 'text-zinc-400 hover:text-red-500')}
                    >
                      <RotateCcw size={12} />
                      Clear
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  <AnimatePresence mode="wait">
                    {selectedCalculation ? (
                      <motion.div 
                        key="explanation"
                        initial={{ opacity: 0, rotateY: 90, perspective: 1000 }}
                        animate={{ opacity: 1, rotateY: 0 }}
                        exit={{ opacity: 0, rotateY: -90 }}
                        transition={{ type: "spring", damping: 20, stiffness: 100 }}
                        className="space-y-4"
                      >
                        <div className={cn("p-4 rounded-2xl border transition-colors duration-500", theme === 'dark' ? 'bg-zinc-800/50 border-zinc-700' : 'bg-zinc-50 border-zinc-100')}>
                          <div className={cn("text-xs mb-1", t.subtext)}>Problem</div>
                          <div className={cn("font-medium", t.text)}>{selectedCalculation.expression}</div>
                          <div className="text-2xl font-light text-indigo-600 mt-2">= {selectedCalculation.result}</div>
                        </div>
                        
                        <div className={cn("prose prose-sm max-w-none", theme === 'dark' ? 'prose-invert' : 'prose-zinc')}>
                          <div className={cn("text-xs mb-2 uppercase tracking-wider font-semibold", t.subtext)}>Steps & Explanation</div>
                          {isAiLoading ? (
                            <div className={cn("flex items-center gap-2 py-8 justify-center", t.subtext)}>
                              <Loader2 className="animate-spin" size={18} />
                              <span>Gemini is thinking...</span>
                            </div>
                          ) : (
                            <div className={cn("leading-relaxed", theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600')}>
                              <ReactMarkdown>{selectedCalculation.explanation || ''}</ReactMarkdown>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="history"
                        initial={{ opacity: 0, rotateY: -90, perspective: 1000 }}
                        animate={{ opacity: 1, rotateY: 0 }}
                        exit={{ opacity: 0, rotateY: 90 }}
                        transition={{ type: "spring", damping: 20, stiffness: 100 }}
                        className="space-y-3"
                      >
                        {history.length === 0 ? (
                          <div className={cn("h-full flex flex-col items-center justify-center space-y-2 py-20", t.subtext)}>
                            <div className={cn("p-4 rounded-full", theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-100')}>
                              <HistoryIcon size={32} />
                            </div>
                            <p className="text-sm">No calculations yet</p>
                          </div>
                        ) : (
                          history.slice().reverse().map((item) => (
                            <div 
                              key={item.id}
                              className={cn("group p-4 rounded-2xl border transition-all cursor-pointer", t.historyItem)}
                              onClick={() => handleExplain(item)}
                            >
                              <div className="flex justify-between items-start mb-1">
                                <span className={cn("text-xs font-mono truncate max-w-[150px]", t.subtext)}>
                                  {item.expression}
                                </span>
                                <span className="text-[10px] text-zinc-300">
                                  {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className={cn("text-lg font-medium", t.historyText)}>
                                  {item.result}
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {item.isAiGenerated && <Sparkles size={14} className="text-indigo-400" />}
                                  <Info size={14} className="text-zinc-300" />
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                        <div ref={historyEndRef} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Footer info */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-zinc-400 uppercase tracking-[0.2em] font-medium">
        Powered by Gemini 3 Flash
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-3xl font-bold">Settings</h3>
                <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-zinc-100 rounded-full">
                  <CloseIcon size={24} />
                </button>
              </div>
              <p className="text-zinc-500 mb-8 leading-relaxed">
                To enable AI features on Vercel, please enter your Gemini API Key. 
                It is stored safely in your browser's local storage.
              </p>
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3 block">
                    UI Theme
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['light', 'dark', 'colorful'] as const).map((tName) => (
                      <button
                        key={tName}
                        onClick={() => {
                          audioService.playAction();
                          setTheme(tName);
                          localStorage.setItem('calc-theme', tName);
                        }}
                        className={cn(
                          "py-2 px-3 rounded-xl text-xs font-bold capitalize border transition-all",
                          theme === tName 
                            ? "bg-zinc-900 text-white border-zinc-900" 
                            : "bg-zinc-50 text-zinc-600 border-zinc-200 hover:border-zinc-300"
                        )}
                      >
                        {tName}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2 block">
                    Gemini API Key
                  </label>
                  <input 
                    type="password" 
                    value={apiKey} 
                    onChange={e => setApiKey(e.target.value)} 
                    placeholder="Paste your key here..." 
                    className="w-full border border-zinc-200 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" 
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => { 
                      audioService.playSuccess();
                      localStorage.setItem('gemini-api-key', apiKey); 
                      setShowSettings(false);
                      window.location.reload(); // Reload to re-init service
                    }} 
                    className="flex-1 bg-zinc-900 text-white py-4 rounded-2xl font-bold hover:bg-zinc-800 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
                <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block text-center text-xs text-indigo-600 hover:underline pt-2"
                >
                  Get a free key from Google AI Studio
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CalcButton({ children, onClick, className, disabled, theme }: { 
  children: React.ReactNode, 
  onClick?: () => void, 
  className?: string,
  disabled?: boolean,
  theme: Theme
}) {
  const t = THEMES[theme];
  return (
    <motion.button
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "h-14 sm:h-16 flex items-center justify-center rounded-2xl text-xl font-medium transition-all disabled:opacity-50 border shadow-sm",
        t.button,
        className
      )}
    >
      {children}
    </motion.button>
  );
}
