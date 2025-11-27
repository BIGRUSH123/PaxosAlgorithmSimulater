
export enum Role {
  CLIENT = 'Client',
  PROPOSER = 'Proposer',
  ACCEPTOR = 'Acceptor',
  LEARNER = 'Learner'
}

export enum Scenario {
  BASIC = 'BASIC',
  DUELING = 'DUELING',
  DISCOVERY = 'DISCOVERY'
}

export type Phase = 'IDLE' | 'PREPARE_READY' | 'PROMISE_WAIT' | 'PROPOSE_READY' | 'ACCEPT_WAIT' | 'SUCCESS' | 'FAILURE';

export interface Position {
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
}

export interface NodeState {
  id: number;
  role: Role;
  minProposal: number; // The highest proposal number promised
  acceptedProposal: number | null; // The highest proposal number accepted
  acceptedValue: string | null; // The value associated with acceptedProposal
  isDead?: boolean;
  position: Position;
}

export interface Message {
  id: string;
  from: number;
  to: number;
  type: 'PREPARE' | 'PROMISE' | 'ACCEPT' | 'ACCEPTED' | 'REJECT' | 'NACK';
  proposalId: number;
  value?: string | null;
  prevAcceptedId?: number | null;
  prevAcceptedValue?: string | null;
  // Network simulation props
  sendTime: number;
  arrivalTime: number;
  status: 'IN_FLIGHT' | 'DELIVERED';
}

export interface ProposerState {
  phase: Phase;
  currentProposalId: number;
  promisesReceived: number;
  highestPromisedId: number;
  highestPromisedValue: string | null;
}

export interface SimulationState {
  scenario: Scenario | null;
  clientValue: string;
  // We now track state per proposer ID (e.g., 1 and 6)
  proposers: Record<number, ProposerState>;
  nodes: NodeState[];
  messages: Message[];
  logs: string[];
}
