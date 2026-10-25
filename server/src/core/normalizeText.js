// 001/RF-3.1
export function normalizeText(text) {
  if (typeof text !== "string") return "";
  return text.trim().replace(/\s+/g, " ");
}
