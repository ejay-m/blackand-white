import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Minus, X, Divide, Delete, RotateCcw, 
  Sparkles, History as HistoryIcon, Info, 
  ChevronRight, Send, Loader2, X as CloseIcon,
  Undo, Redo
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { evaluate } from 'mathjs';
import ReactMarkdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { geminiService } from './services/geminiService';
import { CalculationHistory } from './types';

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
    const previous = undoStack[undoStack.length - 1];
    setRedoStack(prev => [...prev, display]);
    setUndoStack(prev => prev.slice(0, -1));
    setDisplay(previous);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack(prev => [...prev, display]);
    setRedoStack(prev => prev.slice(0, -1));
    setDisplay(next);
  };

  const handleNumber = (num: string) => {
    updateDisplay(prev => (prev === '0' ? num : prev + num));
  };

  const handleOperator = (op: string) => {
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
    updateDisplay('0');
  };

  const handleBackspace = () => {
    updateDisplay(prev => (prev.length > 1 ? prev.slice(0, -1) : '0'));
  };

  const handleCalculate = () => {
    try {
      const result = evaluate(display).toString();
      if (result === display) return;
      
      const newEntry: CalculationHistory = {
        id: Date.now().toString(),
        expression: display,
        result,
        timestamp: Date.now(),
      };
      setHistory(prev => [...prev, newEntry]);
      updateDisplay(result);
    } catch (error) {
      setDisplay('Error');
      setTimeout(() => setDisplay('0'), 1500);
    }
  };

  const handleAiSolve = async (prompt?: string) => {
    const query = prompt || aiPrompt || display;
    if (!query || query === '0') return;

    setIsAiLoading(true);
    setShowAiInput(false);
    setAiPrompt('');

    try {
      const aiResponse = await geminiService.solveMathProblem(query);
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
      console.error(error);
      alert('AI failed to solve this. Try a simpler expression.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleExplain = async (calc: CalculationHistory) => {
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

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Main Calculator */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-panel rounded-3xl overflow-hidden shadow-2xl border-zinc-200/50">
            {/* Display */}
            <div className="p-8 bg-zinc-900 text-white text-right space-y-2">
              <div className="text-zinc-400 text-sm font-mono h-6 overflow-hidden text-ellipsis">
                {display !== '0' && display}
              </div>
              <div className="text-5xl font-light tracking-tight truncate">
                {display}
              </div>
            </div>

            {/* Keypad */}
            <div className="p-6 bg-white">
              <div className="calculator-grid">
                <CalcButton onClick={handleClear} className="bg-zinc-100 text-zinc-600 hover:bg-zinc-200">AC</CalcButton>
                <CalcButton onClick={handleBackspace} className="bg-zinc-100 text-zinc-600 hover:bg-zinc-200"><Delete size={20} /></CalcButton>
                <CalcButton onClick={() => handleOperator('/')} className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200"><Divide size={20} /></CalcButton>
                <CalcButton onClick={() => handleOperator('*')} className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200"><X size={20} /></CalcButton>

                <CalcButton onClick={() => handleNumber('7')}>7</CalcButton>
                <CalcButton onClick={() => handleNumber('8')}>8</CalcButton>
                <CalcButton onClick={() => handleNumber('9')}>9</CalcButton>
                <CalcButton onClick={() => handleOperator('-')} className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200"><Minus size={20} /></CalcButton>

                <CalcButton onClick={() => handleNumber('4')}>4</CalcButton>
                <CalcButton onClick={() => handleNumber('5')}>5</CalcButton>
                <CalcButton onClick={() => handleNumber('6')}>6</CalcButton>
                <CalcButton onClick={() => handleOperator('+')} className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200"><Plus size={20} /></CalcButton>

                <CalcButton onClick={() => handleNumber('1')}>1</CalcButton>
                <CalcButton onClick={() => handleNumber('2')}>2</CalcButton>
                <CalcButton onClick={() => handleNumber('3')}>3</CalcButton>
                <CalcButton 
                  onClick={handleCalculate} 
                  className="row-span-2 bg-zinc-900 text-white hover:bg-zinc-800"
                >
                  =
                </CalcButton>

                <CalcButton onClick={() => handleNumber('0')} className="col-span-2">0</CalcButton>
                <CalcButton onClick={() => handleNumber('.')}>.</CalcButton>
              </div>

              {/* AI Actions */}
              <div className="mt-6 pt-6 border-t border-zinc-100 flex gap-3">
                <button 
                  onClick={() => setShowAiInput(!showAiInput)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-50 text-indigo-600 font-medium hover:bg-indigo-100 transition-colors"
                >
                  <Sparkles size={18} />
                  <span>AI Solve</span>
                </button>
                <div className="flex gap-2">
                  <button 
                    onClick={handleUndo}
                    disabled={undoStack.length === 0}
                    className="p-3 rounded-xl bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-colors disabled:opacity-30"
                    title="Undo"
                  >
                    <Undo size={20} />
                  </button>
                  <button 
                    onClick={handleRedo}
                    disabled={redoStack.length === 0}
                    className="p-3 rounded-xl bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-colors disabled:opacity-30"
                    title="Redo"
                  >
                    <Redo size={20} />
                  </button>
                </div>
                <button 
                  onClick={() => setShowHistory(!showHistory)}
                  className="p-3 rounded-xl bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-colors"
                  title="History"
                >
                  <HistoryIcon size={20} />
                </button>
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
          </div>
        </div>

        {/* Sidebar: History & Explanations */}
        <div className="lg:col-span-5 space-y-6 h-full">
          <div className="glass-panel rounded-3xl p-6 h-[600px] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                {selectedCalculation ? (
                  <>
                    <button onClick={() => setSelectedCalculation(null)} className="p-1 hover:bg-zinc-100 rounded-lg">
                      <ChevronRight className="rotate-180" size={20} />
                    </button>
                    Explanation
                  </>
                ) : (
                  <>
                    <HistoryIcon size={20} className="text-zinc-400" />
                    History
                  </>
                )}
              </h2>
              {history.length > 0 && !selectedCalculation && (
                <button 
                  onClick={() => {
                    setHistory([]);
                    localStorage.removeItem('calc-history');
                  }}
                  className="text-xs text-zinc-400 hover:text-red-500 flex items-center gap-1"
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
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                      <div className="text-xs text-zinc-400 mb-1">Problem</div>
                      <div className="font-medium text-zinc-900">{selectedCalculation.expression}</div>
                      <div className="text-2xl font-light text-indigo-600 mt-2">= {selectedCalculation.result}</div>
                    </div>
                    
                    <div className="prose prose-zinc prose-sm max-w-none">
                      <div className="text-xs text-zinc-400 mb-2 uppercase tracking-wider font-semibold">Steps & Explanation</div>
                      {isAiLoading ? (
                        <div className="flex items-center gap-2 text-zinc-400 py-8 justify-center">
                          <Loader2 className="animate-spin" size={18} />
                          <span>Gemini is thinking...</span>
                        </div>
                      ) : (
                        <div className="text-zinc-600 leading-relaxed">
                          <ReactMarkdown>{selectedCalculation.explanation || ''}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="history"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-3"
                  >
                    {history.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-zinc-400 space-y-2 py-20">
                        <div className="p-4 bg-zinc-100 rounded-full">
                          <HistoryIcon size={32} />
                        </div>
                        <p className="text-sm">No calculations yet</p>
                      </div>
                    ) : (
                      history.slice().reverse().map((item) => (
                        <div 
                          key={item.id}
                          className="group p-4 rounded-2xl bg-white border border-zinc-100 hover:border-indigo-200 hover:shadow-sm transition-all cursor-pointer"
                          onClick={() => handleExplain(item)}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-xs text-zinc-400 font-mono truncate max-w-[150px]">
                              {item.expression}
                            </span>
                            <span className="text-[10px] text-zinc-300">
                              {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="text-lg font-medium text-zinc-800">
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
          </div>
        </div>
      </div>

      {/* Footer info */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-zinc-400 uppercase tracking-[0.2em] font-medium">
        Powered by Gemini 3 Flash
      </div>
    </div>
  );
}

function CalcButton({ children, onClick, className, disabled }: { 
  children: React.ReactNode, 
  onClick?: () => void, 
  className?: string,
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "h-14 sm:h-16 flex items-center justify-center rounded-2xl text-xl font-medium transition-all active:scale-95 disabled:opacity-50",
        "bg-white text-zinc-800 hover:bg-zinc-50 border border-zinc-100 shadow-sm",
        className
      )}
    >
      {children}
    </button>
  );
}
