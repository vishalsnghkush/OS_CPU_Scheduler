# ⚙️ CPU Scheduler Pro

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Vanilla JS](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/HTML5)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![Chart.js](https://img.shields.io/badge/Chart.js-4.4+-FF6384?logo=chartdotjs&logoColor=white)](https://www.chartjs.org/)

An interactive, responsive, and visual **CPU Scheduling Simulator and Analysis Workbench** built with vanilla HTML, CSS, and modern JavaScript. 

Designed for operating systems students, educators, and software engineers to visualize, simulate, and benchmark CPU scheduling algorithms in real-time.

---

## 📑 Table of Contents

- [Features](#-features)
- [Supported Scheduling Algorithms](#-supported-scheduling-algorithms)
- [Performance Metrics Explained](#-performance-metrics-explained)
- [Project Architecture](#-project-architecture)
- [Getting Started](#-getting-started)
- [How It Works](#-how-it-works)
  - [1. Task Builder](#1-task-builder)
  - [2. Interactive Simulation](#2-interactive-simulation)
  - [3. Multi-Algorithm Comparison](#3-multi-algorithm-comparison)
  - [4. Multi-Core Simulation](#4-multi-core-simulation)
  - [5. AI Scheduling Advisor](#5-ai-scheduling-advisor)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🚀 Features

- **Intuitive Workload Builder**: Define custom processes with arrival time, burst time, priority, and memory requirements, or choose from built-in presets (*Mixed*, *Priority*, *Burst*).
- **Interactive Step-by-Step Simulation**: Play, pause, resume, and adjust simulation speeds from 1x to 10x with real-time Gantt chart animations and ready queue tracking.
- **Side-by-Side Algorithm Comparison**: Benchmark all 6 algorithms simultaneously on the exact same workload with highlighted best metrics and interactive Chart.js bar visualizations.
- **Multi-Core Simulation**: Distribute processes across up to 4 parallel CPU cores using load-balanced distribution and parallel timeline tracking.
- **Rule-Based AI Scheduling Advisor**: Client-side heuristic analysis that evaluates workload variance, interactivity, and priority spread to recommend optimal scheduling strategies.
- **Zero Dependencies / 100% Client-Side**: Runs directly in any modern browser without servers, runtimes, or build steps.

---

## 🧠 Supported Scheduling Algorithms

| Algorithm | Preemptive | Criteria / Selection Rule | Best Suited For |
| :--- | :---: | :--- | :--- |
| **FCFS** (First-Come, First-Served) | ❌ No | Order of process arrival time | Batch processing where arrival order is fair |
| **SJF** (Shortest Job First) | ❌ No | Shortest total CPU burst time | Known burst workloads to minimize wait time |
| **SRTF** (Shortest Remaining Time First) | ✔️ Yes | Shortest remaining execution time | Dynamic workloads prioritizing quick completions |
| **Priority** (Non-Preemptive) | ❌ No | Highest priority value | Critical tasks that must run to completion uninterrupted |
| **Preemptive Priority** | ✔️ Yes | Highest priority; preempts currently running task | Real-time / interrupt-driven systems |
| **RR** (Round Robin) | ✔️ Yes | Time quantum slicing in circular FIFO queue | Time-sharing and interactive multi-user systems |

---

## 📐 Performance Metrics Explained

The simulator calculates key operating systems scheduling metrics for every process and aggregate workload:

- **Turnaround Time ($TAT$)**: Total time taken from process submission to process completion.
  $$\text{Turnaround Time} = \text{Completion Time} - \text{Arrival Time}$$

- **Waiting Time ($WT$)**: Total duration spent waiting in the ready queue.
  $$\text{Waiting Time} = \text{Turnaround Time} - \text{Burst Time}$$

- **CPU Utilization**: Percentage of simulation time the CPU was actively processing tasks.
  $$\text{CPU Utilization} = \left(\frac{\text{Total Busy Time}}{\text{Total Simulation Time}}\right) \times 100\%$$

- **Throughput**: Number of completed processes per unit of simulation time.
  $$\text{Throughput} = \frac{\text{Number of Completed Tasks}}{\text{Total Simulation Time}}$$

- **Context Switches**: Number of times the CPU switched execution between distinct processes.

---

## 📂 Project Architecture

```
OS_CPU_Scheduler/
├── index.html         # Main application interface and workspace layout
├── style.css          # Dark-theme UI styling, typography, and responsive grid
├── constants.js       # Global constants, color palettes, and shared application state
├── tasks.js           # Process CRUD operations, preset management, and queue rendering
├── algorithms.js      # Core scheduling algorithm implementations and metric calculations
├── simulation.js      # Animation loop, step-by-step Gantt rendering, and playback controls
├── comparision.js     # Side-by-side benchmark runner and Chart.js chart generation
├── multicore.js       # Multi-core load distribution and parallel core execution
├── ai-advisor.js      # Heuristic statistical analysis and scoring matrix
└── README.md          # Project documentation and user guide
```

---

## 💻 Getting Started

Because CPU Scheduler Pro is built entirely with client-side vanilla web technologies, running it requires no build tools or package managers:

### Method 1: Direct Browser Launch
1. Clone the repository:
   ```bash
   git clone https://github.com/vishalsnghkush/OS_CPU_Scheduler.git
   ```
2. Navigate into the directory:
   ```bash
   cd OS_CPU_Scheduler
   ```
3. Open `index.html` in your web browser (double-click the file or drag it into Chrome, Edge, Firefox, or Safari).

### Method 2: Local HTTP Server (Optional)
If you prefer running through a local server:

- **Using Python 3**:
  ```bash
  python -m http.server 8000
  ```
  Then visit `http://localhost:8000` in your browser.

- **Using Node.js (`npx`)**:
  ```bash
  npx serve .
  ```

---

## 🔍 How It Works

### 1. Task Builder
Add individual tasks by configuring:
- **Process Name**: Custom label (e.g., `T1`, `P2`)
- **Arrival Time**: Simulation time unit when the task enters the ready queue
- **Burst Time**: Total CPU time units required for execution
- **Priority**: Process priority weighting
- **Memory**: Memory footprint in MB

### 2. Interactive Simulation
Watch the Gantt chart unfold in real time. Use playback buttons (Start, Pause, Resume, Reset) and control the playback speed slider to observe preemptions, context switches, and queue transitions step-by-step.

### 3. Multi-Algorithm Comparison
Compare all scheduling strategies side-by-side on identical workloads. The system highlights winning metrics (lowest wait, lowest turnaround, highest utilization) and visualizes the trade-offs on interactive bar charts.

### 4. Multi-Core Simulation
Select 1 to 4 logical CPU cores. The engine distributes processes across available cores using burst-balanced assignment and displays both individual core metrics and a unified parallel Gantt timeline.

### 5. AI Scheduling Advisor
An offline statistical advisor analyzes:
- Burst time variance & standard deviation ($\sigma$)
- Priority variance
- Arrival time spread
- Workload interactivity ratios

It generates a scored recommendation matrix and explains why a specific algorithm is best suited for your workload.

---

## 🤝 Contributing

Contributions, bug reports, and feature requests are welcome!

### How to Contribute:
1. **Fork** the repository to your own GitHub account.
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/<your-username>/OS_CPU_Scheduler.git
   cd OS_CPU_Scheduler
   ```
3. **Create a new branch** for your feature or fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Make your changes** and test thoroughly in your browser.
5. **Commit** your changes with a descriptive commit message:
   ```bash
   git commit -m "Add feature: <description of changes>"
   ```
6. **Push** to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Open a Pull Request** against the `main` branch of `vishalsnghkush/OS_CPU_Scheduler`.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
