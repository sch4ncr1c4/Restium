import {
  TABLE_COUNT,
  DESKTOP_TABLE_COLUMNS,
  TABLE_GAP_DESKTOP,
  TABLE_GAP_MOBILE,
  MIN_TABLE_SIZE,
  MAX_TABLE_SIZE,
  PLAN_PADDING,
  PLAN_MIN_W,
  PLAN_MAX_W,
  PLAN_MIN_H,
  PLAN_MAX_H,
  PLAN_META,
} from "../config.js";
import { clamp, normalizePosition, denormalizePosition } from "../utils/math.js";

const TABLE_BASE_CLASSES = [
  "border-emerald-500",
  "bg-emerald-100",
  "text-emerald-800",
  "hover:border-emerald-600",
  "hover:bg-emerald-200",
];

const TABLE_OCCUPIED_CLASSES = [
  "border-rose-500",
  "bg-rose-100",
  "text-rose-800",
  "hover:border-rose-600",
  "hover:bg-rose-200",
];

export function getActivePlanEntries(state) {
  return Object.values(state.plans).filter((plan) => plan.card && plan.grid && plan.card.isConnected);
}

export function getActiveRemovablePlanCount(state) {
  return getActivePlanEntries(state).length;
}

export function getMissingPlanKey(state) {
  return ["primary", "secondary"].find((key) => !state.plans[key].card || !state.plans[key].card.isConnected) || null;
}

export function updateAddPlanButtonState(state) {
  if (!state.addPlanButton) return;
  const missing = getMissingPlanKey(state);
  state.addPlanButton.disabled = !missing;
  state.addPlanButton.classList.toggle("opacity-40", !missing);
  state.addPlanButton.classList.toggle("cursor-not-allowed", !missing);
}

export function updateDeletePlanButtonsState(state) {
  const canDelete = getActiveRemovablePlanCount(state) > 1;
  document.querySelectorAll('[data-plan-action="delete"]').forEach((button) => {
    button.disabled = !canDelete;
    button.classList.toggle("opacity-40", !canDelete);
    button.classList.toggle("cursor-not-allowed", !canDelete);
  });
}

export function syncStaticAsideHeight(state, forceRecalc = false) {
  if (!state.staticPlansAside || !state.plansColumn) return;
  if (window.innerWidth < 1280) {
    state.staticPlansAside.style.height = "";
    state.staticPlansAside.style.minHeight = "";
    return;
  }
  const canRecalc = forceRecalc && getActiveRemovablePlanCount(state) === 2;
  if (state.staticAsideBaselineHeight === null || canRecalc) {
    const measured = Math.round(state.plansColumn.getBoundingClientRect().height);
    if (measured > 0) state.staticAsideBaselineHeight = measured;
  }
  if (state.staticAsideBaselineHeight) {
    state.staticPlansAside.style.height = `${state.staticAsideBaselineHeight}px`;
    state.staticPlansAside.style.minHeight = `${state.staticAsideBaselineHeight}px`;
  }
}

export function getColumnsForWidth(width) {
  if (width < 768) return 5;
  if (width < 1100) return 12;
  return DESKTOP_TABLE_COLUMNS;
}

function getGapForWidth(width) {
  if (width < 768) return TABLE_GAP_MOBILE;
  return TABLE_GAP_DESKTOP;
}

function getTableSizeForWidth(width, columns, gap) {
  const availableWidth = Math.max(width - PLAN_PADDING * 2, 0);
  const rawSize = Math.floor((availableWidth - gap * (columns - 1)) / columns);
  return clamp(rawSize, MIN_TABLE_SIZE, MAX_TABLE_SIZE);
}

export function setTablePosition(table, left, top) {
  table.style.left = `${left}px`;
  table.style.top = `${top}px`;
}

export function readTablePosition(table) {
  return {
    left: parseFloat(table.style.left || "0"),
    top: parseFloat(table.style.top || "0"),
  };
}

export function getGridTables(grid) {
  return Array.from(grid.querySelectorAll("button[data-table-id]"));
}

function updateTableVisualSize(grid, tableSize) {
  getGridTables(grid).forEach((table) => {
    table.style.width = `${tableSize}px`;
    table.style.height = `${tableSize}px`;
  });
}

