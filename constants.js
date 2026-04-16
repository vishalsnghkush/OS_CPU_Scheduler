// ============================================================
//  constants.js — Shared constants used across all modules
// ============================================================

/** Task colour palette — cycles when more tasks are added */
const COLORS = [
  '#6c63ff', '#00d4ff', '#ff6b9d', '#22d3a0',
  '#fbbf24', '#a78bfa', '#f87171', '#34d399',
  '#fb923c', '#38bdf8', '#e879f9', '#4ade80'
];

/** All supported scheduling algorithms */
const ALGORITHMS = [
  { id: 'FCFS',               label: 'FCFS',         preemptive: false },
  { id: 'SJF',                label: 'SJF',          preemptive: false },
  { id: 'SRTF',               label: 'SRTF',         preemptive: true  },
  { id: 'Priority',           label: 'Priority',     preemptive: false },
  { id: 'PreemptivePriority', label: 'Prem-Prio',    preemptive: true  },
  { id: 'RR',                 label: 'Round Robin',  preemptive: true  },
];

// ============================================================
//  state.js — Global mutable application state
// ============================================================

/** Current task list */
let tasks = [];

/** Auto-incrementing task ID counter */
let taskIdCounter = 1;

/** Currently selected algorithm ID */
let selectedAlgo = 'FCFS';

/** Simulation state: 'idle' | 'running' | 'paused' | 'done' */
let simState = 'idle';

/** setTimeout handle for the animation loop */
let simInterval = null;

/** Current animation step index into animTimeline */
let animStep = 0;

/** The full timeline produced by the chosen algorithm */
let animTimeline = [];

/** Full result object from the last runAlgorithm() call */
let fullResult = null;

/** Chart.js instances — kept so they can be destroyed on re-run */
let chartWait       = null;
let chartTurnaround = null;
let chartProfile    = null;