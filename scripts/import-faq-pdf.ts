import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pdf from "pdf-parse/lib/pdf-parse.js";
import { getPinnedDocument } from "../lib/documents";
import { parseDocumentText, toFaqEntries } from "../lib/faq-parse";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const args = process.argv.slice(2);
function getArg(name: string): string | undefined {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

const docId = getArg("--id") ?? "helix-faq";
const meta = getPinnedDocument(docId);
const pdfFile =
  getArg("--pdf") ??
  (docId === "helix-howto"
    ? "HELIX app How-to Guide-1.pdf"
    : "Helix App Frequently Asked Questions.pdf");
const docTitle = getArg("--title") ?? meta?.title ?? "Document";
const outFile = getArg("--out") ?? `data/${docId}-seed.json`;
const format =
  getArg("--format") === "howto" || getArg("--format") === "faq"
    ? (getArg("--format") as "faq" | "howto")
    : meta?.parseFormat ?? "faq";

const pdfPath = path.join(root, pdfFile);
const outPath = path.join(root, outFile);
const publicPdfPath = path.join(root, "public", path.basename(pdfFile));

const buffer = fs.readFileSync(pdfPath);

async function main() {
  const { text } = await pdf(buffer);
  const entries = toFaqEntries(parseDocumentText(text, format));

  if (entries.length === 0) {
    console.error("No entries parsed. Raw text preview:\n", text.slice(0, 2000));
    process.exit(1);
  }

  const doc = {
    id: docId,
    title: docTitle,
    entries,
    updatedAt: new Date().toISOString(),
  };

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(doc, null, 2));
  fs.mkdirSync(path.dirname(publicPdfPath), { recursive: true });
  fs.copyFileSync(pdfPath, publicPdfPath);

  console.log(`Wrote ${entries.length} entries to ${outPath}`);
  console.log(`Copied PDF to ${publicPdfPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
