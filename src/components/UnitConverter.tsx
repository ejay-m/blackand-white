import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRightLeft, Scale, Thermometer, Ruler, 
  Clock, Zap, Box, Maximize, Wind, Droplets,
  ChevronDown, Search, X
} from 'lucide-react';
import { unit, evaluate } from 'mathjs';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { audioService } from '../utils/audio';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Category = {
  id: string;
  name: string;
  icon: React.ReactNode;
  units: string[];
};

const CATEGORIES: Category[] = [
  {
    id: 'length',
    name: 'Length',
    icon: <Ruler size={18} />,
    units: ['meter', 'centimeter', 'millimeter', 'kilometer', 'inch', 'foot', 'yard', 'mile']
  },
  {
    id: 'weight',
    name: 'Weight',
    icon: <Scale size={18} />,
    units: ['gram', 'kilogram', 'milligram', 'ounce', 'pound', 'ton']
  },
  {
    id: 'temperature',
    name: 'Temperature',
    icon: <Thermometer size={18} />,
    units: ['celsius', 'fahrenheit', 'kelvin']
  },
  {
    id: 'area',
    name: 'Area',
    icon: <Maximize size={18} />,
    units: ['m2', 'cm2', 'km2', 'sqin', 'sqft', 'sqyd', 'acre', 'hectare']
  },
  {
    id: 'volume',
    name: 'Volume',
    icon: <Box size={18} />,
    units: ['m3', 'liter', 'milliliter', 'gallon', 'quart', 'pint', 'cup', 'floz']
  },
  {
    id: 'time',
    name: 'Time',
    icon: <Clock size={18} />,
    units: ['second', 'minute', 'hour', 'day', 'week', 'month', 'year']
  },
  {
    id: 'speed',
    name: 'Speed',
    icon: <Wind size={18} />,
    units: ['m/s', 'km/h', 'mph', 'knot']
  },
  {
    id: 'energy',
    name: 'Energy',
    icon: <Zap size={18} />,
    units: ['joule', 'kilojoule', 'calorie', 'kilocalorie', 'Wh', 'kWh']
  }
];

interface UnitConverterProps {
  theme: 'light' | 'dark' | 'colorful' | 'e2';
  onClose: () => void;
  onCopyResult: (value: string) => void;
}

