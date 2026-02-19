import React from 'react';
import { motion } from 'motion/react';

const MATH_SYMBOLS = ['∑', 'π', '∞', '√', '∫', 'Δ', 'θ', 'λ', 'Ω', '≈', '≠', '±', '∂', '∇', '∈', '∀', '∃', '∠', '≡', 'ψ', 'φ', 'ρ'];
const MATH_TERMS = ['sin(x)', 'cos(y)', 'log(n)', 'lim', 'exp', 'f(x)', 'dy/dx', 'E=mc²', 'H₂O', 'NaCl', 'F=ma', 'PV=nRT', 'λ=h/p', 'c=λf', 'G=6.67e-11'];
const NUMBERS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '01', '10', '110', 'π', 'e', 'φ'];

export const MathBackground = ({ theme }: { theme: 'light' | 'dark' | 'colorful' }) => {
  const isDark = theme === 'dark';
  const dotColor = isDark ? '#1e293b' : '#e2e8f0';
  const symbolColor = isDark ? 'text-zinc-800' : 'text-zinc-200';
  const accentColor = theme === 'colorful' ? 'text-indigo-200' : (isDark ? 'text-indigo-900/40' : 'text-indigo-100');

  return (
    <div className={cn("fixed inset-0 -z-10 overflow-hidden pointer-events-none select-none transition-all duration-1000", 
      isDark ? 'bg-zinc-950' : (theme === 'colorful' ? 'bg-indigo-50' : 'bg-white')
    )}>
      {/* Dynamic Background Gradient */}
      <div className={cn(
        "absolute inset-0 transition-opacity duration-1000",
        isDark ? "opacity-20 bg-[radial-gradient(circle_at_20%_30%,#1e1b4b_0%,transparent_50%),radial-gradient(circle_at_80%_70%,#312e81_0%,transparent_50%)]" 
               : "opacity-40 bg-[radial-gradient(circle_at_20%_30%,#e0e7ff_0%,transparent_50%),radial-gradient(circle_at_80%_70%,#f5f3ff_0%,transparent_50%)]"
      )} />

      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-30" 
        style={{ 
          backgroundImage: `linear-gradient(${dotColor} 1px, transparent 1px), linear-gradient(90deg, ${dotColor} 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} 
      />
      
      {/* Floating Elements Layer 1 (Slow, Background Symbols) */}
      {Array.from({ length: 25 }).map((_, i) => (
        <motion.div
          key={`l1-${i}`}
          initial={{ 
            x: Math.random() * 100 + '%', 
            y: Math.random() * 100 + '%',
            opacity: 0,
            scale: 0.4 + Math.random() * 0.4
          }}
          animate={{ 
            y: ['-10%', '110%'],
            opacity: [0, 0.2, 0.4, 0.2, 0],
            rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)]
          }}
          transition={{ 
            duration: Math.random() * 40 + 40, 
            repeat: Infinity,
            ease: "linear",
            delay: -Math.random() * 40
          }}
          className={cn("absolute font-serif text-3xl", symbolColor)}
        >
          {MATH_SYMBOLS[i % MATH_SYMBOLS.length]}
        </motion.div>
      ))}

      {/* Floating Elements Layer 2 (Medium, Numbers & Science) */}
      {Array.from({ length: 30 }).map((_, i) => (
        <motion.div
          key={`l2-${i}`}
          initial={{ 
            x: Math.random() * 100 + '%', 
            y: -50,
            opacity: 0,
            scale: 0.6 + Math.random() * 0.4
          }}
          animate={{ 
            y: ['-10%', '110%'],
            opacity: [0, 0.5, 0],
            x: [null, (Math.random() * 20 - 10) + '%']
          }}
          transition={{ 
            duration: Math.random() * 20 + 20, 
            repeat: Infinity,
            ease: "linear",
            delay: -Math.random() * 20
          }}
          className={cn("absolute font-mono text-2xl font-bold", accentColor)}
        >
          {NUMBERS[i % NUMBERS.length]}
        </motion.div>
      ))}

      {/* Floating Elements Layer 3 (Fast, Scientific Terms) */}
      {Array.from({ length: 15 }).map((_, i) => (
        <motion.div
          key={`l3-${i}`}
          initial={{ 
            x: Math.random() * 100 + '%', 
            y: -50,
            opacity: 0,
            scale: 1
          }}
          animate={{ 
            y: ['-10%', '110%'],
            opacity: [0, 0.3, 0],
            skewX: [0, 15, -15, 0]
          }}
          transition={{ 
            duration: Math.random() * 15 + 15, 
            repeat: Infinity,
            ease: "linear",
            delay: -Math.random() * 15
          }}
          className={cn("absolute font-mono text-sm tracking-widest italic font-medium", symbolColor)}
        >
          {MATH_TERMS[i % MATH_TERMS.length]}
        </motion.div>
      ))}

      {/* Large Faint Formulas */}
      <motion.div 
        animate={{ opacity: [0.05, 0.1, 0.05], x: [-20, 20, -20] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className={cn("absolute top-[15%] left-[10%] text-6xl font-serif italic pointer-events-none opacity-10", symbolColor)}
      >
        ∫ e^x dx = e^x + C
      </motion.div>

      <motion.div 
        animate={{ opacity: [0.05, 0.1, 0.05], x: [20, -20, 20] }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        className={cn("absolute bottom-[20%] right-[15%] text-6xl font-serif italic pointer-events-none opacity-10", symbolColor)}
      >
        ∇ · B = 0
      </motion.div>

      {/* Radial Gradient Overlay for Depth */}
      <div className={cn(
        "absolute inset-0 pointer-events-none",
        isDark 
          ? "bg-[radial-gradient(circle_at_center,transparent_0%,rgba(9,9,11,0.6)_100%)]" 
          : "bg-[radial-gradient(circle_at_center,transparent_0%,rgba(255,255,255,0.4)_100%)]"
      )} />
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
