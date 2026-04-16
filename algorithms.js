// ============================================================
//  algorithms.js — All CPU scheduling algorithm implementations
//
//  Each function accepts a cloned task list and returns:
//    { timeline: Array<Block>, tasks: Array<Task>, contextSwitches: number }
//
//  Block  = { task: string, start: number, end: number, color?: string, pid?: number }
//  Task   = original task fields + startTime, finishTime, waitTime, turnaround
// ============================================================

// ── Helpers ────────────────────────────────────────────────

/**
 * Deep-clone the global tasks array and attach scheduling fields.
 * Returns a fresh array ready to be passed to any algorithm.
 */
function deepCloneTasks() {
  return tasks.map(t => ({
    ...t,
    remaining:  t.burst,
    completed:  false,
    startTime:  -1,
    finishTime: -1,
    waitTime:   0,
    turnaround: 0,
  }));
}

/**
 * Compute performance metrics from an algorithm result.
 * @param {{ timeline, tasks, contextSwitches }} result
 */
function computeMetrics(result) {
  const { timeline, tasks: t, contextSwitches } = result;
  const n             = t.filter(p => p.finishTime > 0).length;
  const avgWait       = t.reduce((s, p) => s + (p.waitTime    || 0), 0) / Math.max(1, n);
  const avgTurnaround = t.reduce((s, p) => s + (p.turnaround  || 0), 0) / Math.max(1, n);
  const totalTime     = timeline.length ? timeline[timeline.length - 1].end : 1;
  const busyTime      = timeline.filter(b => b.task !== 'IDLE').reduce((s, b) => s + (b.end - b.start), 0);
  const utilization   = (busyTime / totalTime) * 100;
  const throughput    = n / totalTime;
  return { avgWait, avgTurnaround, utilization, throughput, contextSwitches, totalTime, n };
}

/**
 * Dispatcher — clone tasks and invoke the right algorithm.
 * @param {string} algo    - Algorithm ID from ALGORITHMS constant
 * @param {Array}  taskList - Raw task objects (not yet cloned)
 */
function runAlgorithm(algo, taskList) {
  const cloned = taskList.map(t => ({
    ...t,
    startTime:  -1,
    finishTime: -1,
    completed:  false,
  }));
  switch (algo) {
    case 'FCFS':               return scheduleFCFS(cloned);
    case 'SJF':                return scheduleSJF(cloned);
    case 'SRTF':               return scheduleSRTF(cloned);
    case 'Priority':           return schedulePriority(cloned);
    case 'PreemptivePriority': return schedulePreemptivePriority(cloned);
    case 'RR':                 return scheduleRR(cloned);
    default:                   return scheduleFCFS(cloned);
  }
}

// ── Algorithm 1 — First Come First Served (FCFS) ───────────

/**
 * Non-preemptive. Processes tasks in arrival order.
 * Simple and fair but can cause the "convoy effect" with long burst times.
 */
function scheduleFCFS(taskList) {
  const sorted   = [...taskList].sort((a, b) => a.arrival - b.arrival || a.id - b.id);
  const timeline = [];
  let t = 0;

  for (const p of sorted) {
    if (t < p.arrival) {
      timeline.push({ task: 'IDLE', start: t, end: p.arrival });
      t = p.arrival;
    }
    p.startTime   = t;
    p.finishTime  = t + p.burst;
    p.turnaround  = p.finishTime - p.arrival;
    p.waitTime    = p.startTime  - p.arrival;
    timeline.push({ task: p.name, start: t, end: t + p.burst, color: p.color, pid: p.id });
    t += p.burst;
  }

  return { timeline, tasks: sorted, contextSwitches: sorted.length - 1 };
}

// ── Algorithm 2 — Shortest Job First (SJF) ─────────────────

/**
 * Non-preemptive. At each decision point, the ready process
 * with the shortest burst time is selected.
 * Optimal for minimising average waiting time when all tasks arrive at t=0.
 */
