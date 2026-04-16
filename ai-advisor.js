// ============================================================
//  ai-advisor.js — Rule-based AI scheduling recommendation engine
//
//  Analyses the current task set's statistical profile and
//  recommends the most suitable algorithm with reasoning.
//  Also renders a radar chart and a scored bar matrix.
// ============================================================

/**
 * Analyse the current tasks and populate the AI Advisor panel.
 * No network calls — purely rule-based using statistical features.
 */
function runAIAnalysis() {
  if (!tasks.length) { alert('Add tasks first!'); return; }

  // ── Compute task-set features ──
  const burstTimes  = tasks.map(t => t.burst);
  const priorities  = tasks.map(t => t.priority);
  const arrivals    = tasks.map(t => t.arrival);

  const avgBurst        = burstTimes.reduce((a, b) => a + b, 0) / burstTimes.length;
  const burstVariance   = burstTimes.reduce((s, b) => s + (b - avgBurst) ** 2, 0) / burstTimes.length;
  const burstStdDev     = Math.sqrt(burstVariance);

  const avgPriority     = priorities.reduce((a, b) => a + b, 0) / priorities.length;
  const priorityVariance= priorities.reduce((s, p) => s + (p - avgPriority) ** 2, 0) / priorities.length;

  const hasDistinctPriorities = new Set(priorities).size > 1 && priorityVariance > 1;
  const hasVaryingArrivals    = arrivals.some(a => a > 0);
  const hasBurstVariety       = burstStdDev > avgBurst * 0.3;
  const isInteractive         = avgBurst < 4;

  // ── Rule engine — pick recommendation + scores ──
  let recommendation, reasons, scores;

  if (hasDistinctPriorities && priorityVariance > 3) {
    recommendation = 'Priority Scheduling';
    reasons = [
      `Tasks have high priority variance (${priorityVariance.toFixed(1)}) — priority scheduling ensures critical tasks run first`,
      'Priority-based ordering reduces average turnaround for high-priority processes',
      'If starvation is a concern, consider Preemptive Priority with aging',
    ];
    scores = { FCFS: 45, SJF: 60, SRTF: 65, Priority: 95, PreemptivePriority: 90, RR: 55 };

  } else if (hasBurstVariety && !hasDistinctPriorities) {
    recommendation = 'SRTF';
    reasons = [
      `High burst time variance (σ=${burstStdDev.toFixed(1)}) — SRTF minimises average waiting time`,
      'Preemptive nature handles newly arrived short tasks efficiently',
      'Optimal for throughput when burst times are unpredictable',
    ];
    scores = { FCFS: 40, SJF: 80, SRTF: 95, Priority: 55, PreemptivePriority: 60, RR: 65 };

  } else if (isInteractive) {
    recommendation = 'Round Robin';
    reasons = [
      `Short average burst time (${avgBurst.toFixed(1)} units) indicates interactive processes`,
      'Round Robin ensures fairness and good response time for all tasks',
      'Prevents any single task from monopolising CPU',
    ];
    scores = { FCFS: 50, SJF: 65, SRTF: 70, Priority: 55, PreemptivePriority: 60, RR: 95 };

  } else if (!hasVaryingArrivals) {
    recommendation = 'SJF';
    reasons = [
      'All tasks arrive simultaneously — SJF is optimal for minimising average wait',
      'Non-preemptive variant reduces context-switch overhead',
      'Works best when burst times are known in advance',
    ];
    scores = { FCFS: 55, SJF: 95, SRTF: 85, Priority: 65, PreemptivePriority: 60, RR: 70 };

  } else {
    recommendation = 'Round Robin';
    reasons = [
      'Mixed characteristics — Round Robin provides balanced fairness',
      'Suitable for time-sharing environments with unpredictable tasks',
      'Tune quantum size to balance response time and throughput',
    ];
    scores = { FCFS: 50, SJF: 65, SRTF: 70, Priority: 60, PreemptivePriority: 65, RR: 90 };
  }

  // ── Render recommendation text ──
  document.getElementById('ai-content').innerHTML = `
    <div class="ai-recommendation">
      Recommended: <span class="ai-rec-algo">${recommendation}</span>
    </div>
    <div class="ai-reasoning">
      ${reasons.map(r => `
        <div class="reason-item">
          <div class="reason-dot"></div>
          <span>${r}</span>
        </div>`).join('')}
    </div>
    <div style="margin-top:12px;padding:10px;background:rgba(255,255,255,.04);border-radius:8px;
                font-size:12px;font-family:var(--mono);color:var(--muted)">
      Tasks: ${tasks.length} · Avg Burst: ${avgBurst.toFixed(1)} · σ Burst: ${burstStdDev.toFixed(1)} · Priority Var: ${priorityVariance.toFixed(1)}
    </div>
  `;

  // ── Render score matrix bars ──
  renderScoreMatrix(scores);

  // ── Render radar profile chart ──
  renderProfileChart({ avgBurst, burstStdDev, priorityVariance, hasVaryingArrivals });
}