export function applyGridDimensions(grid) {
  const requestedWidth = parseFloat(grid.dataset.customWidth || "0") || grid.clientWidth;
  const requestedHeight = parseFloat(grid.dataset.customHeight || "0");
  const minPlanWidth = window.innerWidth < 1280 ? 320 : PLAN_MIN_W;
  const width = clamp(requestedWidth, minPlanWidth, PLAN_MAX_W);
  const columns = getColumnsForWidth(width);
  const gap = getGapForWidth(width);
  const rows = Math.ceil(TABLE_COUNT / columns);
  const tableSize = getTableSizeForWidth(width, columns, gap);
  const baseHeight = PLAN_PADDING * 2 + rows * tableSize + (rows - 1) * gap;
  const height = clamp(Math.max(requestedHeight || baseHeight, baseHeight), PLAN_MIN_H, PLAN_MAX_H);

  grid.style.width = `${width}px`;
  grid.style.height = `${height}px`;
  grid.dataset.customWidth = String(width);
  grid.dataset.customHeight = String(height);
  grid.dataset.tableSize = String(tableSize);
  grid.dataset.tableColumns = String(columns);
  grid.dataset.tableGap = String(gap);
  updateTableVisualSize(grid, tableSize);
  return { width, height, tableSize };
}

export function layoutGridTables(grid) {
  const { tableSize } = applyGridDimensions(grid);
  const columns = parseInt(grid.dataset.tableColumns || String(DESKTOP_TABLE_COLUMNS), 10);
  const gap = parseInt(grid.dataset.tableGap || String(TABLE_GAP_DESKTOP), 10);
  const tables = getGridTables(grid);
  tables.forEach((table, index) => {
    const row = Math.floor(index / columns);
    const col = index % columns;
    const left = PLAN_PADDING + col * (tableSize + gap);
    const top = PLAN_PADDING + row * (tableSize + gap);
    setTablePosition(table, left, top);
  });
}

export function resizePlan(grid, deltaWidth, deltaHeight) {
  if (!grid || !grid.isConnected) return;

  const oldWidth = grid.clientWidth;
  const oldHeight = grid.clientHeight;
  const oldTableSize = parseFloat(grid.dataset.tableSize || "0");
  const oldColumns = parseInt(grid.dataset.tableColumns || String(DESKTOP_TABLE_COLUMNS), 10);
  const oldGap = parseInt(grid.dataset.tableGap || String(TABLE_GAP_DESKTOP), 10);
  const oldRows = Math.ceil(TABLE_COUNT / oldColumns);
  const oldBaseHeight = PLAN_PADDING * 2 + oldRows * oldTableSize + (oldRows - 1) * oldGap;
  const oldMaxLeft = oldWidth - oldTableSize - PLAN_PADDING;
  const oldMaxTop = Math.max(oldHeight, oldBaseHeight) - oldTableSize - PLAN_PADDING;

  const tables = getGridTables(grid);
  const ratios = tables.map((table) => {
    const pos = readTablePosition(table);
    return {
      table,
      ratioX: normalizePosition(pos.left, PLAN_PADDING, oldMaxLeft),
      ratioY: normalizePosition(pos.top, PLAN_PADDING, oldMaxTop),
    };
  });

  grid.dataset.customWidth = String((parseFloat(grid.dataset.customWidth || "0") || oldWidth) + deltaWidth);
  grid.dataset.customHeight = String((parseFloat(grid.dataset.customHeight || "0") || oldHeight) + deltaHeight);

  const { width, height, tableSize } = applyGridDimensions(grid);
  const newColumns = parseInt(grid.dataset.tableColumns || String(DESKTOP_TABLE_COLUMNS), 10);
  const newGap = parseInt(grid.dataset.tableGap || String(TABLE_GAP_DESKTOP), 10);
  const newRows = Math.ceil(TABLE_COUNT / newColumns);
  const newBaseHeight = PLAN_PADDING * 2 + newRows * tableSize + (newRows - 1) * newGap;
  const newMaxLeft = width - tableSize - PLAN_PADDING;
  const newMaxTop = Math.max(height, newBaseHeight) - tableSize - PLAN_PADDING;

  ratios.forEach((item) => {
    const nextLeft = clamp(denormalizePosition(item.ratioX, PLAN_PADDING, newMaxLeft), PLAN_PADDING, newMaxLeft);
    const nextTop = clamp(denormalizePosition(item.ratioY, PLAN_PADDING, newMaxTop), PLAN_PADDING, newMaxTop);
    setTablePosition(item.table, nextLeft, nextTop);
  });
}

export function getPlanKeyByGrid(state, grid) {
  const found = Object.entries(state.plans).find(([, plan]) => plan.grid === grid);
  return found ? found[0] : null;
}

export function isPlanLocked(state, planKey) {
  return Boolean(planKey && state.plans[planKey] && state.plans[planKey].locked);
}

