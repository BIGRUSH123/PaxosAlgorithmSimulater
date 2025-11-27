import React from 'react';
import { NodeState, Role } from '../types';
import { RESOURCES } from '../locales';
import { Server, User, Database, Eye, Skull } from 'lucide-react';

interface NodeVisualProps {
  node: NodeState;
  isActive: boolean;
  lang: 'en' | 'zh';
}

export const NodeVisual: React.FC<NodeVisualProps> = ({ node, isActive, lang }) => {
  const t = RESOURCES[lang];

  const getIcon = () => {
    if (node.isDead) return <Skull className="h-6 w-6 text-slate-600" />;
    switch (node.role) {
      case Role.CLIENT: return <User className="h-6 w-6 text-blue-400" />;
      case Role.PROPOSER: return <Server className={`h-6 w-6 ${node.id === 1 ? 'text-yellow-400' : 'text-orange-400'}`} />;
      case Role.ACCEPTOR: return <Database className="h-6 w-6 text-green-400" />;
      case Role.LEARNER: return <Eye className="h-6 w-6 text-purple-400" />;
    }
  };

  const getLabel = () => {
    const roleName = t.roles[node.role as keyof typeof t.roles] || node.role;
    switch (node.role) {
      case Role.CLIENT: return roleName;
      case Role.PROPOSER: return `${roleName} ${node.id}`;
      case Role.ACCEPTOR: return `${roleName} ${node.id}`;
      case Role.LEARNER: return roleName;
    }
    return roleName;
  };

  const isProposer = node.role === Role.PROPOSER;
  const isDead = node.isDead;

  return (
    <div 
      className={`
        absolute transform -translate-x-1/2 -translate-y-1/2
        flex flex-col items-center p-2 rounded-lg border-2 transition-all duration-300 w-24 sm:w-28
        ${isDead ? 'opacity-50 border-slate-800 grayscale' : ''}
        ${isActive && !isDead ? 'border-blue-500 bg-blue-900/30 scale-110 shadow-lg shadow-blue-500/20 z-10' : 'border-slate-700 bg-slate-900 z-0'} 
      `}
      style={{ left: `${node.position.x}%`, top: `${node.position.y}%` }}
    >
      <div className={`mb-1 rounded-full bg-slate-900 p-2 border border-slate-600 ${isProposer ? 'ring-1 ring-slate-700' : ''}`}>
        {getIcon()}
      </div>
      <span className="font-bold text-slate-200 text-[10px] sm:text-xs whitespace-nowrap">{getLabel()}</span>
      
      {node.role === Role.ACCEPTOR && (
        <div className="mt-1 w-full text-[9px] sm:text-[10px] space-y-0.5 bg-black/40 p-1.5 rounded overflow-hidden border border-slate-800/50">
          <div className="flex justify-between">
            <span className="text-slate-400">{t.node.minP}:</span>
            <span className="font-mono text-green-300">{node.minProposal}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">{t.node.accP}:</span>
            <span className="font-mono text-yellow-300">{node.acceptedProposal ?? '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">{t.node.val}:</span>
            <span className="font-mono text-blue-300 truncate max-w-[40px]" title={node.acceptedValue || ''}>{node.acceptedValue ?? '-'}</span>
          </div>
        </div>
      )}
    </div>
  );
};
