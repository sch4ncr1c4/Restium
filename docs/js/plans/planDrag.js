import { PLAN_PADDING, TABLE_COUNT, DESKTOP_TABLE_COLUMNS, TABLE_GAP_DESKTOP } from "../config.js";
import { clamp } from "../utils/math.js";
import { getGridTables, readTablePosition, setTablePosition, getPlanKeyByGrid, isPlanLocked } from "./planGrid.js";

function getGroupBounds(tables, tableSize) {
  let minLeft = Infinity;
  let minTop = Infinity;
  let maxRight = -Infinity;
  let maxBottom = -Infinity;

  tables.forEach((table) => {
    const pos = readTablePosition(table);
    minLeft = Math.min(minLeft, pos.left);
    minTop = Math.min(minTop, pos.top);
    maxRight = Math.max(maxRight, pos.left + tableSize);
    maxBottom = Math.max(maxBottom, pos.top + tableSize);
  });

  return { minLeft, minTop, maxRight, maxBottom };
}

export function startTableDrag(state, event) {
  const planKey = getPlanKeyByGrid(state, event.currentTarget.parentElement);
  if (isPlanLocked(state, planKey)) return;

  event.stopPropagation();
  const table = event.currentTarget;
  const grid = table.parentElement;
  const tableBounds = table.getBoundingClientRect();
  const gridBounds = grid.getBoundingClientRect();

  state.dragState = {
    mode: "table",
    grid,
    table,
    startX: event.clientX,
    startY: event.clientY,
    offsetX: event.clientX - tableBounds.left,
    offsetY: event.clientY - tableBounds.top,
    gridBounds,
    moved: false,
  };

  table.classList.remove("cursor-grab");
  table.classList.add("cursor-grabbing", "z-20", "shadow-md");
}

export function startPlanPan(state, event) {
  if (event.target !== event.currentTarget) return;
  const planKey = getPlanKeyByGrid(state, event.currentTarget);
  if (isPlanLocked(state, planKey)) return;

  state.dragState = {
    mode: "plan",
    grid: event.currentTarget,
    startX: event.clientX,
    startY: event.clientY,
  };
}

function moveTableDrag(state, event) {
  const tableSize = parseFloat(state.dragState.grid.dataset.tableSize || "0");
  const minPos = PLAN_PADDING;
  const maxLeft = state.dragState.grid.clientWidth - tableSize - PLAN_PADDING;
  const maxTop = state.dragState.grid.clientHeight - tableSize - PLAN_PADDING;

  const nextLeft = clamp(event.clientX - state.dragState.gridBounds.left - state.dragState.offsetX, minPos, maxLeft);
  const nextTop = clamp(event.clientY - state.dragState.gridBounds.top - state.dragState.offsetY, minPos, maxTop);
  const collides = getGridTables(state.dragState.grid).some((other) => {
    if (other === state.dragState.table) return false;
    const pos = readTablePosition(other);
    return (
      nextLeft < pos.left + tableSize &&
      nextLeft + tableSize > pos.left &&
      nextTop < pos.top + tableSize &&
      nextTop + tableSize > pos.top
    );
  });

  if (!collides) {
    setTablePosition(state.dragState.table, nextLeft, nextTop);
  }

  if (Math.abs(event.clientX - state.dragState.startX) > 3 || Math.abs(event.clientY - state.dragState.startY) > 3) {
    state.dragState.moved = true;
  }
}

function movePlanPan(state, event) {
  const grid = state.dragState.grid;
  const tables = getGridTables(grid);
  const tableSize = parseFloat(grid.dataset.tableSize || "0");
  const groupBounds = getGroupBounds(tables, tableSize);
  const diffX = event.clientX - state.dragState.startX;
  const diffY = event.clientY - state.dragState.startY;

  const minShiftX = PLAN_PADDING - groupBounds.minLeft;
  const maxShiftX = grid.clientWidth - PLAN_PADDING - groupBounds.maxRight;
  const minShiftY = PLAN_PADDING - groupBounds.minTop;
  const maxShiftY = grid.clientHeight - PLAN_PADDING - groupBounds.maxBottom;

  const shiftX = clamp(diffX, minShiftX, maxShiftX);
  const shiftY = clamp(diffY, minShiftY, maxShiftY);

  tables.forEach((table) => {
    const pos = readTablePosition(table);
    setTablePosition(table, pos.left + shiftX, pos.top + shiftY);
  });

  state.dragState.startX = event.clientX;
  state.dragState.startY = event.clientY;
}

export function moveDrag(state, event) {
  if (!state.dragState) return;
  event.preventDefault();
  if (state.dragState.mode === "table") {
    moveTableDrag(state, event);
    return;
  }
  if (state.dragState.mode === "plan") {
    movePlanPan(state, event);
  }
}

export function endDrag(state) {
  if (!state.dragState) return;

  if (state.dragState.mode === "table") {
    if (state.dragState.moved) {
      state.tableJustDragged = true;
      setTimeout(() => {
        state.tableJustDragged = false;
      }, 140);
    }
    state.dragState.table.classList.remove("cursor-grabbing", "z-20", "shadow-md");
    const planKey = getPlanKeyByGrid(state, state.dragState.grid);
    if (!isPlanLocked(state, planKey)) {
      state.dragState.table.classList.add("cursor-grab");
    }
  }

  state.dragState = null;
}

export function initPlanDrag(state) {
  document.addEventListener("pointermove", (event) => moveDrag(state, event));
  document.addEventListener("pointerup", () => endDrag(state));
  document.addEventListener("pointercancel", () => endDrag(state));
}