export function setPlanCursor(state, planKey) {
  const plan = state.plans[planKey];
  if (!plan || !plan.grid || !plan.card || !plan.card.isConnected) return;
  const locked = isPlanLocked(state, planKey);

  const tables = plan.grid.querySelectorAll("button[data-table-id]");
  tables.forEach((table) => {
    if (locked) {
      table.classList.remove("cursor-grab", "cursor-grabbing");
      table.classList.add("cursor-default");
      return;
    }
    table.classList.remove("cursor-default");
    table.classList.add("cursor-grab");
  });

  plan.grid.classList.toggle("cursor-move", !locked);
  plan.grid.classList.toggle("cursor-default", locked);
}

export function updatePlanLockUI(state, planKey) {
  const toggle = document.querySelector(`[data-plan-lock-toggle][data-plan="${planKey}"]`);
  if (!toggle) return;
  const locked = isPlanLocked(state, planKey);
  const lockClosedIcon =
    '<svg viewBox="0 0 20 20" fill="currentColor" class="h-3 w-3" aria-hidden="true"><path fill-rule="evenodd" d="M10 2a4 4 0 00-4 4v2H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-1V6a4 4 0 00-4-4zm2 6V6a2 2 0 10-4 0v2h4z" clip-rule="evenodd"/></svg>';
  const lockOpenIcon =
    '<svg viewBox="0 0 20 20" fill="currentColor" class="h-3 w-3" aria-hidden="true"><path d="M7 6a3 3 0 116 0v1h-2V6a1 1 0 10-2 0v2h6a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2h2V6z"/></svg>';
  if (locked) {
    toggle.innerHTML = `${lockClosedIcon}<span>Desbloquear</span>`;
    toggle.className =
      "inline-flex items-center gap-1 rounded-md bg-emeraldbrand px-2 py-1 text-[10px] font-semibold text-white hover:bg-emerald-600";
  } else {
    toggle.innerHTML = `${lockOpenIcon}<span>Bloquear</span>`;
    toggle.className =
      "inline-flex items-center gap-1 rounded-md bg-zinc-900 px-2 py-1 text-[10px] font-semibold text-white hover:bg-zinc-700";
  }
  setPlanCursor(state, planKey);
}

export function resetPlan(state, planKey) {
  const plan = state.plans[planKey];
  if (!plan || !plan.grid || !plan.card || !plan.card.isConnected) return;

  if (state.dragState && state.dragState.grid === plan.grid) {
    state.dragState = null;
  }

  plan.grid.dataset.customWidth = String(plan.defaultWidth || plan.grid.clientWidth || 1200);
  if (plan.defaultHeight) plan.grid.dataset.customHeight = String(plan.defaultHeight);
  layoutGridTables(plan.grid);
}

export function createPlanCardElement(planKey) {
  const meta = PLAN_META[planKey];
  const article = document.createElement("article");
  article.id = meta.cardId;
  article.className = "select-none rounded-xl border border-zinc-200 bg-zinc-50/40 p-3";
  article.innerHTML = `
    <div class="mb-2 flex items-center justify-between gap-2">
      <p class="text-xs font-semibold uppercase tracking-wide text-zinc-500">${meta.title}</p>
      <div class="flex items-center gap-1">
        <button data-plan-lock-toggle data-plan="${planKey}" type="button" class="rounded-md bg-zinc-900 px-2 py-1 text-[10px] font-semibold text-white hover:bg-zinc-700">Bloquear</button>
        <button data-plan-controls-toggle data-plan="${planKey}" type="button" class="rounded-md bg-zinc-100 px-2 py-1 text-[10px] font-semibold text-zinc-700 hover:bg-zinc-200">Opciones</button>
        <div data-plan-controls data-plan="${planKey}" class="hidden flex gap-1">
          <button data-plan-action="grow" data-plan="${planKey}" type="button" class="rounded-md bg-zinc-900 px-2 py-1 text-[10px] font-semibold text-white hover:bg-zinc-700">+</button>
          <button data-plan-action="shrink" data-plan="${planKey}" type="button" class="rounded-md bg-zinc-200 px-2 py-1 text-[10px] font-semibold text-zinc-700 hover:bg-zinc-300">-</button>
          <button data-plan-action="reset" data-plan="${planKey}" type="button" class="rounded-md bg-amber-100 px-2 py-1 text-[10px] font-semibold text-amber-800 hover:bg-amber-200">Resetear</button>
          <button data-plan-action="delete" data-plan="${planKey}" type="button" class="rounded-md bg-rose-100 px-2 py-1 text-[10px] font-semibold text-rose-700 hover:bg-rose-200">Eliminar</button>
        </div>
      </div>
    </div>
    <div class="overflow-auto pb-2">
      <div id="${meta.gridId}" class="relative mx-auto rounded-xl border border-zinc-200 bg-zinc-50/70"></div>
    </div>
  `;
  return article;
}

