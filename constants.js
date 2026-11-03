// ============================================================
//  constants.js — Shared constants used across all modules
// ============================================================

/** Task colour palette — cycles when more tasks are added */
const COLORS = [
  '#b9a3e6', '#80c4d6', '#e3a3b7', '#a8d998',
  '#e8c080', '#9caee5', '#e79c8f', '#81c7b0',
  '#d9ac7d', '#8dbbdc', '#cf9fd8', '#b6ca83'
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