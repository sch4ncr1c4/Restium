export function updateTabStyles(state, view) {
  state.sideTabs.forEach((tab) => {
    const isActive = tab.dataset.view === view;
    tab.className = isActive
      ? "side-tab flex h-12 w-12 items-center justify-center rounded-xl bg-emeraldbrand text-sm font-semibold text-white"
      : "side-tab flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 text-sm font-semibold text-zinc-700 hover:bg-zinc-200";
  });

  state.topTabs.forEach((tab) => {
    const isActive = tab.dataset.view === view;
    tab.className = isActive
      ? "top-tab rounded-lg bg-emeraldbrand px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-600 sm:text-sm"
      : "top-tab rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-zinc-700 sm:text-sm";
  });
}

export function setView(state, view, animate = true) {
  if (!state.panels[view]) return;
  if (view === state.currentView && animate) return;

  if (state.panelSwitchTimer) {
    clearTimeout(state.panelSwitchTimer);
    state.panelSwitchTimer = null;
  }

  const targetPanel = state.panels[view];
  const currentPanel = state.panels[state.currentView];
  updateTabStyles(state, view);

  if (!animate || !currentPanel) {
    Object.entries(state.panels).forEach(([key, panel]) => {
      panel.classList.toggle("hidden", key !== view);
      panel.classList.toggle("opacity-0", key !== view);
      panel.classList.toggle("translate-y-2", key !== view);
      panel.classList.toggle("pointer-events-none", key !== view);
    });
    state.currentView = view;
    return;
  }

  currentPanel.classList.add("opacity-0", "translate-y-2", "pointer-events-none");
  state.panelSwitchTimer = setTimeout(() => {
    currentPanel.classList.add("hidden");

    targetPanel.classList.remove("hidden");
    targetPanel.classList.add("opacity-0", "translate-y-2", "pointer-events-none");
    requestAnimationFrame(() => {
      targetPanel.classList.remove("opacity-0", "translate-y-2", "pointer-events-none");
    });

    state.currentView = view;
    state.panelSwitchTimer = null;
  }, 180);
}

export function initViews(state) {
  Object.values(state.panels).forEach((panel) => {
    panel.classList.add("transition-all", "duration-200");
  });

  document.querySelectorAll("[data-view]").forEach((control) => {
    control.addEventListener("click", () => setView(state, control.dataset.view));
  });

  setView(state, "mesas", false);
}
