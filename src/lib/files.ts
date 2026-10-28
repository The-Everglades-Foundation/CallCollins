import { strFromU8, unzipSync } from "fflate";
import { extractText, getDocumentProxy } from "unpdf";

const MAX_BYTES = 6_000_000;
const TEXT_CAP = 80_000;

export class FileReadError extends Error {}

export async function readUpload(file: File): Promise<{ name: string; text: string }> {
  if (file.size > MAX_BYTES) {
    throw new FileReadError("That file is larger than 6 MB.");
  }
  const name = (file.name || "notes").replace(/[\r\n]/g, " ").slice(0, 180);
  const lower = name.toLowerCase();
  const bytes = new Uint8Array(await file.arrayBuffer());
  let text = "";
  if (lower.endsWith(".docx")) text = docxToText(bytes);
  else if (lower.endsWith(".pdf")) text = await pdfToText(bytes);
  else if (lower.endsWith(".doc")) {
    throw new FileReadError("Save the Word file as DOCX or PDF, then upload it again.");
  } else text = new TextDecoder().decode(bytes);
  text = text.replace(/\u0000/g, "").replace(/\r\n/g, "\n").trim();
  if (!text) throw new FileReadError("That file has no readable text.");
  if (text.length > TEXT_CAP) text = text.slice(0, TEXT_CAP);
  return { name, text };
}

export function docxToText(bytes: Uint8Array): string {
  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(bytes);
  } catch {
    throw new FileReadError("That DOCX file could not be opened.");
  }
  const xml = files["word/document.xml"];
  if (!xml) throw new FileReadError("That DOCX file has no document text.");
  return strFromU8(xml)
    .replace(/<w:p[^>]*>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

async function pdfToText(bytes: Uint8Array): Promise<string> {
  try {
    const pdf = await getDocumentProxy(bytes);
    const extracted = await extractText(pdf, { mergePages: true });
    return extracted.text;
  } catch {
    throw new FileReadError("That PDF has no readable text. Paste the notes instead.");
  }
}
