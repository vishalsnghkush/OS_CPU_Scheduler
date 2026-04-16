// ============================================================
//  simulation.js — Simulation engine, Gantt chart, queue display
// ============================================================

// ── Entry points ────────────────────────────────────────────

/**
 * Build the full result from the selected algorithm and render
 * the Gantt skeleton.  Called when the user clicks "Run Simulation"
 * or when they switch to the Simulation tab via the builder.
 */
function runSimulation() {
  if (!tasks.length) return alert('Add tasks first!');
  simReset();
  fullResult   = runAlgorithm(selectedAlgo, tasks);
  animTimeline = fullResult.timeline;

  document.getElementById('gantt-algo-label').textContent = selectedAlgo;
  buildGanttSkeleton(animTimeline);
  updateQueueDisplay(0);

  document.getElementById('status-badge').textContent = '● READY';
  document.getElementById('status-badge').className   = 'badge badge-amber';
}

// ── Simulation controls ─────────────────────────────────────

/** Start the step-by-step animation from the beginning. */
function simStart() {
  if (!fullResult)          runSimulation();
  if (simState === 'done')  simReset();

  simState = 'running';
  document.getElementById('btn-start').disabled  = true;
  document.getElementById('btn-pause').disabled  = false;
  document.getElementById('btn-resume').disabled = true;
  document.getElementById('status-badge').textContent = '● RUNNING';
  document.getElementById('status-badge').className   = 'badge badge-green';
  animateStep();
}

/** Pause the running animation. */
function simPause() {
  simState = 'paused';
  clearTimeout(simInterval);
  document.getElementById('btn-pause').disabled  = true;
  document.getElementById('btn-resume').disabled = false;
  document.getElementById('status-badge').textContent = '● PAUSED';
  document.getElementById('status-badge').className   = 'badge badge-amber';
}

/** Resume from a paused state. */
function simResume() {
  simState = 'running';
  document.getElementById('btn-pause').disabled  = false;
  document.getElementById('btn-resume').disabled = true;
  document.getElementById('status-badge').textContent = '● RUNNING';
  document.getElementById('status-badge').className   = 'badge badge-green';
  animateStep();
}

/** Reset the simulation back to its initial idle state. */
function simReset() {
  simState  = 'idle';
  animStep  = 0;
  clearTimeout(simInterval);

  document.getElementById('btn-start').disabled  = false;
  document.getElementById('btn-pause').disabled  = true;
  document.getElementById('btn-resume').disabled = true;
  document.getElementById('sim-time').textContent      = '0';
  document.getElementById('sim-completed').textContent = '0';
  document.getElementById('sim-util').textContent      = '0%';
  document.getElementById('sim-progress').style.width  = '0%';
  document.getElementById('status-badge').textContent  = '● IDLE';
  document.getElementById('status-badge').className    = 'badge badge-green';
  document.getElementById('metrics-grid').innerHTML    = '';
  document.getElementById('queue-display').innerHTML   = '';

  if (fullResult) buildGanttSkeleton(animTimeline);
  document.querySelectorAll('.gantt-block').forEach(b => b.style.opacity = '0.2');
}

/** Called when the animation finishes all steps. */
function simDone() {
  simState = 'done';
  clearTimeout(simInterval);

  document.getElementById('btn-start').disabled  = false;
  document.getElementById('btn-pause').disabled  = true;
  document.getElementById('btn-resume').disabled = true;
  document.getElementById('status-badge').textContent = '● DONE';
  document.getElementById('status-badge').className   = 'badge badge-blue';
  document.getElementById('sim-progress').style.width = '100%';

  document.querySelectorAll('.gantt-block').forEach(b => b.style.opacity = '1');
  renderMetrics(computeMetrics(fullResult));
}

// ── Animation loop ───────────────────────────────────────────

/**
 * Advance one timeline block, update all live UI elements,
 * then schedule the next step.
 */