function scheduleSJF(taskList) {
  const procs    = [...taskList].map(t => ({ ...t, remaining: t.burst }));
  const timeline = [];
  let t = 0, done = 0, cs = 0;

  while (done < procs.length) {
    const ready = procs.filter(p => p.arrival <= t && !p.completed);

    // No task ready — jump to the next arrival
    if (!ready.length) {
      const next = procs.filter(p => !p.completed).sort((a, b) => a.arrival - b.arrival)[0];
      timeline.push({ task: 'IDLE', start: t, end: next.arrival });
      t = next.arrival;
      continue;
    }

    // Pick shortest burst; break ties by arrival time
    ready.sort((a, b) => a.burst - b.burst || a.arrival - b.arrival);
    const cur = ready[0];

    if (cur.startTime === -1) cur.startTime = t;
    cur.finishTime = t + cur.burst;
    cur.turnaround = cur.finishTime - cur.arrival;
    cur.waitTime   = cur.startTime  - cur.arrival;

    timeline.push({ task: cur.name, start: t, end: t + cur.burst, color: cur.color, pid: cur.id });
    t += cur.burst;
    cur.completed = true;
    done++;
    cs++;
  }

  return { timeline, tasks: procs, contextSwitches: cs - 1 };
}

// ── Algorithm 3 — Shortest Remaining Time First (SRTF) ─────

/**
 * Preemptive version of SJF. At every time unit the ready process
 * with the least remaining burst is executed.
 * Minimises average waiting time but has high context-switch overhead.
 */
function scheduleSRTF(taskList) {
  const procs    = [...taskList].map(t => ({ ...t, remaining: t.burst, firstRun: -1 }));
  const timeline = [];
  let t = 0, done = 0, lastTask = null, cs = 0;
  const maxT = procs.reduce((s, p) => s + p.burst, 0) + Math.max(...procs.map(p => p.arrival)) + 1;

  while (done < procs.length && t < maxT + 50) {
    const ready = procs.filter(p => p.arrival <= t && !p.completed);

    if (!ready.length) {
      const next = procs.filter(p => !p.completed).sort((a, b) => a.arrival - b.arrival)[0];
      if (!next) break;
      // Extend existing IDLE block or start a new one
      if (timeline.length && timeline[timeline.length - 1].task === 'IDLE')
        timeline[timeline.length - 1].end = next.arrival;
      else
        timeline.push({ task: 'IDLE', start: t, end: next.arrival });
      lastTask = null;
      t = next.arrival;
      continue;
    }

    ready.sort((a, b) => a.remaining - b.remaining || a.arrival - b.arrival);
    const cur = ready[0];

    if (cur !== lastTask) cs++;
    if (cur.firstRun === -1) cur.firstRun = t;

    // Extend last block if same task continues
    if (timeline.length && timeline[timeline.length - 1].task === cur.name && timeline[timeline.length - 1].end === t)
      timeline[timeline.length - 1].end = t + 1;
    else
      timeline.push({ task: cur.name, start: t, end: t + 1, color: cur.color, pid: cur.id });

    cur.remaining--;
    t++;

    if (cur.remaining === 0) {
      cur.completed  = true;
      cur.finishTime = t;
      cur.turnaround = t - cur.arrival;
      cur.waitTime   = cur.turnaround - cur.burst;
      done++;
      lastTask = null;
    } else {
      lastTask = cur;
    }
  }

  return { timeline, tasks: procs, contextSwitches: Math.max(0, cs - 1) };
}

// ── Algorithm 4 — Priority Scheduling (Non-Preemptive) ─────

/**
 * At each decision point, the ready process with the highest priority
 * (highest numeric value) is selected and runs to completion.
 * Can cause starvation of low-priority tasks.
 */
function schedulePriority(taskList) {
  const procs    = [...taskList].map(t => ({ ...t, remaining: t.burst }));
  const timeline = [];
  let t = 0, done = 0, cs = 0;

  while (done < procs.length) {
    const ready = procs.filter(p => p.arrival <= t && !p.completed);

    if (!ready.length) {
      const next = procs.filter(p => !p.completed).sort((a, b) => a.arrival - b.arrival)[0];
      timeline.push({ task: 'IDLE', start: t, end: next.arrival });
      t = next.arrival;
      continue;
    }

    // Higher number = higher priority; break ties by arrival
    ready.sort((a, b) => b.priority - a.priority || a.arrival - b.arrival);
    const cur = ready[0];

    if (cur.startTime === -1) cur.startTime = t;
    cur.finishTime = t + cur.burst;
    cur.turnaround = cur.finishTime - cur.arrival;
    cur.waitTime   = cur.startTime  - cur.arrival;

    timeline.push({ task: cur.name, start: t, end: t + cur.burst, color: cur.color, pid: cur.id });
    t += cur.burst;
    cur.completed = true;
    done++;
    cs++;
  }

  return { timeline, tasks: procs, contextSwitches: cs - 1 };
}

