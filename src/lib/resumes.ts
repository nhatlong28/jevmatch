import { PDFParse } from "pdf-parse";

export const MAX_RESUME_SIZE = 10 * 1024 * 1024;

const pdfSignature = [0x25, 0x50, 0x44, 0x46, 0x2d];

export class ResumeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ResumeError";
  }
}

function fail(message: string): never {
  throw new ResumeError(message);
}

function hasPdfSignature(data: Uint8Array) {
  return pdfSignature.every((byte, index) => data[index] === byte);
}

export async function processResume(file: File) {
  if (file.size === 0) fail("Choose a non-empty PDF resume.");
  if (file.size > MAX_RESUME_SIZE) fail("The resume must be 10 MB or smaller.");
  if (file.type !== "application/pdf") fail("Upload a PDF resume.");

  const data = new Uint8Array(await file.arrayBuffer());
  if (!hasPdfSignature(data)) {
    fail("The file contents do not match its declared type.");
  }

  const parser = new PDFParse({ data });
  try {
    const text = (await parser.getText()).text;
    if (!text.trim()) fail("The resume must contain text.");
    return { file, text };
  } catch (error) {
    if (error instanceof ResumeError) throw error;
    throw new ResumeError("We could not extract text from this PDF. Try another file.");
  } finally {
    await parser.destroy();
  }
}
