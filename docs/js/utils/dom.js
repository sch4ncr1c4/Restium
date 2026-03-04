export function qs(selector, root = document) {
  return root.querySelector(selector);
}

export function qsa(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

export function create(tag, className = "") {
  const el = document.createElement(tag);
  if (className) el.className = className;
  return el;
}
