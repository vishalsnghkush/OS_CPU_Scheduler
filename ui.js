// ============================================================
//  ui.js — Tab switching, algorithm selector, and app initialisation
// ============================================================

// ── Tab navigation ──────────────────────────────────────────

/** Default tab order, also used for the legacy markup without data-tab. */
const TAB_IDS = ['builder', 'simulation', 'comparison', 'multicore', 'ai'];
const TAB_CONTENT = {
  builder: { title: 'Task builder', description: 'Great simulations start with a little preparation. Build your workload below.' },
  simulation: { title: 'Simulation', description: 'Watch tasks execute and explore scheduling performance.' },
  comparison: { title: 'Algorithm comparison', description: 'Compare scheduling algorithms on your current task queue.' },
  multicore: { title: 'Multi-core simulation', description: 'Explore how tasks run across multiple CPU cores.' },
  ai: { title: 'AI advisor', description: 'Find scheduling recommendations based on your task profile.' },
};

/** Initialise native tabs and their keyboard navigation. */
function initTabs() {
  document.querySelectorAll('.tab').forEach((element, index) => {
    let tab = element;
    // Keep the existing markup working without requiring an HTML migration.
    if (tab.tagName !== 'BUTTON') {
      tab = document.createElement('button');
      Array.from(element.attributes).forEach(attribute => {
        tab.setAttribute(attribute.name, attribute.value);
      });
      tab.innerHTML = element.innerHTML;
      element.replaceWith(tab);
    }

    const id = tab.dataset.tab || TAB_IDS[index];
    tab.type = 'button';
    tab.dataset.tab = id;
    tab.id = 'tab-' + id;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', 'panel-' + id);
    tab.parentElement.setAttribute('role', 'tablist');

    const panel = document.getElementById('panel-' + id);
    if (panel) {
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', tab.id);
    }

    // Existing inline click handlers continue to use switchTab().
    if (!tab.hasAttribute('onclick')) {
      tab.addEventListener('click', () => switchTab(id));
    }
    tab.addEventListener('keydown', event => {
      const tabs = Array.from(document.querySelectorAll('.tab'));
      const current = tabs.indexOf(tab);
      let next;
      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown': next = (current + 1) % tabs.length; break;
        case 'ArrowLeft':
        case 'ArrowUp': next = (current - 1 + tabs.length) % tabs.length; break;
        case 'Home': next = 0; break;
        case 'End': next = tabs.length - 1; break;
        default: return;
      }
      event.preventDefault();
      switchTab(tabs[next].dataset.tab);
      tabs[next].focus();
    });
  });

  const active = document.querySelector('.tab.active');
  switchTab(active ? active.dataset.tab : TAB_IDS[0]);
}

/**
 * Switch the visible panel and highlight the matching tab.
 * @param {'builder'|'simulation'|'comparison'|'multicore'|'ai'} id
 */
function switchTab(id) {
  if (!Object.prototype.hasOwnProperty.call(TAB_CONTENT, id)) return;

  document.querySelectorAll('.tab').forEach(tab => {
    const selected = tab.dataset.tab === id;
    tab.classList.toggle('active', selected);
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });
  document.querySelectorAll('.panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === 'panel-' + id);
  });

  const title = document.getElementById('page-title');
  const description = document.getElementById('page-description');
  if (title) title.textContent = TAB_CONTENT[id].title;
  if (description) description.textContent = TAB_CONTENT[id].description;
}

// ── Algorithm selector ──────────────────────────────────────

const ALGO_DESCRIPTIONS = {
  FCFS: 'First come, first served',
  SJF: 'Shortest job first',
  SRTF: 'Shortest remaining time',
  Priority: 'Highest priority first',
  PreemptivePriority: 'Preemptive priority',
  RR: 'A turn for every task',
};

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
    <button type="button"
            class="algo-chip ${a.id === selectedAlgo ? 'selected' : ''} ${a.preemptive ? 'preemptive' : ''}"
            aria-pressed="${a.id === selectedAlgo}"
            onclick="selectAlgo('${a.id}')">
      <span class="algo-label">${a.label}</span>
      <span class="algo-description">${ALGO_DESCRIPTIONS[a.id] || a.label}</span>
    </button>
  `).join('');
  updateAlgoBadge();
}

/** Sync the header badge with the currently selected algorithm. */
function updateAlgoBadge() {
  document.getElementById('algo-badge').textContent = selectedAlgo;
  const summary = document.getElementById('summary-algo');
  const algorithm = ALGORITHMS.find(a => a.id === selectedAlgo);
  if (summary) summary.textContent = algorithm ? algorithm.label : selectedAlgo;
}

// ── App initialisation ──────────────────────────────────────

/**
 * Bootstrap the application:
 *   1. Initialise accessible tabs and the algorithm grid
 *   2. Wire up the speed slider label and core-count displays
 */
function init() {
  initTabs();
  selectAlgo(selectedAlgo);

  const coresInput = document.getElementById('cores-input');
  function updateCoreDisplays() {
    const cores = Math.max(1, Math.min(4, parseInt(coresInput.value, 10) || 1));
    document.getElementById('cpu-badge').textContent = cores + ' CORE' + (cores > 1 ? 'S' : '');
    const summary = document.getElementById('summary-cores');
    if (summary) summary.innerHTML = cores + '<span>' + (cores > 1 ? 'cores' : 'core') + '</span>';
  }
  coresInput.addEventListener('input', updateCoreDisplays);
  updateCoreDisplays();

  // Keep the speed label in sync with the range slider
  document.getElementById('sim-speed').addEventListener('input', function () {
    document.getElementById('speed-label').textContent = this.value + 'x';
  });
}

// Run on page load
init();
loadPreset('mixed');