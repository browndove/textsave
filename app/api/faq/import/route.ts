import pdf from "pdf-parse/lib/pdf-parse.js";
import mammoth from "mammoth";
import { getPinnedDocument } from "@/lib/documents";
import { parseDocumentText, toFaqEntries } from "@/lib/faq-parse";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 15 * 1024 * 1024;

async function extractText(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();

  if (type === "application/pdf" || name.endsWith(".pdf")) {
    const result = await pdf(buffer);
    return result.text;
  }

  if (
    type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    name.endsWith(".docx")
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  if (type.startsWith("text/") || name.endsWith(".txt") || name.endsWith(".md")) {
    return buffer.toString("utf-8");
  }

  throw new Error("Unsupported file type. Upload a PDF, Word (.docx), or text file.");
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return Response.json({ error: "No file uploaded." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return Response.json(
        { error: "File is too large. Maximum size is 15 MB." },
        { status: 400 },
      );
    }

    const formatParam = formData.get("format");
    const docId = formData.get("documentId");
    const meta = typeof docId === "string" ? getPinnedDocument(docId) : undefined;
    const format =
      formatParam === "howto" || formatParam === "faq"
        ? formatParam
        : meta?.parseFormat ?? "faq";

    const text = await extractText(file);
    const parsed = parseDocumentText(text, format);

    if (parsed.length === 0) {
      return Response.json(
        {
          error:
            format === "howto"
              ? "No topics found. Make sure the document uses numbered sections like \"1. Set Up Your Profile\"."
              : "No questions found. Make sure the document uses lines ending with ? or numbered questions.",
        },
        { status: 422 },
      );
    }

    const entries = toFaqEntries(parsed);

    return Response.json({
      fileName: file.name,
      count: entries.length,
      entries,
      preview: entries.slice(0, 5).map((e) => ({
        question: e.question,
        answer: e.answer.slice(0, 200) + (e.answer.length > 200 ? "…" : ""),
      })),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to import document.";
    return Response.json({ error: message }, { status: 500 });
  }
}
