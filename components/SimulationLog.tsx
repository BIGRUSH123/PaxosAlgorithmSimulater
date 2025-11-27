import React, { useEffect, useRef } from 'react';
import { RESOURCES } from '../locales';

interface SimulationLogProps {
  logs: string[];
  lang: 'en' | 'zh';
}

export const SimulationLog: React.FC<SimulationLogProps> = ({ logs, lang }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const t = RESOURCES[lang];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="h-full flex flex-col rounded-lg border border-slate-700 bg-slate-900 overflow-hidden">
      <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 font-semibold text-sm text-slate-300 uppercase tracking-wider">
        {t.app.logsTitle}
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-xs">
        {logs.length === 0 && <span className="text-slate-500 italic">{t.app.logsReady}</span>}
        {logs.map((log, idx) => (
          <div key={idx} className="text-slate-300 border-l-2 border-slate-600 pl-2">
            <span className="text-slate-500 mr-2">[{idx + 1}]</span>
            {log}
          </div>
        ))}
      </div>
    </div>
  );
};