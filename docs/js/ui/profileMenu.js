export function initProfileMenu(state) {
  if (!state.profileButton || !state.profileMenu) return;

  state.profileButton.addEventListener("click", () => {
    const isHidden = state.profileMenu.classList.contains("hidden");
    state.profileMenu.classList.toggle("hidden", !isHidden);
    state.profileButton.setAttribute("aria-expanded", String(isHidden));
  });

  document.addEventListener("click", (event) => {
    if (!state.profileMenu.contains(event.target) && !state.profileButton.contains(event.target)) {
      state.profileMenu.classList.add("hidden");
      state.profileButton.setAttribute("aria-expanded", "false");
    }
  });
}