export function buildTableButton(tableNumber, handlers) {
  const table = document.createElement("button");
  table.type = "button";
  table.dataset.tableId = String(tableNumber);
  table.className = `absolute rounded-lg border text-xs font-semibold transition touch-none ${TABLE_BASE_CLASSES.join(" ")}`;
  table.textContent = tableNumber;
  table.setAttribute("aria-label", `Mesa ${tableNumber}`);
  table.addEventListener("pointerdown", handlers.onTablePointerDown);
  table.addEventListener("contextmenu", handlers.onTableContextMenu);
  table.addEventListener("click", () => handlers.onTableClick(table));
  return table;
}

function parseOrderKey(orderKey) {
  if (!orderKey || typeof orderKey !== "string") return null;
  const separator = orderKey.indexOf(":");
  if (separator <= 0) return null;
  return {
    planKey: orderKey.slice(0, separator),
    tableId: orderKey.slice(separator + 1),
  };
}

function setTableOccupiedClass(table, occupied) {
  if (!table) return;
  table.classList.remove(...TABLE_BASE_CLASSES, ...TABLE_OCCUPIED_CLASSES);
  if (occupied) {
    table.classList.add(...TABLE_OCCUPIED_CLASSES);
    return;
  }
  table.classList.add(...TABLE_BASE_CLASSES);
}

export function syncTableOccupiedState(state, orderKey) {
  const parsed = parseOrderKey(orderKey);
  if (!parsed) return;
  const plan = state.plans[parsed.planKey];
  if (!plan || !plan.grid) return;

  const table = plan.grid.querySelector(`[data-table-id="${parsed.tableId}"]`);
  if (!table) return;
  const items = state.ordersByTable[orderKey] || [];
  const occupied = items.some((item) => !item.deleted && Number(item.qty || 0) > 0);
  setTableOccupiedClass(table, occupied);
}

export function initDraggableGrid(state, gridElement, handlers) {
  if (!gridElement) return;

  for (let i = 1; i <= TABLE_COUNT; i += 1) {
    gridElement.appendChild(buildTableButton(i, handlers));
  }

  gridElement.dataset.customWidth = String(gridElement.clientWidth || 1200);
  const parentWidth = gridElement.parentElement ? gridElement.parentElement.clientWidth : 0;
  if (parentWidth > 0) {
    gridElement.dataset.customWidth = String(parentWidth);
  }

  layoutGridTables(gridElement);
  gridElement.dataset.customHeight = String(gridElement.clientHeight);
  applyGridDimensions(gridElement);
  gridElement.addEventListener("pointerdown", handlers.onGridPointerDown);
  gridElement.addEventListener("contextmenu", handlers.onGridContextMenu);

  const plan = Object.values(state.plans).find((entry) => entry.grid === gridElement);
  if (plan) {
    plan.defaultWidth = parseFloat(gridElement.dataset.customWidth || "0") || gridElement.clientWidth || 1200;
    plan.defaultHeight = parseFloat(gridElement.dataset.customHeight || "0") || gridElement.clientHeight || 0;
  }
}

export function mountMissingPlan(state, handlers) {
  const planKey = getMissingPlanKey(state);
  if (!planKey || !state.plansColumn) return;

  const meta = PLAN_META[planKey];
  const card = createPlanCardElement(planKey);
  const secondaryCard = state.plans.secondary.card;

  if (planKey === "primary" && secondaryCard && secondaryCard.isConnected) {
    state.plansColumn.insertBefore(card, secondaryCard);
  } else {
    state.plansColumn.appendChild(card);
  }

  const grid = card.querySelector(`#${meta.gridId}`);
  state.plans[planKey].card = card;
  state.plans[planKey].grid = grid;
  state.plans[planKey].locked = true;

  initDraggableGrid(state, grid, handlers);
}

export function initPlanGrids(state, handlers) {
  Object.values(state.plans).forEach((plan) => initDraggableGrid(state, plan.grid, handlers));

  window.addEventListener("resize", () => {
    getActivePlanEntries(state).forEach((plan) => {
      if (!plan.grid.dataset.customWidth) {
        plan.grid.dataset.customWidth = String(plan.grid.clientWidth || 1200);
      }
      applyGridDimensions(plan.grid);
    });
    syncStaticAsideHeight(state, true);
  });

  Object.keys(state.plans).forEach((planKey) => {
    state.plans[planKey].locked = true;
    updatePlanLockUI(state, planKey);
  });
}