export function UnitConverter({ theme, onClose, onCopyResult }: UnitConverterProps) {
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [fromUnit, setFromUnit] = useState(CATEGORIES[0].units[0]);
  const [toUnit, setToUnit] = useState(CATEGORIES[0].units[1]);
  const [fromValue, setFromValue] = useState('1');
  const [toValue, setToValue] = useState('');

  useEffect(() => {
    setFromUnit(category.units[0]);
    setToUnit(category.units[1] || category.units[0]);
  }, [category]);

  useEffect(() => {
    try {
      if (fromValue === '' || isNaN(Number(fromValue))) {
        setToValue('');
        return;
      }

      let result: any;
      if (category.id === 'temperature') {
        // Temperature conversion in mathjs is special
        result = unit(Number(fromValue), fromUnit).toNumber(toUnit);
      } else {
        result = evaluate(`${fromValue} ${fromUnit} to ${toUnit}`);
      }
      
      // Format result to be readable
      const formatted = typeof result === 'number' 
        ? Number(result.toFixed(6)).toString() 
        : result.toString();
      
      setToValue(formatted);
    } catch (error) {
      console.error('Conversion error:', error);
      setToValue('Error');
    }
  }, [fromValue, fromUnit, toUnit, category]);

  const swapUnits = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
    setFromValue(toValue === 'Error' ? '1' : toValue);
  };

  const isDark = theme === 'dark' || theme === 'e2';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "rounded-[2.5rem] p-8 shadow-2xl border transition-all duration-500 flex flex-col h-full",
        theme === 'e2' ? "bg-[#0f0f1a]/80 backdrop-blur-2xl border-[#1e1e30]" : (isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200")
      )}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className={cn("text-xl font-semibold flex items-center gap-2", isDark ? "text-white" : "text-zinc-900")}>
          <ArrowRightLeft size={20} className="text-indigo-500" />
          Unit Converter
        </h2>
        <button 
          onClick={() => {
            audioService.playAction();
            onClose();
          }}
          className={cn("p-2 rounded-full transition-colors", isDark ? "hover:bg-zinc-800 text-zinc-400" : "hover:bg-zinc-100 text-zinc-500")}
        >
          <X size={20} />
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-4 gap-2 mb-8">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              audioService.playAction();
              setCategory(cat);
            }}
            className={cn(
              "flex flex-col items-center justify-center p-3 rounded-2xl border transition-all gap-1",
              category.id === cat.id
                ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                : theme === 'e2'
                  ? "bg-[#1e1e30]/50 border-[#2a2a40] text-zinc-400 hover:border-zinc-600"
                  : isDark 
                    ? "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600" 
                    : "bg-zinc-50 border-zinc-100 text-zinc-500 hover:border-zinc-200"
            )}
          >
            {cat.icon}
            <span className="text-[10px] font-medium uppercase tracking-wider">{cat.name}</span>
          </button>
        ))}
      </div>

      <div className="space-y-6 flex-1">
        {/* From Section */}
        <div className="space-y-2">
          <label className={cn("text-xs font-bold uppercase tracking-widest block", isDark ? "text-zinc-500" : "text-zinc-400")}>
            From
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={fromValue}
              onChange={(e) => setFromValue(e.target.value)}
              className={cn(
                "flex-1 text-2xl font-light p-4 rounded-2xl border outline-none transition-all",
                theme === 'e2'
                  ? "bg-[#1e1e30]/50 border-[#2a2a40] text-white focus:ring-2 focus:ring-indigo-500/20"
                  : isDark 
                    ? "bg-zinc-800 border-zinc-700 text-white focus:ring-2 focus:ring-indigo-500/20" 
                    : "bg-zinc-50 border-zinc-100 text-zinc-900 focus:ring-2 focus:ring-indigo-500/20"
              )}
            />
            <select
              value={fromUnit}
              onChange={(e) => setFromUnit(e.target.value)}
              className={cn(
                "w-32 p-4 rounded-2xl border outline-none transition-all appearance-none cursor-pointer font-medium",
                theme === 'e2'
                  ? "bg-[#1e1e30]/50 border-[#2a2a40] text-white"
                  : isDark 
                    ? "bg-zinc-800 border-zinc-700 text-white" 
                    : "bg-zinc-50 border-zinc-100 text-zinc-900"
              )}
            >
              {category.units.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <button
            onClick={() => {
              audioService.playOperator();
              swapUnits();
            }}
            className={cn(
              "p-3 rounded-full border shadow-sm transition-all hover:rotate-180",
              theme === 'e2'
                ? "bg-[#1e1e30]/50 border-[#2a2a40] text-indigo-400 hover:bg-[#2e2e4a]"
                : isDark ? "bg-zinc-800 border-zinc-700 text-indigo-400 hover:bg-zinc-700" : "bg-white border-zinc-200 text-indigo-600 hover:bg-zinc-50"
            )}
          >
            <ArrowRightLeft size={20} className="rotate-90" />
          </button>
        </div>

        {/* To Section */}
        <div className="space-y-2">
          <label className={cn("text-xs font-bold uppercase tracking-widest block", isDark ? "text-zinc-500" : "text-zinc-400")}>
            To
          </label>
          <div className="flex gap-2">
            <div
              className={cn(
                "flex-1 text-2xl font-light p-4 rounded-2xl border transition-all truncate",
                theme === 'e2'
                  ? "bg-[#050510] border-[#1e1e30] text-indigo-400"
                  : isDark 
                    ? "bg-zinc-950 border-zinc-800 text-indigo-400" 
                    : "bg-zinc-100 border-zinc-200 text-indigo-600"
              )}
            >
              {toValue || '0'}
            </div>
            <select
              value={toUnit}
              onChange={(e) => setToUnit(e.target.value)}
              className={cn(
                "w-32 p-4 rounded-2xl border outline-none transition-all appearance-none cursor-pointer font-medium",
                theme === 'e2'
                  ? "bg-[#1e1e30]/50 border-[#2a2a40] text-white"
                  : isDark 
                    ? "bg-zinc-800 border-zinc-700 text-white" 
                    : "bg-zinc-50 border-zinc-100 text-zinc-900"
              )}
            >
              {category.units.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className={cn("mt-8 p-4 rounded-2xl border text-xs leading-relaxed flex items-center justify-between", theme === 'e2' ? "bg-indigo-950/20 border-indigo-500/20 text-indigo-400" : isDark ? "bg-zinc-800/50 border-zinc-700 text-zinc-400" : "bg-indigo-50 border-indigo-100 text-indigo-600")}>
        <div>
          <p className="font-semibold mb-1">Conversion Formula:</p>
          <p className="font-mono">
            {fromValue} {fromUnit} = {toValue} {toUnit}
          </p>
        </div>
        <button
          onClick={() => {
            audioService.playSuccess();
            onCopyResult(toValue);
          }}
          className={cn(
            "px-3 py-2 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all",
            isDark ? "bg-indigo-600 text-white hover:bg-indigo-500" : "bg-indigo-600 text-white hover:bg-indigo-700"
          )}
        >
          Copy to Calc
        </button>
      </div>
    </motion.div>
  );
}
