
import React, { useState, useEffect } from 'react';
import { Role, NodeState, Phase, Message, SimulationState, Scenario, Position, ProposerState } from './types';
import { NodeVisual } from './components/NodeVisual';
import { NetworkLayer } from './components/NetworkLayer';
import { SimulationLog } from './components/SimulationLog';
import { RESOURCES } from './locales';
import { RefreshCw, Play, Languages, Send, ShieldAlert, CheckCircle2, RotateCcw, Target } from 'lucide-react';

// Layout Configuration (Percent)
const POSITIONS: Record<number, Position> = {
  0: { x: 10, y: 15 }, // Client
  1: { x: 20, y: 40 }, // P1
  6: { x: 20, y: 70 }, // P2
  2: { x: 50, y: 25 }, // A1
  3: { x: 50, y: 55 }, // A2
  4: { x: 50, y: 85 }, // A3
  5: { x: 85, y: 55 }, // Learner
};

const INITIAL_NODES: NodeState[] = [
  { id: 0, role: Role.CLIENT, minProposal: 0, acceptedProposal: null, acceptedValue: null, position: POSITIONS[0] },
  { id: 1, role: Role.PROPOSER, minProposal: 0, acceptedProposal: null, acceptedValue: null, position: POSITIONS[1] },
  { id: 2, role: Role.ACCEPTOR, minProposal: 0, acceptedProposal: null, acceptedValue: null, position: POSITIONS[2] },
  { id: 3, role: Role.ACCEPTOR, minProposal: 0, acceptedProposal: null, acceptedValue: null, position: POSITIONS[3] },
  { id: 4, role: Role.ACCEPTOR, minProposal: 0, acceptedProposal: null, acceptedValue: null, position: POSITIONS[4] },
  { id: 5, role: Role.LEARNER, minProposal: 0, acceptedProposal: null, acceptedValue: null, position: POSITIONS[5] },
  { id: 6, role: Role.PROPOSER, minProposal: 0, acceptedProposal: null, acceptedValue: null, position: POSITIONS[6] }, 
];

const INITIAL_PROPOSER_STATE: ProposerState = {
  phase: 'IDLE',
  currentProposalId: 0,
  promisesReceived: 0,
  highestPromisedId: 0,
  highestPromisedValue: null,
};

// Time tick interval (ms)
const TICK_RATE = 50;

type Lang = 'en' | 'zh';

const format = (str: string, args: Record<string, string | number>) => {
  return str.replace(/{(\w+)}/g, (_, k) => args[k] !== undefined ? String(args[k]) : `{${k}}`);
};

