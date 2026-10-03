import React, { useState } from 'react';
import { AlertTriangle, ShieldCheck, X } from 'lucide-react';
import { getTranslation } from '../data/translations';

interface DisclaimerBannerProps {
  langCode?: string;
}

export const DisclaimerBanner: React.FC<DisclaimerBannerProps> = ({ langCode = 'en' }) => {
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const t = getTranslation(langCode);

  if (dismissed) return null;

  return (
    <div className="bg-amber-950/40 border-b border-amber-600/30 text-amber-200/90 px-4 py-2 text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-2 z-40 backdrop-blur-md">
      <div className="flex items-start md:items-center gap-2 flex-1">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 md:mt-0" />
        <div>
          <span className="font-semibold text-amber-300">{t.disclaimer_badge}:</span>{' '}
          {t.disclaimer_text}{' '}
          <button
            onClick={() => setExpanded(!expanded)}
            className="underline text-amber-300 hover:text-amber-100 font-medium ml-1 cursor-pointer"
          >
            {expanded ? '▲ Close' : '▼ Safety Details'}
          </button>
          {expanded && (
            <div className="mt-2 text-amber-200/80 leading-relaxed bg-amber-950/70 p-2.5 rounded-lg border border-amber-800/40">
              Predictions, kinetic curves, enzyme indicators, and graph representations should not be treated as a substitute
              for qualified medical advice, clinical diagnosis, or patient-specific prescribing decisions. Real-world drug
              therapy must account for individual patient genetics, renal/hepatic biomarkers, and validated clinical protocols.
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
        <span className="inline-flex items-center gap-1 text-[11px] text-amber-400/80 bg-amber-900/30 px-2 py-0.5 rounded border border-amber-700/30">
          <ShieldCheck className="w-3 h-3" /> Research Mode
        </span>
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-400 hover:text-amber-100 p-0.5 cursor-pointer"
          aria-label="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
