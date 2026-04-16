// ============================================================
//  ui.js — Tab switching, algorithm selector, and app initialisation
// ============================================================

// ── Tab navigation ──────────────────────────────────────────

/** Panel IDs in the same order as the tab elements in the DOM. */
const TAB_IDS = ['builder', 'simulation', 'comparison', 'multicore', 'ai'];

/**
 * Switch the visible panel and highlight the matching tab.
 * @param {'builder'|'simulation'|'comparison'|'multicore'|'ai'} id
 */
function switchTab(id) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));

  const idx = TAB_IDS.indexOf(id);
  document.querySelectorAll('.tab')[idx].classList.add('active');
  document.getElementById('panel-' + id).classList.add('active');
}

// ── Algorithm selector ──────────────────────────────────────

/**
 * Set the active algorithm and re-render the chip grid.
 * @param {string} id - Algorithm ID from ALGORITHMS constant
 */
function selectAlgo(id) {
  selectedAlgo = id;
  renderAlgoGrid();
  // Show quantum input only for Round Robin
  document.getElementById('quantum-row').style.display = id === 'RR' ? 'flex' : 'none';
}

/** Re-render the algorithm selection chip grid. */
function renderAlgoGrid() {
  const grid = document.getElementById('algo-grid');
  grid.innerHTML = ALGORITHMS.map(a => `
    <div class="algo-chip ${a.id === selectedAlgo ? 'selected' : ''} ${a.preemptive ? 'preemptive' : ''}"
         onclick="selectAlgo('${a.id}')">
      ${a.label}
    </div>
  `).join('');
  updateAlgoBadge();
}

/** Sync the header badge with the currently selected algorithm. */
function updateAlgoBadge() {
  document.getElementById('algo-badge').textContent = selectedAlgo;
}

// ── App initialisation ──────────────────────────────────────

/**
 * Bootstrap the application:
 *   1. Render the algorithm grid
 *   2. Wire up the speed slider label
 *   3. Load the default preset so the UI is never blank
 */
function init() {
  renderAlgoGrid();

  // Keep the speed label in sync with the range slider
  document.getElementById('sim-speed').addEventListener('input', function () {
    document.getElementById('speed-label').textContent = this.value + 'x';
  });
}

// Run on page load
init();
loadPreset('mixed');