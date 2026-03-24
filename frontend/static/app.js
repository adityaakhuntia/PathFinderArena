const state = {
  rows: 6,
  cols: 10,
  start: [1, 1],
  goal: [4, 8],
  walls: new Set(),
  currentTool: "wall",
  isAnimating: false,
  latestResults: [],
};

const elements = {
  gridBoard: document.getElementById("gridBoard"),
  miniGrid: document.getElementById("miniGrid"),
  arenaSection: document.getElementById("arena"),
  algorithmSelect: document.getElementById("algorithmSelect"),
  rowsInput: document.getElementById("rowsInput"),
  colsInput: document.getElementById("colsInput"),
  runSelectedBtn: document.getElementById("runSelectedBtn"),
  runRaceBtn: document.getElementById("runRaceBtn"),
  resetBoardBtn: document.getElementById("resetBoardBtn"),
  runRaceHeroBtn: document.getElementById("runRaceHeroBtn"),
  statusBadge: document.getElementById("statusBadge"),
  resultsGrid: document.getElementById("resultsGrid"),
  reasoningFeed: document.getElementById("reasoningFeed"),
  insightSummary: document.getElementById("insightSummary"),
  heroWinner: document.getElementById("heroWinner"),
  toolButtons: [...document.querySelectorAll(".tool-btn")],
};

function keyOf(row, col) {
  return `${row},${col}`;
}

function decodeKey(value) {
  return value.split(",").map(Number);
}

function syncInputs() {
  elements.rowsInput.value = state.rows;
  elements.colsInput.value = state.cols;
}

function clearVisualState() {
  for (const cell of elements.gridBoard.querySelectorAll(".cell")) {
    cell.classList.remove("visited", "path");
  }
}

function renderMiniGrid() {
  const layout = ["......", ".##...", ".#..#.", ".#..#.", ".#..#.", "...##."];
  elements.miniGrid.innerHTML = "";
  layout.forEach((row) => {
    row.split("").forEach((char) => {
      const item = document.createElement("div");
      item.classList.add(char === "#" ? "mini-wall" : "mini-path");
      elements.miniGrid.appendChild(item);
    });
  });
}

function renderBoard() {
  elements.gridBoard.innerHTML = "";
  elements.gridBoard.style.gridTemplateColumns = `repeat(${state.cols}, minmax(0, 1fr))`;

  for (let row = 0; row < state.rows; row += 1) {
    for (let col = 0; col < state.cols; col += 1) {
      const cell = document.createElement("button");
      cell.className = "cell";
      cell.type = "button";
      cell.dataset.row = row;
      cell.dataset.col = col;
      const sameAsStart = state.start[0] === row && state.start[1] === col;
      const sameAsGoal = state.goal[0] === row && state.goal[1] === col;
      const cellKey = keyOf(row, col);
      if (state.walls.has(cellKey)) cell.classList.add("wall");
      if (sameAsStart) cell.classList.add("start");
      if (sameAsGoal) cell.classList.add("goal");
      cell.addEventListener("click", () => handleCellClick(row, col));
      elements.gridBoard.appendChild(cell);
    }
  }
}

function renderToolState() {
  elements.toolButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.tool === state.currentTool);
  });
}

function updateStatus(text) {
  elements.statusBadge.textContent = text;
}

function resizeBoard() {
  state.rows = Math.max(6, Math.min(20, Number(elements.rowsInput.value)));
  state.cols = Math.max(8, Math.min(24, Number(elements.colsInput.value)));
  state.walls = new Set(
    [...state.walls].filter((item) => {
      const [row, col] = decodeKey(item);
      return row < state.rows && col < state.cols;
    }),
  );
  state.start = [Math.min(state.start[0], state.rows - 1), Math.min(state.start[1], state.cols - 1)];
  state.goal = [Math.min(state.goal[0], state.rows - 1), Math.min(state.goal[1], state.cols - 1)];
  renderBoard();
  clearResults();
}

function handleCellClick(row, col) {
  if (state.isAnimating) return;
  const cellKey = keyOf(row, col);
  const onStart = state.start[0] === row && state.start[1] === col;
  const onGoal = state.goal[0] === row && state.goal[1] === col;

  if (state.currentTool === "wall") {
    if (!onStart && !onGoal) {
      if (state.walls.has(cellKey)) state.walls.delete(cellKey);
      else state.walls.add(cellKey);
    }
  } else if (state.currentTool === "erase") {
    state.walls.delete(cellKey);
  } else if (state.currentTool === "start" && !state.walls.has(cellKey) && !onGoal) {
    state.start = [row, col];
  } else if (state.currentTool === "goal" && !state.walls.has(cellKey) && !onStart) {
    state.goal = [row, col];
  }

  renderBoard();
}

function clearResults() {
  clearVisualState();
  state.latestResults = [];
  elements.resultsGrid.innerHTML = "";
  elements.reasoningFeed.innerHTML = "";
  elements.insightSummary.textContent = "Select a run to inspect how the algorithm moved through the grid.";
  updateStatus("Ready for simulation");
}

function serializePayload(extra = {}) {
  return {
    rows: state.rows,
    cols: state.cols,
    start: state.start,
    goal: state.goal,
    walls: [...state.walls].map(decodeKey),
    ...extra,
  };
}

