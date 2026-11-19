import React, { useEffect, useState } from 'react';
import { Flame } from 'lucide-react';
import type { HeatLevel } from '../types/roast';

interface LoadingRoastProps {
  fileName: string;
  heatLevel: HeatLevel;
}

const LOADING_MESSAGES = [
  'Uncapping the red editorial pen...',
  'Counting occurrences of "spearheaded" and "synergy"...',
  'Calculating how much of that 40% impact was actually luck...',
  'Inspecting suspiciously generous self-rated skill bars...',
  'Drafting the polite recruiter rejection email you usually get...',
  'Sharpening the punchlines and writing real fixes...',
];

const HEAT_LABELS: Record<HeatLevel, string> = {
  mild: 'Mild Simmer',
  medium: 'Medium Well',
  crispy: 'Extra Crispy',
};

export const LoadingRoast: React.FC<LoadingRoastProps> = ({ fileName, heatLevel }) => {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      aria-live="polite"
      className="max-w-3xl mx-auto px-6 py-20 md:py-28 text-center"
    >
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] mb-6">
        <Flame className="w-6 h-6 animate-pulse" aria-hidden="true" />
      </div>

      <div className="text-xs font-medium tracking-wide text-[#71717A] mb-3">
        <span>{fileName}</span>
        <span aria-hidden="true" className="mx-2">·</span>
        <span>Heat: {HEAT_LABELS[heatLevel]}</span>
      </div>

      <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-semibold text-[#18181B] tracking-tight mb-4 [text-wrap:balance]">
        Reading your career choices closely
      </h2>

      <p className="text-base text-[#52525B] min-h-[1.75rem] transition-opacity duration-200">
        {LOADING_MESSAGES[msgIndex]}
      </p>

      <div className="mt-8 max-w-md mx-auto h-1 bg-[#E5DFD3] rounded-full overflow-hidden">
        <div className="h-full bg-[#DC2626] w-1/2 rounded-full animate-[roastSlide_1.4s_ease-in-out_infinite]" />
      </div>

      <style>{`
        @keyframes roastSlide {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(60%); }
          100% { transform: translateX(220%); }
        }
      `}</style>
    </section>
  );
};
