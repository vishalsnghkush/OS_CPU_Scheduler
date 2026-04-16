// ============================================================
//  multicore.js — Multi-core CPU simulation tab
//
//  Distributes tasks across up to 4 logical cores using a
//  round-robin assignment (shortest tasks balanced first), then
//  runs the chosen single-core algorithm independently on each core.
// ============================================================

/** Hex colours for each core (mirrors --core0..--core3 CSS vars). */
const CORE_HEX = ['#6c63ff', '#00d4ff', '#ff6b9d', '#22d3a0'];

/**
 * Run the multi-core simulation and render both:
 *   - Per-core cards with metrics and a mini Gantt strip
 *   - A combined Gantt view showing all cores on shared time axis
 */
function runMulticore() {
  if (!tasks.length) { alert('Add tasks first!'); return; }

  const numCores = Math.min(4, Math.max(1, parseInt(document.getElementById('mc-cores').value) || 2));
  const algo     = document.getElementById('mc-algo').value;

  // ── Distribute tasks across cores ──
  // Sort by burst (shortest-job-first) so cores get roughly equal workloads.
  const coreAssignments = Array.from({ length: numCores }, () => []);
  const sorted          = [...tasks].sort((a, b) => a.burst - b.burst);
  sorted.forEach((t, i) => coreAssignments[i % numCores].push({ ...t }));

  // ── Run the algorithm on each core independently ──
  const coreResults = coreAssignments.map(taskSet =>
    taskSet.length ? runAlgorithm(algo, taskSet) : { timeline: [], tasks: [], contextSwitches: 0 }
  );

  // ── Render per-core cards ──
  const grid = document.getElementById('core-grid');
  grid.innerHTML = coreResults.map((result, ci) => {
    const m              = result.tasks.length ? computeMetrics(result) : { utilization: 0, avgWait: 0, contextSwitches: 0 };
    const taskBadges     = coreAssignments[ci].map(t =>
      `<span style="background:${t.color};color:#fff;padding:2px 6px;border-radius:4px;font-size:11px;font-family:var(--mono);margin:2px">${t.name}</span>`
    ).join('');

    return `
      <div class="core-card">
        <div class="core-header"
             style="background:${CORE_HEX[ci]}22;color:${CORE_HEX[ci]};border-bottom:1px solid ${CORE_HEX[ci]}33">
          <span>⬡ Core ${ci + 1}</span>
          <div style="display:flex;align-items:center;gap:6px">
            <div class="core-pulse" style="background:${CORE_HEX[ci]}"></div>
            <span style="font-size:11px;color:var(--muted)">${m.utilization.toFixed(0)}% util</span>
          </div>
        </div>
        <div class="core-body">
          <div style="margin-bottom:6px">
            ${taskBadges || '<span style="color:var(--dim);font-size:12px">No tasks</span>'}
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">
            <div class="metric-card">
              <div class="metric-val" style="font-size:16px;color:${CORE_HEX[ci]}">${m.avgWait.toFixed(1)}</div>
              <div class="metric-lbl">Avg Wait</div>
            </div>
            <div class="metric-card">
              <div class="metric-val" style="font-size:16px;color:var(--green)">${m.utilization.toFixed(0)}%</div>
              <div class="metric-lbl">CPU Util</div>
            </div>
          </div>
          ${renderMiniGantt(result.timeline, CORE_HEX[ci])}
        </div>
      </div>`;
  }).join('');

  // ── Combined Gantt view ──
  const maxTime = Math.max(...coreResults.map(r =>
    r.timeline.length ? r.timeline[r.timeline.length - 1].end : 0
  ));
  const ppu = Math.max(12, Math.min(40, 600 / Math.max(1, maxTime)));

  let html = '';
  coreResults.forEach((result, ci) => {
    html += `
      <div class="gantt-row" style="margin-bottom:8px">
        <div class="gantt-label" style="color:${CORE_HEX[ci]}">C${ci + 1}</div>
        <div class="gantt-track" style="width:${maxTime * ppu}px">
    `;
    result.timeline.forEach(block => {
      const left   = block.start * ppu;
      const width  = (block.end - block.start) * ppu;
      const isIdle = block.task === 'IDLE';
      const task   = tasks.find(t => t.name === block.task);
      const color  = task ? task.color : CORE_HEX[ci];

      html += `
        <div class="gantt-block ${isIdle ? 'idle-block' : ''}"
             style="left:${left}px;width:${width}px;background:${isIdle ? 'transparent' : color}">
          ${width > 18 && !isIdle ? block.task : ''}
        </div>`;
    });
    html += '</div></div>';
  });

  document.getElementById('mc-gantt').innerHTML = html;

  // Update the header badge
  document.getElementById('cpu-badge').textContent = numCores + ' CORE' + (numCores > 1 ? 'S' : '');
}

/**
 * Render a compact inline Gantt strip inside a core card.
 * @param {Array}  timeline - Block array from runAlgorithm()
 * @param {string} color    - Fallback hex colour for this core
 * @returns {string} HTML string
 */
function renderMiniGantt(timeline, color) {
  if (!timeline.length) return '';

  const totalTime = timeline[timeline.length - 1].end;
  const ppu       = 160 / Math.max(1, totalTime);

  const blocks = timeline.map(b => {
    const left   = b.start * ppu;
    const width  = (b.end - b.start) * ppu;
    const isIdle = b.task === 'IDLE';
    const task   = tasks.find(t => t.name === b.task);
    const c      = task ? task.color : color;

    return `<div style="
      position:absolute;left:${left}px;width:${width}px;top:0;bottom:0;
      background:${isIdle ? 'rgba(255,255,255,.05)' : c};
      border-radius:2px;
      border:${isIdle ? '1px dashed rgba(255,255,255,.15)' : 'none'};
    "></div>`;
  }).join('');

  return `
    <div style="height:20px;position:relative;background:rgba(255,255,255,.03);
                border-radius:4px;margin-top:8px;overflow:hidden;width:100%">
      ${blocks}
    </div>`;
}