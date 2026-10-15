export type Mode = 'cooperative' | 'intrigue';
export type Role = 'Scout' | 'Engineer' | 'Guardian';
export type Squad = 'pathfinder' | 'mechanics';
export type Agenda = 'Loyal Crew' | 'Saboteur' | 'Independent Broker';
export type Resources = { supplies: number; integrity: number; alarm: number };
export type Condition = { op: 'resource'; key: keyof Resources; min: number } | { op: 'flag'; key: string; equals: boolean };
export type Effect = { op: 'resource'; key: keyof Resources; delta: number } | { op: 'flag'; key: string; value: boolean } | { op: 'risk'; dc: 10 | 13 | 16; failureIntegrity: number } | { op: 'repair' };
export interface Option { id: string; title: string; consequence: string; next: string; cost: number; conditions: Condition[]; effects: Effect[]; engineer: boolean }
export interface Card { id: string; issuer: string; type: 'authenticated' | 'testimony'; text: string; factRefs: string[] }
export interface Scene {
  id: string; family: 'choice' | 'deduction' | 'negotiation' | 'rest' | 'allocation' | 'ending';
  title: string; text: string; practice: string; seconds: number; default: string;
  options: Option[]; cards: Card[]; next: string | null; checkpoint: 'none' | 'rest';
  puzzle: null | { answer: string; maxAttempts: number; hints: string[]; bridges: { id: string; capacity: number; gate: string; open: boolean }[]; destination: string; weights: number[] };
}
export interface Pack {
  id: string; version: string; schemaVersion: 3; engineRange: '3'; title: string; language: string; assets: string[];
  mission: { entryScene: string; allowedModes: Mode[]; rosterRange: [8, 8]; resources: Resources; endings: { delivered: string; urgent: string; evacuated: string } };
  intrigue: null | { certification: 'mistbound-v3-eight'; windows: ['W1', 'W2']; agendaCounts: [6, 1, 1]; traceSize: 4; minIntersection: 2 };
  scenes: Scene[];
}
export interface Seat {
  id: string; memberId: string; name: string; squad: Squad; role: Role;
  invite: string; token: string | null; agenda: Agenda; effort: boolean; ability: boolean;
  coins: number; plots: number; intrigue: number; preference: Mode | null; notice: string;
}
export interface Input {
  choice?: string; ready?: boolean; effort?: boolean; engineer?: boolean; guardian?: boolean;
  accusation?: string; theft?: boolean;
}
export type Stage = 'scene' | 'purchase' | 'actions' | 'W1' | 'watch' | 'watch_confirm' | 'W2' | 'chest' | 'finale' | 'salvage';
export type Phase = 'lobby' | 'reading' | 'selection' | 'tie' | 'guardian' | 'consequences' | 'discussion' | 'ended';
export type Next = { kind: 'scene'; id: string } | { kind: 'stage'; stage: Stage } | { kind: 'round' } | { kind: 'discussion' } | { kind: 'finish' };
export interface Event { ordinal: number; key: string; actor: string; type: string; visibility: 'public' | 'gm'; data: unknown; at: number }
export interface Outcome { mission: 'Delivered' | 'Urgent Delivery' | 'Evacuated' | 'Interrupted'; security: 'Secured' | 'Stolen' | 'Not Applicable'; late: boolean; agendas: { seat: string; name: string; agenda: Agenda; coins: number; plots: number; success: boolean }[]; flags: Record<string, boolean>; salvage?: string }
export interface State {
  id: string; revision: number; rulesVersion: 3; pack: { id: string; version: string; digest: string }; seed: string;
  gm: { memberId: string; name: string }; mode: Mode; phase: Phase; stage: Stage; instance: string; round: number;
  deadline: number | null; paused: boolean; remaining: number | null; disconnectPauseKeys: string[];
  players: Seat[]; resources: Resources; urgent: boolean; flags: Record<string, boolean>; power: number;
  scene: string; inputs: Record<string, Input>; shared: Card[]; claims: { author: string; text: string; type: 'unverified claim' }[];
  attempts: number; hints: number; priority: number; next?: Next; resumeScene?: string; tie?: { options: string[]; seat: string };
  watched?: string; nominated?: string; chest: boolean; traces: { id: string; seats: string[]; text: string }[];
  shields: Record<Squad, number>; losses: Record<Squad, number>; pendingPower: boolean; pendingRepel: boolean;
  summary: string[]; events: Event[]; resolved: string[]; outcome?: Outcome;
  lastRoll?: { raw: number; dc: number; total: number; contributors: string[]; success: boolean };
  journal: { session: string; title: string; outcome: Outcome }[];
}
export interface Command { id: string; instance: string; stageKey: string; type: string; payload: Record<string, unknown> }
export type Actor = { kind: 'gm'; id: 'gm' } | { kind: 'player'; id: string };