// ── Algorithm 5 — Preemptive Priority ──────────────────────

/**
 * Like Priority but preemptive — a higher-priority arrival will
 * immediately preempt the running task.
 * Good responsiveness for critical tasks; high context-switch count.
 */
function schedulePreemptivePriority(taskList) {
  const procs    = [...taskList].map(t => ({ ...t, remaining: t.burst, firstRun: -1 }));
  const timeline = [];
  let t = 0, done = 0, lastTask = null, cs = 0;
  const maxT = procs.reduce((s, p) => s + p.burst, 0) + Math.max(...procs.map(p => p.arrival)) + 1;

  while (done < procs.length && t < maxT + 50) {
    const ready = procs.filter(p => p.arrival <= t && !p.completed);

    if (!ready.length) {
      const next = procs.filter(p => !p.completed).sort((a, b) => a.arrival - b.arrival)[0];
      if (!next) break;
      if (timeline.length && timeline[timeline.length - 1].task === 'IDLE')
        timeline[timeline.length - 1].end = next.arrival;
      else
        timeline.push({ task: 'IDLE', start: t, end: next.arrival });
      lastTask = null;
      t = next.arrival;
      continue;
    }

    ready.sort((a, b) => b.priority - a.priority || a.arrival - b.arrival);
    const cur = ready[0];

    if (cur !== lastTask) cs++;
    if (cur.firstRun === -1) cur.firstRun = t;

    if (timeline.length && timeline[timeline.length - 1].task === cur.name && timeline[timeline.length - 1].end === t)
      timeline[timeline.length - 1].end = t + 1;
    else
      timeline.push({ task: cur.name, start: t, end: t + 1, color: cur.color, pid: cur.id });

    cur.remaining--;
    t++;

    if (cur.remaining === 0) {
      cur.completed  = true;
      cur.finishTime = t;
      cur.turnaround = t - cur.arrival;
      cur.waitTime   = cur.turnaround - cur.burst;
      done++;
      lastTask = null;
    } else {
      lastTask = cur;
    }
  }

  return { timeline, tasks: procs, contextSwitches: Math.max(0, cs - 1) };
}

// ── Algorithm 6 — Round Robin (RR) ─────────────────────────

/**
 * Each task gets a fixed time quantum in a circular order.
 * If it doesn't finish in one quantum it's re-queued.
 * Fair and great for interactive systems; quantum size is critical.
 */
function scheduleRR(taskList) {
  const quantum = parseInt(document.getElementById('quantum-input').value) || 2;
  const procs   = [...taskList].map(t => ({ ...t, remaining: t.burst }));
  const timeline = [];
  let t = 0, cs = 0;
  const queue   = [];
  const arrived = new Set();

  procs.sort((a, b) => a.arrival - b.arrival);
  let i = 0;

  while (procs.some(p => p.remaining > 0)) {
    // Enqueue all tasks that have arrived by now
    while (i < procs.length && procs[i].arrival <= t) {
      queue.push(procs[i]);
      arrived.add(procs[i].id);
      i++;
    }

    // Nothing ready — idle until next arrival
    if (!queue.length) {
      const next = procs.find(p => p.remaining > 0);
      if (!next) break;
      timeline.push({ task: 'IDLE', start: t, end: next.arrival });
      t = next.arrival;
      while (i < procs.length && procs[i].arrival <= t) { queue.push(procs[i]); i++; }
      continue;
    }

    const cur = queue.shift();
    cs++;
    if (cur.startTime === -1) cur.startTime = t;

    const run = Math.min(quantum, cur.remaining);
    timeline.push({ task: cur.name, start: t, end: t + run, color: cur.color, pid: cur.id });
    t           += run;
    cur.remaining -= run;

    // Enqueue newly-arrived tasks before re-queuing the current one
    while (i < procs.length && procs[i].arrival <= t) {
      if (!arrived.has(procs[i].id)) { queue.push(procs[i]); arrived.add(procs[i].id); }
      i++;
    }

    if (cur.remaining > 0) {
      queue.push(cur);          // re-queue for next quantum
    } else {
      cur.finishTime = t;
      cur.turnaround = t - cur.arrival;
      cur.waitTime   = cur.turnaround - cur.burst;
    }
  }

  return { timeline, tasks: procs, contextSwitches: Math.max(0, cs - 1) };
}