export default function App() {
  const [lang, setLang] = useState<Lang>('en');
  const t = RESOURCES[lang];

  // Simulation State
  const [state, setState] = useState<SimulationState>({
    scenario: null,
    clientValue: '',
    proposers: {
      1: { ...INITIAL_PROPOSER_STATE },
      6: { ...INITIAL_PROPOSER_STATE },
    },
    nodes: JSON.parse(JSON.stringify(INITIAL_NODES)),
    messages: [],
    logs: [],
  });

  // Independent inputs for P1 and P2
  const [inputValP1, setInputValP1] = useState('');
  const [inputValP2, setInputValP2] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Simulation Timer
  const [currentTime, setCurrentTime] = useState(0);

  // --- ENGINE LOOP ---
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(prev => prev + TICK_RATE);
    }, TICK_RATE);
    return () => clearInterval(interval);
  }, []);

  // Check for Message Arrivals
  useEffect(() => {
    if (state.messages.length === 0) return;

    const arrivedMessages = state.messages.filter(m => m.status === 'IN_FLIGHT' && currentTime >= m.arrivalTime);
    
    if (arrivedMessages.length > 0) {
      // Process arrived messages
      arrivedMessages.forEach(msg => {
         handleMessageArrival(msg);
      });

      // Update message status
      setState(prev => ({
        ...prev,
        messages: prev.messages.map(m => 
          arrivedMessages.find(am => am.id === m.id) ? { ...m, status: 'DELIVERED' } : m
        )
      }));
    }
  }, [currentTime, state.messages]);


  // --- LOGIC: Message Processing ---

  const handleMessageArrival = (msg: Message) => {
    // 1. Log Arrival
    addLog(format(t.messages.msgArrived, { to: msg.to, type: msg.type, from: msg.from }));

    // 2. Route to Node Logic
    setState(prev => {
        const nodes = [...prev.nodes];
        const targetNode = nodes.find(n => n.id === msg.to);
        if (!targetNode || targetNode.isDead) return prev; 

        const newMessages: Message[] = [];
        
        // We need to update specific proposer state if target is a proposer
        let updatedProposers = { ...prev.proposers };

        // --- ACCEPTOR LOGIC ---
        if (targetNode.role === Role.ACCEPTOR) {
            if (msg.type === 'PREPARE') {
                if (msg.proposalId > targetNode.minProposal) {
                    targetNode.minProposal = msg.proposalId;
                    newMessages.push(createMessage(msg.to, msg.from, 'PROMISE', msg.proposalId, targetNode.acceptedValue, targetNode.acceptedProposal));
                } else {
                    newMessages.push(createMessage(msg.to, msg.from, 'REJECT', msg.proposalId, null, targetNode.minProposal));
                }
            } else if (msg.type === 'ACCEPT') {
                if (msg.proposalId >= targetNode.minProposal) {
                    targetNode.minProposal = msg.proposalId;
                    targetNode.acceptedProposal = msg.proposalId;
                    targetNode.acceptedValue = msg.value || null;
                    newMessages.push(createMessage(msg.to, 5, 'ACCEPTED', msg.proposalId, msg.value));
                    newMessages.push(createMessage(msg.to, msg.from, 'ACCEPTED', msg.proposalId, msg.value));
                } else {
                    newMessages.push(createMessage(msg.to, msg.from, 'REJECT', msg.proposalId));
                }
            }
        }

        // --- PROPOSER LOGIC ---
        if (targetNode.role === Role.PROPOSER) {
            const pState = { ...updatedProposers[targetNode.id] };

            if (msg.type === 'PROMISE') {
                if (msg.proposalId === pState.currentProposalId && pState.phase === 'PROMISE_WAIT') {
                    pState.promisesReceived += 1;
                    
                    if (msg.prevAcceptedId && msg.prevAcceptedId > pState.highestPromisedId) {
                        pState.highestPromisedId = msg.prevAcceptedId;
                        pState.highestPromisedValue = msg.prevAcceptedValue || null;
                    } else if (msg.prevAcceptedId && msg.prevAcceptedId === pState.highestPromisedId && !pState.highestPromisedValue) {
                         pState.highestPromisedValue = msg.prevAcceptedValue || null;
                    }

                    if (pState.promisesReceived >= 2) {
                        pState.phase = 'PROPOSE_READY';
                    }
                }
            } else if (msg.type === 'REJECT') {
                if (msg.proposalId === pState.currentProposalId) {
                     // Even one reject with higher N means we are effectively done for this round
                     pState.phase = 'FAILURE';
                }
            }
            
            updatedProposers[targetNode.id] = pState;
        }

        // --- LEARNER LOGIC ---
        if (targetNode.role === Role.LEARNER) {
             if (msg.type === 'ACCEPTED') {
                 // Check globally if we have enough accepted msgs for this proposal
                 const delivered = prev.messages.filter(m => m.type === 'ACCEPTED' && m.proposalId === msg.proposalId && m.status === 'DELIVERED').length;
                 // +1 for the current one processing
                 if (delivered + 1 >= 2) {
                    // Update all proposers to SUCCESS visually if they were involved
                    Object.keys(updatedProposers).forEach(pid => {
                        const id = Number(pid);
                        // If this proposer started this ID, mark success
                        if (updatedProposers[id].currentProposalId === msg.proposalId) {
                            updatedProposers[id].phase = 'SUCCESS';
                        }
                    });
                 }
             }
        }

        return {
            ...prev,
            nodes,
            messages: [...prev.messages, ...newMessages],
            proposers: updatedProposers,
        };
    });
  };


  // --- HELPERS ---

  const createMessage = (from: number, to: number, type: Message['type'], proposalId: number, value: string | null = null, prevId: number | null = null): Message => {
    let baseDelay = 800;
    // Simple jitter
    const delay = Math.floor(baseDelay + Math.random() * 400);

    return {
        id: Math.random().toString(36).substr(2, 9),
        from,
        to,
        type,
        proposalId,
        value,
        prevAcceptedId: prevId,
        prevAcceptedValue: value, 
        sendTime: currentTime,
        arrivalTime: currentTime + delay,
        status: 'IN_FLIGHT'
    };
  };

  const addLog = (msg: string) => {
    setState(prev => ({ ...prev, logs: [...prev.logs, msg] }));
  };

  const reset = () => {
    setState({
      scenario: null,
      clientValue: '',
      proposers: {
        1: { ...INITIAL_PROPOSER_STATE },
        6: { ...INITIAL_PROPOSER_STATE },
      },
      nodes: JSON.parse(JSON.stringify(INITIAL_NODES)),
      messages: [],
      logs: [],
    });
    setInputValP1('');
    setInputValP2('');
    setErrorMsg('');
    setCurrentTime(0);
  };

  const startScenario = (scenario: Scenario) => {
    const tScen = t.scenarios[scenario];
    let nodes = JSON.parse(JSON.stringify(INITIAL_NODES));
    
    // Reset Proposers
    const newProposers = {
        1: { ...INITIAL_PROPOSER_STATE },
        6: { ...INITIAL_PROPOSER_STATE },
    };

    let logs = [format(t.messages.startScenario, { scenario: tScen.title })];
    let clientVal = '';

    if (scenario === Scenario.DISCOVERY) {
        // Pre-configure: A2, A3 accepted N=5, V="Golden Ticket"
        nodes = nodes.map((n: NodeState) => {
            if (n.id === 2 || n.id === 3) {
                return { ...n, minProposal: 5, acceptedProposal: 5, acceptedValue: 'Golden Ticket' };
            }
            if (n.id === 1) return { ...n, isDead: true };
            return n;
        });
        newProposers[6].phase = 'PREPARE_READY';
        newProposers[6].currentProposalId = 5;
        logs.push(format(t.messages.p2Start, { val: "New Value" }));
        clientVal = "New Value";
    } else if (scenario === Scenario.DUELING) {
        newProposers[1].phase = 'PREPARE_READY';
        newProposers[1].currentProposalId = 0;
        newProposers[6].phase = 'PREPARE_READY';
        newProposers[6].currentProposalId = 0;
        clientVal = "Blue";
        logs.push("Dueling Mode: Manual control enabled for P1 and P2.");
    } else {
        // Basic
        logs.push("Client wants to set value 'Hello'.");
        clientVal = "Hello";
        newProposers[1].phase = 'PREPARE_READY';
    }

    setState(prev => ({
        ...prev,
        scenario,
        nodes,
        logs,
        clientValue: clientVal,
        proposers: newProposers,
    }));
  };

  const toggleLang = () => setLang(prev => prev === 'en' ? 'zh' : 'en');


  // --- USER ACTIONS ---

  const handleSendPrepare = (proposerId: number, proposalIdStr: string, targets: number[]) => {
      const n = parseInt(proposalIdStr);
      const currentId = state.proposers[proposerId].currentProposalId;

      if (isNaN(n)) { setErrorMsg("Enter a number"); return; }
      if (n <= currentId) { 
          setErrorMsg(format(t.messages.errorProposalEqual, { n })); 
          return; 
      }

      setErrorMsg('');
      
      const msgs: Message[] = targets.map(aid => createMessage(proposerId, aid, 'PREPARE', n));
      
      addLog(format(t.messages.msgSent, { from: proposerId, to: targets.join(','), type: "PREPARE", n, delay: "~800" }));

      setState(prev => ({
          ...prev,
          proposers: {
              ...prev.proposers,
              [proposerId]: {
                  ...prev.proposers[proposerId],
                  currentProposalId: n,
                  phase: 'PROMISE_WAIT',
                  promisesReceived: 0,
                  highestPromisedId: 0,
                  highestPromisedValue: null
              }
          },
          messages: [...prev.messages, ...msgs],
      }));

      if (proposerId === 1) setInputValP1('');
      else setInputValP2('');
  };

  const handleSendAccept = (proposerId: number, val: string) => {
      const pState = state.proposers[proposerId];
      const requiredVal = pState.highestPromisedValue;

      if (requiredVal && val !== requiredVal) {
          setErrorMsg(format(t.messages.discoveryForce, { val: requiredVal }));
          return;
      }
      if (!val) { setErrorMsg("Value required"); return; }

      const n = pState.currentProposalId;
      const msgs: Message[] = [2,3,4].map(aid => createMessage(proposerId, aid, 'ACCEPT', n, val));
      
      addLog(format(t.messages.msgSent, { from: proposerId, to: "All", type: "ACCEPT", n, delay: "VAR" }));

      setState(prev => ({
          ...prev,
          messages: [...prev.messages, ...msgs],
          proposers: {
              ...prev.proposers,
              [proposerId]: {
                  ...pState,
                  phase: 'ACCEPT_WAIT'
              }
          }
      }));
      if (proposerId === 1) setInputValP1('');
      else setInputValP2('');
  };

  const handleRetry = (pid: number) => {
      setState(prev => ({
          ...prev,
          proposers: {
              ...prev.proposers,
              [pid]: {
                  ...prev.proposers[pid],
                  phase: 'PREPARE_READY'
              }
          }
      }));
  };

  // --- RENDERERS ---

  const renderProposerControl = (pid: number, label: string, inputVal: string, setInputVal: (v:string)=>void) => {
      const pState = state.proposers[pid];
      const isDueling = state.scenario === Scenario.DUELING;

      return (
        <div className={`flex-1 flex flex-col gap-3 p-4 rounded-xl border ${pid === 1 ? 'bg-yellow-900/10 border-yellow-500/20' : 'bg-orange-900/10 border-orange-500/20'}`}>
            <h4 className={`font-bold text-sm uppercase flex items-center gap-2 ${pid === 1 ? 'text-yellow-400' : 'text-orange-400'}`}>
                {label}
                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">{pState.phase}</span>
            </h4>

            {/* FAILURE STATE */}
            {pState.phase === 'FAILURE' && (
                <div className="bg-red-900/20 p-3 rounded text-center">
                    <p className="text-red-400 text-xs mb-2">{format(t.messages.p1Preempted, { pid })}</p>
                    <button onClick={() => handleRetry(pid)} className="w-full bg-slate-700 hover:bg-slate-600 text-white text-xs py-2 rounded flex justify-center gap-2">
                        <RotateCcw size={14}/> {t.controls.retry}
                    </button>
                </div>
            )}

            {/* SUCCESS STATE */}
            {pState.phase === 'SUCCESS' && (
                <div className="bg-green-900/20 p-3 rounded text-center border border-green-500/30">
                     <CheckCircle2 className="mx-auto h-8 w-8 text-green-500 mb-2"/>
                     <p className="text-green-400 text-xs font-bold">{t.app.status.success}</p>
                </div>
            )}

            {/* PREPARE INPUT */}
            {pState.phase === 'PREPARE_READY' && (
                <div className="space-y-2">
                    <label className="text-[10px] text-slate-400 uppercase font-bold">{t.controls.enterProposal}</label>
                    <div className="flex gap-1">
                        <input 
                            type="number" 
                            className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white text-sm" 
                            placeholder={`> ${pState.currentProposalId}`}
                            value={inputVal}
                            onChange={(e) => setInputVal(e.target.value)}
                        />
                    </div>
                    {/* BUTTONS: Dueling specific targeting vs Basic Broadcast */}
                    {isDueling ? (
                        <div className="flex flex-col gap-1">
                            {pid === 1 && (
                                <button 
                                    onClick={() => handleSendPrepare(1, inputVal, [2, 3])} 
                                    className="bg-yellow-600 hover:bg-yellow-500 text-white text-xs py-1.5 rounded flex items-center justify-center gap-1"
                                >
                                    <Target size={12}/> {format(t.controls.sendPrepareSubset, { targets: "2,3" })}
                                </button>
                            )}
                            {pid === 6 && (
                                <button 
                                    onClick={() => handleSendPrepare(6, inputVal, [3, 4])} 
                                    className="bg-orange-600 hover:bg-orange-500 text-white text-xs py-1.5 rounded flex items-center justify-center gap-1"
                                >
                                    <Target size={12}/> {format(t.controls.sendPrepareSubset, { targets: "3,4" })}
                                </button>
                            )}
                            <button 
                                onClick={() => handleSendPrepare(pid, inputVal, [2, 3, 4])} 
                                className="bg-slate-700 hover:bg-slate-600 text-white text-xs py-1.5 rounded flex items-center justify-center gap-1 mt-1"
                            >
                                <Send size={12}/> Broadcast All (Retry)
                            </button>
                        </div>
                    ) : (
                        <button 
                            onClick={() => handleSendPrepare(pid, inputVal, [2, 3, 4])} 
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs py-2 rounded font-bold flex items-center justify-center gap-2"
                        >
                            <Send size={14}/> {t.controls.sendPrepare}
                        </button>
                    )}
                </div>
            )}

            {/* PROMISE WAIT */}
            {pState.phase === 'PROMISE_WAIT' && (
                <div className="bg-slate-800 p-2 rounded border border-slate-700 flex items-center gap-2">
                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-slate-400 border-t-transparent"></div>
                    <span className="text-slate-400 text-xs">{format(t.messages.quorumWaiting, { pid, count: pState.promisesReceived })}</span>
                </div>
            )}

            {/* PROPOSE READY */}
            {pState.phase === 'PROPOSE_READY' && (
                <div className="space-y-2">
                    <div className="bg-green-900/20 border border-green-500/30 p-2 rounded">
                        <span className="text-green-400 font-bold text-xs block mb-1">
                            {format(t.messages.quorumReached, { pid, val: pState.highestPromisedValue || "None" })}
                        </span>
                    </div>
                    <input 
                        type="text" 
                        className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white text-sm"
                        value={inputVal}
                        onChange={(e) => setInputVal(e.target.value)}
                        placeholder={pState.highestPromisedValue || state.clientValue}
                    />
                    <button onClick={() => handleSendAccept(pid, inputVal || pState.highestPromisedValue || state.clientValue)} className="w-full bg-blue-600 text-white text-xs py-2 rounded font-bold">
                        {t.controls.sendAccept}
                    </button>
                </div>
            )}
        </div>
      )
  };

  const renderScenarioSelector = () => (
     <div className="grid grid-cols-1 gap-3">
        {(Object.keys(t.scenarios) as Scenario[]).map(sc => (
            <button key={sc} onClick={() => startScenario(sc)} className="p-3 bg-slate-800 border border-slate-600 rounded hover:bg-slate-700 text-left transition-colors group">
                <span className="font-bold text-white block group-hover:text-blue-400">{t.scenarios[sc].title}</span>
                <span className="text-xs text-slate-400">{t.scenarios[sc].desc}</span>
            </button>
        ))}
     </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
      
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-500/20">
                <Play className="h-5 w-5 text-white" fill="currentColor" />
            </div>
            <div>
                <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">{t.app.title}</h1>
                <p className="text-[10px] sm:text-xs text-slate-400 font-medium">{t.app.subtitle}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
             <button onClick={toggleLang} className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-400 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-full border border-slate-700">
                <Languages className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="font-bold">{lang === 'en' ? 'EN' : '中文'}</span>
             </button>
             <button onClick={reset} className="text-xs sm:text-sm flex items-center gap-2 text-slate-400 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-full border border-slate-700">
                <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">{t.app.reset}</span>
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-80px)]">
        
        {/* Left Column: Visualizer (Canvas) */}
        <div className="lg:col-span-2 flex flex-col gap-4 relative">
            <div className="flex-1 bg-slate-900 rounded-2xl border border-slate-800 relative overflow-hidden shadow-2xl">
                {/* Background Grid */}
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                
                {/* Network Layer */}
                <NetworkLayer nodes={state.nodes} messages={state.messages} currentTime={currentTime} />

                {/* Nodes */}
                {state.nodes.map(node => (
                    // Hide P2 if not relevant in Basic scenario
                    (node.id === 6 && state.scenario === Scenario.BASIC) ? null :
                    <NodeVisual 
                        key={node.id} 
                        node={node} 
                        isActive={false} // Removed active highlighting logic to simplify visual noise
                        lang={lang} 
                    />
                ))}

                {/* Legend / Status Overlay */}
                <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur border border-slate-700 p-2 rounded text-xs text-slate-400">
                    <div>Tick: {currentTime}ms</div>
                    <div>Msgs In-Flight: {state.messages.filter(m=>m.status==='IN_FLIGHT').length}</div>
                </div>
            </div>
        </div>

        {/* Right Column: Controls & Log */}
        <div className="flex flex-col gap-6 h-full overflow-hidden">
            
            {/* Control Panel */}
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-xl relative overflow-hidden shrink-0">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    {state.scenario ? t.app.nextAction : t.app.selectScenario}
                </h3>
                
                {!state.scenario ? renderScenarioSelector() : (
                    <div className="flex flex-col gap-4">
                        {/* Split Control for Dueling or Single for Basic */}
                        <div className="flex gap-4">
                             {/* Always show P1 */}
                             {renderProposerControl(1, t.controls.p1Control, inputValP1, setInputValP1)}
                             
                             {/* Show P2 only in Advanced Scenarios */}
                             {state.scenario !== Scenario.BASIC && 
                                renderProposerControl(6, t.controls.p2Control, inputValP2, setInputValP2)
                             }
                        </div>
                        
                        {errorMsg && (
                            <div className="mt-2 text-xs text-red-300 bg-red-900/30 p-2 rounded border border-red-500/20 flex items-center gap-2">
                                <ShieldAlert size={12} /> {errorMsg}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Log Panel */}
            <div className="flex-1 overflow-hidden flex flex-col">
                <SimulationLog logs={state.logs} lang={lang} />
            </div>
        </div>

      </main>
    </div>
  );
}
