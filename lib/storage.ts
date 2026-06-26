import type { SavedVersion } from "./types";

const MAX_TITLE_WORDS = 12;
const MAX_TITLE_CHARS = 80;

export function formatDisplayTitle(title: string): string {
  const trimmed = title.trim();
  if (!trimmed) return "Untitled";

  const words = trimmed.split(/\s+/);
  if (words.length > MAX_TITLE_WORDS) {
    return `${words.slice(0, MAX_TITLE_WORDS).join(" ")}…`;
  }
  if (trimmed.length > MAX_TITLE_CHARS) {
    return `${trimmed.slice(0, MAX_TITLE_CHARS).trimEnd()}…`;
  }
  return trimmed;
}

function deriveTitle(content: string, title?: string): string {
  const explicit = title?.trim();
  if (explicit) return formatDisplayTitle(explicit);

  const firstLine = content.trim().split("\n")[0]?.trim();
  if (firstLine) return formatDisplayTitle(firstLine);

  return `Version ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

export function createVersion(content: string, title?: string): SavedVersion {
  return {
    id: crypto.randomUUID(),
    title: deriveTitle(content, title),
    content,
    createdAt: new Date().toISOString(),
    author: "You",
  };
}

export function formatVersionDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const time = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  if (isToday) return `Today, ${time}`;
  if (isYesterday) return `Yesterday, ${time}`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatVersionMeta(version: SavedVersion): string {
  return `${formatVersionDate(version.createdAt)} by ${version.author}`;
}
