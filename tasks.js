// ============================================================
//  tasks.js — Task management: add, remove, presets, table render
// ============================================================

// ── Preset task sets ────────────────────────────────────────

const PRESETS = {
  mixed: [
    { name: 'T1', arrival: 0, burst: 8, priority: 3, memory: 512 },
    { name: 'T2', arrival: 1, burst: 4, priority: 1, memory: 256 },
    { name: 'T3', arrival: 2, burst: 9, priority: 4, memory: 128 },
    { name: 'T4', arrival: 3, burst: 5, priority: 2, memory: 256 },
    { name: 'T5', arrival: 4, burst: 2, priority: 1, memory: 512 },
    { name: 'T6', arrival: 5, burst: 6, priority: 3, memory: 256 },
  ],
  priority: [
    { name: 'P1', arrival: 0, burst: 5, priority: 3, memory: 256 },
    { name: 'P2', arrival: 0, burst: 8, priority: 1, memory: 128 },
    { name: 'P3', arrival: 2, burst: 3, priority: 5, memory: 512 },
    { name: 'P4', arrival: 3, burst: 6, priority: 2, memory: 256 },
    { name: 'P5', arrival: 4, burst: 4, priority: 4, memory: 128 },
  ],
  burst: [
    { name: 'S1', arrival: 0, burst: 2,  priority: 1, memory: 128 },
    { name: 'S2', arrival: 1, burst: 10, priority: 1, memory: 512 },
    { name: 'S3', arrival: 2, burst: 4,  priority: 1, memory: 256 },
    { name: 'S4', arrival: 3, burst: 1,  priority: 1, memory: 128 },
    { name: 'S5', arrival: 4, burst: 7,  priority: 1, memory: 256 },
    { name: 'S6', arrival: 5, burst: 3,  priority: 1, memory: 128 },
  ],
};

// ── CRUD operations ─────────────────────────────────────────

/** Read form fields and push a new task into the global array. */
function addTask() {
  const name     = document.getElementById('in-name').value.trim() || ('T' + taskIdCounter);
  const arrival  = parseInt(document.getElementById('in-arrival').value)  || 0;
  const burst    = Math.max(1, parseInt(document.getElementById('in-burst').value)    || 5);
  const priority = parseInt(document.getElementById('in-priority').value) || 1;
  const memory   = parseInt(document.getElementById('in-memory').value)   || 256;

  tasks.push({
    id:       taskIdCounter++,
    name, arrival, burst, priority, memory,
    color:    COLORS[tasks.length % COLORS.length],
  });

  // Prepare input fields for the next task
  document.getElementById('in-name').value    = 'T' + taskIdCounter;
  document.getElementById('in-arrival').value = '';

  renderTaskTable();
}

/** Remove a task at a given index. */
function removeTask(idx) {
  tasks.splice(idx, 1);
  renderTaskTable();
}

/** Clear all tasks and reset the ID counter. */
function clearTasks() {
  tasks         = [];
  taskIdCounter = 1;
  renderTaskTable();
}

/**
 * Replace the task list with a named preset.
 * @param {'mixed'|'priority'|'burst'} type
 */
function loadPreset(type) {
  tasks         = [];
  taskIdCounter = 1;
  PRESETS[type].forEach((t, i) => {
    tasks.push({ id: taskIdCounter++, ...t, color: COLORS[i % COLORS.length] });
  });
  renderTaskTable();
}

// ── Table rendering ─────────────────────────────────────────

/** Re-render the task table and update header badges. */
function renderTaskTable() {
  const tbody     = document.getElementById('task-tbody');
  const coreCount = document.getElementById('cores-input').value;

  // Update header badges
  document.getElementById('task-count').textContent = tasks.length + ' tasks';
  document.getElementById('cpu-badge').textContent  =
    coreCount + ' CORE' + (parseInt(coreCount) > 1 ? 'S' : '');

  document.getElementById('summary-tasks').innerHTML = tasks.length + '<span>tasks</span>';
  const totalBurst = tasks.reduce((total, task) => total + task.burst, 0);
  document.getElementById('summary-burst').innerHTML = totalBurst + '<span>units</span>';
  document.getElementById('preview-total').textContent = totalBurst + ' units';

  // This is a workload breakdown, not an algorithm execution timeline.
  const preview = document.getElementById('workload-preview');
  preview.replaceChildren(...tasks.map(task => {
    const block = document.createElement('span');
    block.style.flex = task.burst;
    block.style.background = task.color;
    block.textContent = task.name;
    return block;
  }));

  if (!tasks.length) {
    tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state"><strong>Your queue is a clean slate.</strong><br>Add a process or choose a preset to get started.</div></td></tr>';
    return;
  }

  tbody.innerHTML = tasks.map((t, i) => `
    <tr class="slide-in">
      <td><span class="task-color" style="background:${t.color}"></span></td>
      <td style="font-weight:700;font-family:var(--mono)">${t.name}</td>
      <td>${t.arrival}</td>
      <td>${t.burst}</td>
      <td>${t.priority}</td>
      <td>${t.memory}MB</td>
      <td><button type="button" class="remove-btn" aria-label="Remove process ${i + 1}" title="Remove process" onclick="removeTask(${i})">✕</button></td>
    </tr>
  `).join('');
}