// ============================================================
//  comparison.js — Multi-algorithm comparison tab
//
//  Runs all 6 algorithms on the current task set and renders:
//    - A comparison table (with best cells highlighted)
//    - Two Chart.js bar charts (Avg Wait & Avg Turnaround)
// ============================================================

/** Colour palette used for the bar charts (one bar per algorithm). */
const CHART_COLORS = ['#b9a3e6', '#80c4d6', '#e3a3b7', '#a8d998', '#e8c080', '#9caee5'];

/** Shared Chart.js options for dark-themed bar charts. */
const BAR_CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: { grid: { color: 'rgba(255,255,255,.06)' }, ticks: { color: '#a1a3a5', font: { size: 11 } } },
    x: { grid: { display: false },                 ticks: { color: '#a1a3a5', font: { size: 10 } } },
  },
};

/**
 * Run all algorithms on the current tasks, populate the comparison
 * table and re-draw both bar charts.
 */
function runComparison() {
  if (!tasks.length) { alert('Add tasks first!'); return; }

  // ── Compute results for every algorithm ──
  const results = ALGORITHMS.map(a => {
    const r = runAlgorithm(a.id, tasks);
    const m = computeMetrics(r);
    return { algo: a.label, id: a.id, ...m };
  });

  // Find best (min/max) values to highlight
  const minWait       = Math.min(...results.map(r => r.avgWait));
  const minTurnaround = Math.min(...results.map(r => r.avgTurnaround));
  const maxUtil       = Math.max(...results.map(r => r.utilization));

  // ── Comparison table ──
  const tbody = document.getElementById('compare-tbody');
  tbody.innerHTML = results.map(r => `
    <tr>
      <td style="font-weight:700;font-family:var(--mono)">${r.algo}</td>
      <td class="${r.avgWait       === minWait       ? 'best-cell' : ''}">${r.avgWait.toFixed(2)}</td>
      <td class="${r.avgTurnaround === minTurnaround ? 'best-cell' : ''}">${r.avgTurnaround.toFixed(2)}</td>
      <td>${r.throughput.toFixed(3)}</td>
      <td class="${r.utilization   === maxUtil       ? 'best-cell' : ''}">${r.utilization.toFixed(1)}%</td>
      <td>${r.contextSwitches}</td>
    </tr>
  `).join('');

  const labels        = results.map(r => r.algo);
  const waitData      = results.map(r => parseFloat(r.avgWait.toFixed(2)));
  const turnaroundData= results.map(r => parseFloat(r.avgTurnaround.toFixed(2)));

  // ── Avg Wait bar chart ──
  if (chartWait) chartWait.destroy();
  chartWait = new Chart(document.getElementById('chart-wait'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Avg Wait Time',
        data: waitData,
        backgroundColor: CHART_COLORS,
        borderRadius: 6,
        borderSkipped: false,
      }],
    },
    options: BAR_CHART_OPTIONS,
  });

  // ── Avg Turnaround bar chart ──
  if (chartTurnaround) chartTurnaround.destroy();
  chartTurnaround = new Chart(document.getElementById('chart-turnaround'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Avg Turnaround',
        data: turnaroundData,
        backgroundColor: CHART_COLORS,
        borderRadius: 6,
        borderSkipped: false,
      }],
    },
    options: BAR_CHART_OPTIONS,
  });
}