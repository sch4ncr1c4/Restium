import { openModal, closeModal } from "./modalCore.js";

export function setCashModal(state, open) {
  if (open) {
    openModal(state, state.cashModal, {
      panel: state.cashModalPanel,
      title: state.cashModalPanel.querySelector("h2"),
    });
    document.body.classList.add("overflow-hidden");
    return;
  }
  closeModal(state, state.cashModal, { panel: state.cashModalPanel });
  document.body.classList.remove("overflow-hidden");
}

export function initCashModal(state) {
  state.cashModal.__onClose = () => {
    document.body.classList.remove("overflow-hidden");
  };

  state.openCashModal.addEventListener("click", () => setCashModal(state, true));
  state.closeCashModal.addEventListener("click", () => setCashModal(state, false));
  state.cashModal.addEventListener("click", (event) => {
    if (event.target === state.cashModal) {
      setCashModal(state, false);
    }
  });
}
