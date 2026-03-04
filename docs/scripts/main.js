//Menu hamburguesa
const hamburger = document.getElementById("hamburger");
const navMenu = document.getElementById("nav-menu");
const overlay = document.getElementById("overlay");
const bars = hamburger.querySelectorAll("span");

function setOpenState(isOpen) {
  navMenu.classList.toggle("translate-x-full", !isOpen);
  overlay.classList.toggle("hidden", !isOpen);
  document.body.classList.toggle("overflow-hidden", isOpen);

  bars[0].classList.toggle("translate-y-[10px]", isOpen);
  bars[0].classList.toggle("rotate-45", isOpen);
  bars[1].classList.toggle("opacity-0", isOpen);
  bars[2].classList.toggle("-translate-y-[10px]", isOpen);
  bars[2].classList.toggle("-rotate-45", isOpen);
}

function toggleMenu() {
  const isOpen = navMenu.classList.contains("translate-x-full");
  setOpenState(isOpen);
}

hamburger.addEventListener("click", toggleMenu);
overlay.addEventListener("click", () => setOpenState(false));
//Fin de menu hamburguesa
