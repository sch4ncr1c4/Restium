import { openModal, closeModal } from "./modalCore.js";
import { money } from "../utils/format.js";
import { renderOrderModal } from "../orders/ordersRender.js";

export function initAdjustModal(state) {
  const adjustModal = document.createElement("div");
  adjustModal.id = "adjustModal";
  adjustModal.className =
    "fixed inset-0 z-[84] hidden items-center justify-center bg-zinc-900/50 px-4 opacity-0 transition-opacity duration-200";
  adjustModal.innerHTML = `
    <div id="adjustModalPanel" class="w-full max-w-sm translate-y-2 scale-95 rounded-2xl border border-zinc-200 bg-white p-5 opacity-0 shadow-2xl transition-all duration-200">
      <h3 class="text-base font-semibold text-zinc-900">Aplicar ajuste</h3>
      <label class="mt-3 block">
        <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500">Tipo</span>
        <select id="adjustType" class="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm">
          <option value="discount">Descuento</option>
          <option value="deposit">Sena</option>
        </select>
      </label>
      <label class="mt-3 block">
        <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500">Monto</span>
        <input id="adjustAmount" type="number" min="0" class="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" placeholder="Ej: 1800" />
      </label>
      <div class="mt-3 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2">
        <p class="text-xs text-zinc-500">Descuento actual de la mesa</p>
        <p id="currentDiscountText" class="text-sm font-semibold text-zinc-800">$0</p>
      </div>
      <p id="adjustError" class="mt-2 hidden text-sm font-medium text-rose-600"></p>
      <div class="mt-4 flex items-center justify-between gap-2">
        <button id="removeDiscountButton" type="button" class="rounded-md bg-rose-100 px-3 py-1.5 text-sm font-semibold text-rose-700">Quitar descuento</button>
        <div class="flex gap-2">
          <button id="cancelAdjustButton" type="button" class="rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-semibold text-zinc-700">Cancelar</button>
          <button id="applyAdjustButton" type="button" class="rounded-md bg-emeraldbrand px-3 py-1.5 text-sm font-semibold text-white">Aplicar</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(adjustModal);
  state.adjustModal = adjustModal;

  adjustModal.addEventListener("click", (event) => {
    if (event.target === adjustModal) setAdjustModal(state, false);
  });
}

export function setAdjustModal(state, open) {
  const adjustError = document.getElementById("adjustError");
  const adjustPanel = document.getElementById("adjustModalPanel");
  const adjustTitle = adjustPanel.querySelector("h3");
  if (open) {
    adjustError.textContent = "";
    adjustError.classList.add("hidden");
    const currentMeta = state.metaByTable[state.currentOrderKey] || { discountAmount: 0 };
    document.getElementById("currentDiscountText").textContent = money.format(currentMeta.discountAmount || 0);
    openModal(state, state.adjustModal, { panel: adjustPanel, title: adjustTitle });
    return;
  }
  closeModal(state, state.adjustModal, { panel: adjustPanel });
}

export function applyAdjust(state) {
  if (!state.currentOrderKey) return;

  const type = document.getElementById("adjustType").value;
  const amount = parseInt(document.getElementById("adjustAmount").value || "", 10);
  const adjustError = document.getElementById("adjustError");
  const items = state.ordersByTable[state.currentOrderKey] || [];
  const activeItems = items.filter((item) => !item.deleted);
  const meta = state.metaByTable[state.currentOrderKey];

  adjustError.textContent = "";
  adjustError.classList.add("hidden");

  if (!Number.isInteger(amount) || amount < 0) {
    adjustError.textContent = "Monto invalido.";
    adjustError.classList.remove("hidden");
    return;
  }

  if (type === "discount") {
    if (activeItems.length === 0) {
      adjustError.textContent = "No podes aplicar descuento sin articulos.";
      adjustError.classList.remove("hidden");
      return;
    }
    if ((meta.discountAmount || 0) > 0) {
      adjustError.textContent = "Primero quita el descuento actual.";
      adjustError.classList.remove("hidden");
      return;
    }
    meta.discountAmount = amount;
  } else {
    meta.depositAmount = amount;
  }

  setAdjustModal(state, false);
  renderOrderModal(state);
}