function animateStep() {
  if (simState !== 'running') return;

  const speed = parseInt(document.getElementById('sim-speed').value);
  const delay = Math.max(60, 600 / speed);

  if (animStep >= animTimeline.length) {
    simDone();
    return;
  }

  const block = animTimeline[animStep];

  // Highlight the current block in the Gantt chart
  highlightGanttBlock(animStep);

  // Update live stats
  document.getElementById('sim-time').textContent = block.end;

  const total = animTimeline.reduce((s, b) => s + (b.end - b.start), 0);
  const done  = animTimeline.slice(0, animStep + 1).reduce((s, b) => s + (b.end - b.start), 0);
  document.getElementById('sim-progress').style.width = (done / total * 100) + '%';

  const completed = fullResult.tasks.filter(p => p.finishTime > 0 && p.finishTime <= block.end).length;
  document.getElementById('sim-completed').textContent = completed;

  const busyTime = animTimeline.slice(0, animStep + 1)
    .filter(b => b.task !== 'IDLE')
    .reduce((s, b) => s + (b.end - b.start), 0);
  document.getElementById('sim-util').textContent = Math.round(busyTime / block.end * 100) + '%';

  updateQueueDisplay(block.end);

  animStep++;
  simInterval = setTimeout(animateStep, delay);
}

// ── Gantt chart builder ─────────────────────────────────────

/**
 * Render the complete Gantt chart skeleton (all blocks at low opacity).
 * The animation loop then reveals blocks one by one.
 * @param {Array} timeline - Array of Block objects
 */
function buildGanttSkeleton(timeline) {
  if (!timeline.length) return;

  const container  = document.getElementById('gantt-container');
  const totalTime  = timeline[timeline.length - 1].end;
  const pxPerUnit  = Math.max(18, Math.min(50, 700 / totalTime));
  const totalPx    = totalTime * pxPerUnit;

  let html = `
    <div class="gantt-header">
      <span>Timeline (units)</span>
      <span>Total: ${totalTime} units · ${timeline.length} blocks</span>
    </div>
    <div class="gantt-inner" style="padding-bottom:28px">
  `;

  // ── CPU row ──
  html += `
    <div class="gantt-row">
      <div class="gantt-label">CPU</div>
      <div class="gantt-track" style="width:${totalPx}px">
  `;

  timeline.forEach((block, i) => {
    const left  = block.start * pxPerUnit;
    const width = (block.end - block.start) * pxPerUnit;
    const isIdle = block.task === 'IDLE';

    if (isIdle) {
      html += `
        <div class="gantt-block idle-block"
             style="left:${left}px;width:${width}px;opacity:0.2"
             title="IDLE: ${block.start}–${block.end}">
          ${width > 25 ? 'idle' : ''}
        </div>`;
    } else {
      const task  = tasks.find(t => t.name === block.task);
      const color = task ? task.color : '#6c63ff';
      html += `
        <div class="gantt-block" data-idx="${i}"
             style="left:${left}px;width:${width}px;background:${color};opacity:0.2"
             onmouseenter="showTooltip(event,'${block.task}',${block.start},${block.end})"
             onmouseleave="hideTooltip()"
             title="${block.task}: ${block.start}–${block.end}">
          ${width > 20 ? block.task : ''}
        </div>`;
    }
  });

  // Tick marks along the time axis
  for (let t2 = 0; t2 <= totalTime; t2 += Math.ceil(totalTime / 10)) {
    const left = t2 * pxPerUnit;
    html += `<div class="gantt-tick" style="left:${left}px">
               <span class="gantt-tick-lbl">${t2}</span>
             </div>`;
  }
  html += '</div></div>';

  // ── Per-task rows ──
  tasks.forEach(task => {
    const taskBlocks = timeline.filter(b => b.task === task.name);
    if (!taskBlocks.length) return;

    html += `
      <div class="gantt-row">
        <div class="gantt-label" style="color:${task.color};font-size:11px">${task.name}</div>
        <div class="gantt-track" style="width:${totalPx}px">
    `;
    taskBlocks.forEach(block => {
      const left  = block.start * pxPerUnit;
      const width = (block.end - block.start) * pxPerUnit;
      html += `
        <div class="gantt-block"
             style="left:${left}px;width:${width}px;background:${task.color};opacity:0.2;height:18px;top:7px"
             onmouseenter="showTooltip(event,'${task.name}',${block.start},${block.end})"
             onmouseleave="hideTooltip()">
        </div>`;
    });
    html += '</div></div>';
  });

  html += '</div>';
  container.innerHTML = html;
}

/** Make block at `idx` fully visible; dim all others. */
function highlightGanttBlock(idx) {
  document.querySelectorAll('.gantt-block').forEach((b, i) => {
    b.style.opacity   = i <= idx ? '1' : '0.2';
    b.style.transform = i === idx ? 'scaleY(1.1)' : 'scaleY(1)';
  });
}