async function requestJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Request failed");
  }
  return response.json();
}

function getCell(row, col) {
  return elements.gridBoard.querySelector(`[data-row="${row}"][data-col="${col}"]`);
}

async function animateResult(result) {
  clearVisualState();
  state.isAnimating = true;
  updateStatus(`Animating ${result.name}`);

  for (const [row, col] of result.visitedOrder) {
    const cell = getCell(row, col);
    if (cell && !cell.classList.contains("start") && !cell.classList.contains("goal")) {
      cell.classList.add("visited");
    }
    await sleep(18);
  }

  for (const [row, col] of result.path) {
    const cell = getCell(row, col);
    if (cell && !cell.classList.contains("start") && !cell.classList.contains("goal")) {
      cell.classList.remove("visited");
      cell.classList.add("path");
    }
    await sleep(42);
  }

  state.isAnimating = false;
  updateStatus(result.found ? `${result.name} reached the goal` : `${result.name} could not find a path`);
}

function renderResults(results, winner = null) {
  state.latestResults = results;
  elements.resultsGrid.innerHTML = "";

  results.forEach((result) => {
    const card = document.createElement("article");
    card.className = "result-card";
    if (winner && result.id === winner) card.classList.add("winner");
    const pathLength = result.metrics.pathLength ?? "No path";
    card.innerHTML = `
      <div class="result-head">
        <div>
          <span class="label">${winner && result.id === winner ? "Winner" : "Algorithm"}</span>
          <h3>${result.name}</h3>
        </div>
        <span class="pill" style="background:${hexToAlpha(result.accent, 0.18)}; color:${result.accent};">
          ${result.found ? "Path found" : "Blocked"}
        </span>
      </div>
      <div class="metric"><span>Nodes explored</span><strong>${result.metrics.nodesExplored}</strong></div>
      <div class="metric"><span>Path length</span><strong>${pathLength}</strong></div>
      <div class="metric"><span>Execution time</span><strong>${result.metrics.executionTimeMs} ms</strong></div>
    `;
    card.addEventListener("click", async () => {
      renderReasoning(result);
      await animateResult(result);
    });
    elements.resultsGrid.appendChild(card);
  });
}

function renderReasoning(result) {
  elements.insightSummary.textContent = result.summary;
  elements.reasoningFeed.innerHTML = "";
  result.steps.forEach((step) => {
    const item = document.createElement("article");
    item.className = "feed-item";
    item.innerHTML = `
      <small>Step ${step.index}</small>
      <strong>Cell (${step.node[0]}, ${step.node[1]})</strong>
      <div>${step.message}</div>
    `;
    elements.reasoningFeed.appendChild(item);
  });
}

async function runSelectedAlgorithm() {
  if (state.isAnimating) return;
  updateStatus("Running selected algorithm");
  try {
    const result = await requestJson("/api/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(serializePayload({ algorithms: [elements.algorithmSelect.value] })),
    });
    renderResults([result]);
    renderReasoning(result);
    elements.heroWinner.textContent = result.name;
    await animateResult(result);
  } catch (error) {
    updateStatus("Run failed");
    elements.insightSummary.textContent = `Error: ${error.message}`;
  }
}

async function runRaceMode() {
  if (state.isAnimating) return;
  updateStatus("Running race mode");
  try {
    const response = await requestJson("/api/race", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(serializePayload({ algorithms: ["bfs", "dfs", "greedy", "astar"] })),
    });
    renderResults(response.results, response.winner);
    const focusResult = response.results.find((item) => item.id === response.winner) || response.results[0];
    if (focusResult) {
      renderReasoning(focusResult);
      elements.heroWinner.textContent = focusResult.name;
      await animateResult(focusResult);
    }
  } catch (error) {
    updateStatus("Race failed");
    elements.insightSummary.textContent = `Error: ${error.message}`;
  }
}

async function runHeroRaceMode() {
  if (elements.arenaSection) {
    elements.arenaSection.scrollIntoView({ behavior: "smooth", block: "start" });
    await sleep(450);
  }
  await runRaceMode();
}

function resetBoard() {
  state.walls.clear();
  state.start = [1, 1];
  state.goal = [Math.max(2, state.rows - 2), Math.max(2, state.cols - 2)];
  renderBoard();
  clearResults();
}

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function hexToAlpha(hex, alpha) {
  const sanitized = hex.replace("#", "");
  const value = Number.parseInt(sanitized, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function bindEvents() {
  elements.toolButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.currentTool = button.dataset.tool;
      renderToolState();
    });
  });
  elements.rowsInput.addEventListener("change", resizeBoard);
  elements.colsInput.addEventListener("change", resizeBoard);
  elements.runSelectedBtn.addEventListener("click", runSelectedAlgorithm);
  elements.runRaceBtn.addEventListener("click", runRaceMode);
  elements.runRaceHeroBtn.addEventListener("click", runHeroRaceMode);
  elements.resetBoardBtn.addEventListener("click", resetBoard);
}

function init() {
  renderMiniGrid();
  syncInputs();
  renderToolState();
  renderBoard();
  bindEvents();
}

init();
