export interface HowToStep {
  id: string;
  text: string;
}

export interface HowToTip {
  id: string;
  text: string;
}

export interface HowToContent {
  steps: HowToStep[];
  tips: HowToTip[];
}

export function emptyHowToContent(): HowToContent {
  return { steps: [], tips: [] };
}

function normalizeStep(step: unknown): HowToStep {
  if (step && typeof step === "object") {
    const record = step as Record<string, unknown>;
    return {
      id: typeof record.id === "string" ? record.id : crypto.randomUUID(),
      text: typeof record.text === "string" ? record.text : "",
    };
  }
  return createStep(typeof step === "string" ? step : "");
}

function normalizeTip(tip: unknown): HowToTip {
  if (tip && typeof tip === "object") {
    const record = tip as Record<string, unknown>;
    return {
      id: typeof record.id === "string" ? record.id : crypto.randomUUID(),
      text: typeof record.text === "string" ? record.text : "",
    };
  }
  return createTip(typeof tip === "string" ? tip : "");
}

export function isHowToContent(value: unknown): value is HowToContent {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return Array.isArray(record.steps) && Array.isArray(record.tips);
}

/** Coerce API/editor answer values to a JSON string or plain text. */
export function coerceHowToAnswerString(answer: unknown): string {
  if (answer == null) return "";
  if (typeof answer === "string") return answer;
  if (isHowToContent(answer)) return JSON.stringify(answer);
  return String(answer);
}

export function hasAnswerText(answer: unknown): boolean {
  return coerceHowToAnswerString(answer).trim().length > 0;
}

export function createStep(text = ""): HowToStep {
  return { id: crypto.randomUUID(), text };
}

export function createTip(text = ""): HowToTip {
  return { id: crypto.randomUUID(), text };
}

export function isStructuredHowToAnswer(answer: unknown): boolean {
  if (isHowToContent(answer)) return true;
  const text = coerceHowToAnswerString(answer);
  if (!text.trim().startsWith("{")) return false;
  try {
    const parsed = JSON.parse(text) as HowToContent;
    return Array.isArray(parsed.steps) && Array.isArray(parsed.tips);
  } catch {
    return false;
  }
}

export function parseHowToAnswer(answer: unknown): HowToContent {
  if (isHowToContent(answer)) {
    return {
      steps: answer.steps.map(normalizeStep),
      tips: answer.tips.map(normalizeTip),
    };
  }

  const text = coerceHowToAnswerString(answer);
  if (!text.trim()) return emptyHowToContent();
  if (isStructuredHowToAnswer(text)) {
    const parsed = JSON.parse(text) as HowToContent;
    return {
      steps: parsed.steps.map(normalizeStep),
      tips: parsed.tips.map(normalizeTip),
    };
  }
  return parsePlainTextToHowToContent(text);
}

export function serializeHowToContent(content: HowToContent): string {
  return JSON.stringify(content);
}

export function howToContentToPlainText(content: HowToContent): string {
  const parts: string[] = [];
  content.steps.forEach((step, index) => {
    if (step.text.trim()) parts.push(`${index + 1}. ${step.text.trim()}`);
  });
  content.tips.forEach((tip) => {
    if (tip.text.trim()) parts.push(`Tip: ${tip.text.trim()}`);
  });
  return parts.join("\n");
}

const TIP_SPLIT = /\s*(?:\uF4A1|💡|Tip:)\s*/i;

function stripTipPrefix(text: string): string {
  return text.replace(/^(?:\uF4A1|💡|Tip:)\s*/i, "").trim();
}

function isTipLine(line: string): boolean {
  return /^(?:\uF4A1|💡|Tip:)/i.test(line.trim());
}

export function parsePlainTextToHowToContent(text: string): HowToContent {
  const content = emptyHowToContent();
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

  for (const line of lines) {
    if (isTipLine(line)) {
      content.tips.push(createTip(stripTipPrefix(line)));
      continue;
    }

    const tipParts = line.split(TIP_SPLIT);
    if (tipParts.length > 1) {
      const stepPart = tipParts[0].trim();
      const numbered = stepPart.match(/^(\d{1,2})\.\s+(.+)$/);
      if (numbered) {
        content.steps.push(createStep(numbered[2].trim()));
      } else if (stepPart) {
        content.steps.push(createStep(stepPart));
      }
      for (let i = 1; i < tipParts.length; i++) {
        const tipText = tipParts[i].trim();
        if (tipText) content.tips.push(createTip(tipText));
      }
      continue;
    }

    const numbered = line.match(/^(\d{1,2})\.\s+(.+)$/);
    if (numbered) {
      content.steps.push(createStep(numbered[2].trim()));
      continue;
    }

    if (content.steps.length > 0) {
      const last = content.steps[content.steps.length - 1];
      last.text = `${last.text} ${line}`.trim();
    } else if (content.tips.length > 0) {
      const last = content.tips[content.tips.length - 1];
      last.text = `${last.text} ${line}`.trim();
    } else {
      content.steps.push(createStep(line));
    }
  }

  return content;
}

export function hasHowToContent(content: HowToContent): boolean {
  return content.steps.some((step) => step.text.trim()) ||
    content.tips.some((tip) => tip.text.trim());
}
