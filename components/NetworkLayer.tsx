import React, { useEffect, useState } from 'react';
import { NodeState, Message } from '../types';

interface NetworkLayerProps {
  nodes: NodeState[];
  messages: Message[];
  currentTime: number;
}

export const NetworkLayer: React.FC<NetworkLayerProps> = ({ nodes, messages, currentTime }) => {
  // Define connections for lines (Static topology)
  // P1/P2 connect to A1, A2, A3
  // A1, A2, A3 connect to Learner
  const connections = [
    { from: 1, to: 2 }, { from: 1, to: 3 }, { from: 1, to: 4 }, // P1 -> Acceptors
    { from: 6, to: 2 }, { from: 6, to: 3 }, { from: 6, to: 4 }, // P2 -> Acceptors
    { from: 2, to: 5 }, { from: 3, to: 5 }, { from: 4, to: 5 }, // Acceptors -> Learner
    { from: 2, to: 1 }, { from: 3, to: 1 }, { from: 4, to: 1 }, // Acceptors -> P1
    { from: 2, to: 6 }, { from: 3, to: 6 }, { from: 4, to: 6 }, // Acceptors -> P2
  ];

  const getNodePos = (id: number) => nodes.find(n => n.id === id)?.position || { x: 0, y: 0 };

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
      <defs>
        <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="8" refY="2" orient="auto">
          <polygon points="0 0, 6 2, 0 4" fill="#334155" />
        </marker>
      </defs>

      {/* Static Lines */}
      {connections.map((conn, idx) => {
        const start = getNodePos(conn.from);
        const end = getNodePos(conn.to);
        // Don't draw if node 6 (P2) is hidden in Basic scenario, or if nodes are missing
        if (!start.x || !end.x) return null; 
        
        return (
          <line
            key={`conn-${idx}`}
            x1={`${start.x}%`}
            y1={`${start.y}%`}
            x2={`${end.x}%`}
            y2={`${end.y}%`}
            stroke="#1e293b"
            strokeWidth="1"
            markerEnd="url(#arrowhead)"
          />
        );
      })}

      {/* In-Flight Messages */}
      {messages.filter(m => m.status === 'IN_FLIGHT').map((msg) => {
        const start = getNodePos(msg.from);
        const end = getNodePos(msg.to);
        
        // Calculate progress based on time
        const totalDuration = msg.arrivalTime - msg.sendTime;
        const elapsed = currentTime - msg.sendTime;
        let progress = elapsed / totalDuration;
        if (progress < 0) progress = 0;
        if (progress > 1) progress = 1;

        const currentX = start.x + (end.x - start.x) * progress;
        const currentY = start.y + (end.y - start.y) * progress;

        const color = msg.type === 'PREPARE' || msg.type === 'PROMISE' ? '#fbbf24' : // Yellow
                      msg.type === 'ACCEPT' || msg.type === 'ACCEPTED' ? '#60a5fa' : // Blue
                      '#ef4444'; // Red (Reject)

        return (
          <g key={msg.id} style={{ transition: 'all 0.05s linear' }}>
            <circle
              cx={`${currentX}%`}
              cy={`${currentY}%`}
              r="4"
              fill={color}
              stroke="white"
              strokeWidth="1"
            />
            {/* Tooltip-ish text for message ID/Content */}
            <text x={`${currentX}%`} y={`${currentY}%`} dy="-8" textAnchor="middle" fill={color} fontSize="10" fontWeight="bold">
              {msg.type === 'PREPARE' ? `P(${msg.proposalId})` : 
               msg.type === 'PROMISE' ? `OK` :
               msg.type === 'ACCEPT' ? `Val` : 
               msg.type === 'REJECT' ? `X` : ''}
            </text>
          </g>
        );
      })}
    </svg>
  );
};
