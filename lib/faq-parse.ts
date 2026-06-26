import type { FaqEntry } from "./types";
import {
  createStep,
  createTip,
  serializeHowToContent,
  type HowToContent,
} from "./howto-content";

export interface ParsedFaqEntry {
  question: string;
  answer: string;
}

function isQuestionLine(line: string): boolean {
  if (/^Helix App Frequently Asked Questions$/i.test(line)) return false;
  if (/^Page \d+ of \d+$/i.test(line)) return false;
  if (/^\d+$/.test(line)) return false;
  if (line.endsWith("?")) return true;
  if (/^(Q\d+[:.]?\s|Question\s+\d+)/i.test(line)) return true;
  if (/^[A-Z][^.!?]{0,120}\?$/.test(line)) return true;
  return false;
}

export function parseFaqText(text: string): ParsedFaqEntry[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const entries: ParsedFaqEntry[] = [];
  let currentQuestion: string | null = null;
  let currentAnswer: string[] = [];

  const flush = () => {
    if (!currentQuestion) return;
    entries.push({
      question: currentQuestion,
      answer: currentAnswer.join("\n\n").trim(),
    });
    currentQuestion = null;
    currentAnswer = [];
  };

  for (const line of lines) {
    if (isQuestionLine(line)) {
      flush();
      currentQuestion = line.replace(/^Q\d+[:.]?\s*/i, "").trim();
      continue;
    }

    if (currentQuestion) {
      currentAnswer.push(line);
    }
  }

  flush();
  return entries;
}

export function toFaqEntries(parsed: ParsedFaqEntry[]): FaqEntry[] {
  const now = new Date().toISOString();
  return parsed.map((entry) => ({
    id: crypto.randomUUID(),
    question: entry.question,
    answer: entry.answer,
    updatedAt: now,
  }));
}

const HOWTO_BODY_MARKER = "step-by-step walkthrough";
const HOWTO_FOOTER = /^Helix Health Technologies 2026\s*$/i;
const HOWTO_CATEGORY =
  /^(Getting Started|Messaging|Calls|Roles|Explore|Patient Management|Broadcasts(?:\s*&\s*Critical Alerts)?|Notifications(?:\s*&\s*Reminders)?|Escalation|Settings\s*&\s*Security|Troubleshooting)\s*$/i;
const TIP_SPLIT = /\s*(?:\uF4A1|💡|Tip:)\s*/i;
const TOC_ENTRY = /^(\d{1,2})\.\s+(.+?)\.{2,}/;

function extractMainSections(text: string): Map<number, string> {
  const sections = new Map<number, string>();
  const tocEnd = text.indexOf(HOWTO_BODY_MARKER);
  const tocText = tocEnd >= 0 ? text.slice(0, tocEnd) : text;

  for (const line of tocText.split(/\r?\n/)) {
    const match = line.trim().match(TOC_ENTRY);
    if (!match) continue;
    const num = Number(match[1]);
    const title = match[2].trim();
    if (!sections.has(num)) sections.set(num, title);
  }

  return sections;
}

function isMainSectionLine(
  num: number,
  rest: string,
  mainSections: Map<number, string>,
): boolean {
  const expectedTitle = mainSections.get(num);
  if (!expectedTitle) return false;

  const normalizedRest = rest.replace(/\s+/g, " ").trim().toLowerCase();
  const normalizedExpected = expectedTitle.replace(/\s+/g, " ").trim().toLowerCase();

  if (normalizedRest === normalizedExpected) return true;
  if (normalizedRest.startsWith(normalizedExpected.slice(0, 24))) return true;
  if (normalizedExpected.startsWith(normalizedRest.slice(0, 24))) return true;

  return false;
}

function appendTip(content: HowToContent, text: string) {
  const trimmed = text.trim();
  if (trimmed) content.tips.push(createTip(trimmed));
}

function appendStep(content: HowToContent, text: string) {
  const trimmed = text.trim();
  if (trimmed) content.steps.push(createStep(trimmed));
}

function processContentLine(content: HowToContent, line: string) {
  if (TIP_SPLIT.test(line)) {
    const parts = line.split(TIP_SPLIT);
    const stepPart = parts[0].trim();
    if (stepPart) {
      const numbered = stepPart.match(/^(\d{1,2})\.\s+(.+)$/);
      if (numbered) appendStep(content, numbered[2]);
      else appendStep(content, stepPart);
    }
    for (let i = 1; i < parts.length; i++) {
      appendTip(content, parts[i]);
    }
    return;
  }

  if (/^(?:\uF4A1|💡|Tip:)/i.test(line)) {
    appendTip(content, line.replace(/^(?:\uF4A1|💡|Tip:)\s*/i, ""));
    return;
  }

  const numbered = line.match(/^(\d{1,2})\.\s+(.+)$/);
  if (numbered) {
    appendStep(content, numbered[2]);
    return;
  }

  if (content.steps.length > 0) {
    const last = content.steps[content.steps.length - 1];
    last.text = `${last.text} ${line}`.trim();
  } else if (content.tips.length > 0) {
    const last = content.tips[content.tips.length - 1];
    last.text = `${last.text} ${line}`.trim();
  }
}

export function parseHowToText(text: string): ParsedFaqEntry[] {
  const startIdx = text.indexOf(HOWTO_BODY_MARKER);
  if (startIdx === -1) return [];

  const mainSections = extractMainSections(text);
  const lines = text
    .slice(startIdx)
    .split(/\r?\n/)
    .map((line) => line.trim());

  const entries: ParsedFaqEntry[] = [];
  let currentQuestion: string | null = null;
  let currentContent = emptyHowToContent();
  let pendingLine = "";

  const emptyContent = (): HowToContent => ({ steps: [], tips: [] });

  const pushPending = () => {
    if (pendingLine) {
      processContentLine(currentContent, pendingLine);
      pendingLine = "";
    }
  };

  const flushEntry = () => {
    if (!currentQuestion) {
      pendingLine = "";
      currentContent = emptyContent();
      return;
    }
    pushPending();
    entries.push({
      question: currentQuestion,
      answer: serializeHowToContent(currentContent),
    });
    currentQuestion = null;
    currentContent = emptyContent();
  };

  for (const line of lines) {
    if (!line || HOWTO_FOOTER.test(line) || /^Page \d+ of \d+$/i.test(line)) {
      continue;
    }

    if (HOWTO_CATEGORY.test(line)) {
      pushPending();
      continue;
    }

    const numbered = line.match(/^(\d{1,2})\.\s+(.+)$/);
    if (numbered) {
      const num = Number(numbered[1]);
      const rest = numbered[2].trim();
      if (isMainSectionLine(num, rest, mainSections)) {
        flushEntry();
        currentQuestion = `${num}. ${mainSections.get(num) ?? rest}`;
        continue;
      }

      pushPending();
      processContentLine(currentContent, line);
      continue;
    }

    pendingLine = pendingLine ? `${pendingLine} ${line}` : line;
  }

  flushEntry();
  return entries;
}

function emptyHowToContent(): HowToContent {
  return { steps: [], tips: [] };
}

export function parseDocumentText(
  text: string,
  format: "faq" | "howto" = "faq",
): ParsedFaqEntry[] {
  return format === "howto" ? parseHowToText(text) : parseFaqText(text);
}
