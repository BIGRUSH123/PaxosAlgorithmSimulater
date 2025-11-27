import React from 'react';

interface TooltipProps {
  children: React.ReactNode;
  text: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ children, text }) => {
  return (
    <div className="group relative flex items-center">
      {children}
      <div className="absolute bottom-full left-1/2 mb-2 hidden w-48 -translate-x-1/2 rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:block group-hover:opacity-100">
        {text}
        <div className="absolute left-1/2 top-full -mt-1 h-2 w-2 -translate-x-1/2 rotate-45 bg-gray-900"></div>
      </div>
    </div>
  );
};