// ── Score matrix ────────────────────────────────────────────

/** Map score thresholds → CSS colour variables. */
function getScoreColor(score) {
  if (score >= 90) return 'var(--green)';
  if (score >= 80) return 'var(--accent2)';
  if (score >= 65) return 'var(--amber)';
  if (score >= 55) return 'var(--muted)';
  return 'var(--red)';
}

/**
 * Render a horizontal bar for each algorithm showing its suitability score.
 * @param {Object} scores - { algorithmId: number (0–100) }
 */
function renderScoreMatrix(scores) {
  const container = document.getElementById('score-matrix');
  container.innerHTML = ALGORITHMS.map(a => {
    const s     = scores[a.id] || 50;
    const color = getScoreColor(s);
    return `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
        <span style="font-size:12px;font-family:var(--mono);color:var(--muted);width:90px;flex-shrink:0">${a.label}</span>
        <div style="flex:1;height:8px;background:rgba(255,255,255,.06);border-radius:4px;overflow:hidden">
          <div style="width:${s}%;height:100%;background:${color};border-radius:4px;transition:width .6s ease"></div>
        </div>
        <span style="font-size:12px;font-family:var(--mono);color:${color};width:30px;text-align:right">${s}</span>
      </div>`;
  }).join('');
}

// ── Radar profile chart ─────────────────────────────────────

/**
 * Render (or re-render) the radar chart showing the task-set profile.
 * @param {{ avgBurst, burstStdDev, priorityVariance, hasVaryingArrivals }} features
 */
function renderProfileChart({ avgBurst, burstStdDev, priorityVariance, hasVaryingArrivals }) {
  if (chartProfile) chartProfile.destroy();

  chartProfile = new Chart(document.getElementById('chart-profile'), {
    type: 'radar',
    data: {
      labels: ['Burst Variety', 'Priority Diff', 'Concurrency', 'Interactivity', 'Avg Burst'],
      datasets: [{
        label: 'Task Profile',
        data: [
          Math.min(100, (burstStdDev / avgBurst) * 100),  // burst variety
          Math.min(100, priorityVariance * 20),             // priority differentiation
          hasVaryingArrivals ? 75 : 20,                     // concurrency (varying arrivals)
          Math.min(100, (10 / Math.max(1, avgBurst)) * 100),// interactivity
          Math.min(100, avgBurst * 8),                      // raw avg burst scaled
        ],
        backgroundColor: 'rgba(108,99,255,.2)',
        borderColor:     '#6c63ff',
        pointBackgroundColor: '#6c63ff',
        borderWidth: 2,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        r: {
          grid:        { color: 'rgba(255,255,255,.08)' },
          pointLabels: { color: '#7a8ba8', font: { size: 11 } },
          ticks:       { color: '#444',    font: { size: 9  } },
          angleLines:  { color: 'rgba(255,255,255,.08)' },
        },
      },
    },
  });
}