// ── Queue display ───────────────────────────────────────────

/**
 * Render the live process queue showing each task's current state:
 * WAIT | RUN | DONE | SCHED (not yet arrived)
 * @param {number} time - Current simulation time
 */
function updateQueueDisplay(time) {
  if (!fullResult) return;

  const disp         = document.getElementById('queue-display');
  const currentBlock = animTimeline[Math.max(0, animStep - 1)];
  const runningTask  = (currentBlock && currentBlock.task !== 'IDLE') ? currentBlock.task : null;

  const chips = tasks.map(t => {
    const proc = fullResult.tasks.find(p => p.name === t.name);
    let state  = 'waiting';
    if      (proc && proc.finishTime > 0 && proc.finishTime <= time) state = 'done';
    else if (t.name === runningTask)                                  state = 'running';
    else if (proc && (proc.arrival || 0) > time)                     state = 'future';

    const colors     = { waiting: 'rgba(108,99,255,.2)',  running: 'rgba(34,211,160,.2)',  done: 'rgba(255,255,255,.08)', future: 'rgba(255,255,255,.04)' };
    const textColors = { waiting: 'var(--accent)',        running: 'var(--green)',          done: 'var(--dim)',            future: 'var(--dim)' };
    const labels     = { waiting: 'WAIT',                 running: 'RUN ▶',                done: 'DONE ✓',               future: 'SCHED' };

    return `
      <div class="queue-chip ${state === 'running' ? 'running-chip' : ''}"
           style="background:${colors[state]};color:${textColors[state]};border:1px solid ${textColors[state]}30">
        <span style="background:${t.color};width:8px;height:8px;border-radius:2px;display:inline-block"></span>
        ${t.name} <span style="font-size:10px;opacity:.7">${labels[state]}</span>
      </div>`;
  });

  disp.innerHTML = chips.join('');
}

// ── Tooltip ─────────────────────────────────────────────────

/** Show a floating tooltip with block details on hover. */
function showTooltip(e, name, start, end) {
  const t    = tasks.find(t => t.name === name);
  const proc = fullResult ? fullResult.tasks.find(p => p.name === name) : null;
  const tt   = document.getElementById('tooltip');

  tt.innerHTML = `
    <div style="font-weight:700;margin-bottom:4px;color:${t ? t.color : '#fff'}">${name}</div>
    <div>Start: <b>${start}</b> · End: <b>${end}</b> · Duration: <b>${end - start}</b></div>
    ${proc && proc.waitTime != null
      ? `<div>Wait: ${proc.waitTime} · Turnaround: ${proc.turnaround}</div>`
      : ''}
    ${t ? `<div>Priority: ${t.priority} · Memory: ${t.memory}MB</div>` : ''}
  `;

  tt.style.display = 'block';
  tt.style.left    = (e.clientX + 12) + 'px';
  tt.style.top     = (e.clientY - 10) + 'px';
}

function hideTooltip() {
  document.getElementById('tooltip').style.display = 'none';
}

// ── Metrics display ─────────────────────────────────────────

/** Render the 6 metric cards below the Gantt chart. */
function renderMetrics(m) {
  document.getElementById('metrics-grid').innerHTML = `
    <div class="metric-card"><div class="metric-val metric-amber">${m.avgWait.toFixed(2)}</div>
      <div class="metric-lbl">Avg Wait Time</div></div>
    <div class="metric-card"><div class="metric-val metric-blue">${m.avgTurnaround.toFixed(2)}</div>
      <div class="metric-lbl">Avg Turnaround</div></div>
    <div class="metric-card"><div class="metric-val metric-green">${m.utilization.toFixed(1)}%</div>
      <div class="metric-lbl">CPU Utilization</div></div>
    <div class="metric-card"><div class="metric-val metric-purple">${m.throughput.toFixed(3)}</div>
      <div class="metric-lbl">Throughput</div></div>
    <div class="metric-card"><div class="metric-val" style="color:var(--red)">${m.contextSwitches}</div>
      <div class="metric-lbl">Context Switches</div></div>
    <div class="metric-card"><div class="metric-val" style="color:var(--muted)">${m.totalTime}</div>
      <div class="metric-lbl">Total Time</div></div>
  `;
}