export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function normalizePosition(value, min, max) {
  if (max <= min) return 0;
  return (value - min) / (max - min);
}

export function denormalizePosition(ratio, min, max) {
  if (max <= min) return min;
  return min + ratio * (max - min);
}
