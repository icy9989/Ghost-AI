const PRESENCE_COLORS = [
  "var(--accent-primary)",
  "var(--accent-ai-text)",
  "var(--state-success)",
  "var(--state-warning)",
  "var(--state-error)",
];

export function getPresenceColor(userId: string): string {
  let hash = 0;
  for (const character of userId) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return PRESENCE_COLORS[hash % PRESENCE_COLORS.length];
}

export function getInitials(name: string): string {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => Array.from(part)[0]).join("").toUpperCase() || "?";
}
