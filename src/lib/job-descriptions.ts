import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

export const MAX_JOB_DESCRIPTION_SIZE = 10 * 1024 * 1024;

type SupportedJobDescription = {
  kind: "pdf" | "docx" | "txt";
  mimeType: string;
};

const supportedTypes: Record<string, SupportedJobDescription> = {
  "application/pdf": { kind: "pdf", mimeType: "application/pdf" },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
    kind: "docx",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  },
  "text/plain": { kind: "txt", mimeType: "text/plain" },
};

export type JobDescriptionInput =
  | { kind: "pasted"; text: string }
  | { kind: "file"; file: File };

export type ProcessedJobDescription = {
  text: string;
  file?: File;
  mimeType?: string;
};

type Extractors = {
  docx: (buffer: Buffer) => Promise<string>;
  pdf: (data: Uint8Array) => Promise<string>;
};

const extractors: Extractors = {
  async docx(buffer) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  },
  async pdf(data) {
    const parser = new PDFParse({ data });
    try {
      return (await parser.getText()).text;
    } finally {
      await parser.destroy();
    }
  },
};

function fail(message: string): never {
  throw new JobDescriptionError(message);
}

function hasPrefix(data: Uint8Array, prefix: number[]) {
  return prefix.every((byte, index) => data[index] === byte);
}

function requireSupportedFile(file: File, data: Uint8Array) {
  const type = supportedTypes[file.type];
  if (!type) {
    fail("Upload a PDF, DOCX, or UTF-8 TXT file.");
  }

  const signatureIsValid =
    (type.kind === "pdf" && hasPrefix(data, [0x25, 0x50, 0x44, 0x46, 0x2d])) ||
    (type.kind === "docx" && hasPrefix(data, [0x50, 0x4b, 0x03, 0x04])) ||
    (type.kind === "txt" && isUtf8(data));

  if (!signatureIsValid) {
    fail("The file contents do not match its declared type.");
  }

  return type;
}

function isUtf8(data: Uint8Array) {
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(data);
    return true;
  } catch {
    return false;
  }
}

function requireText(text: string) {
  if (!text.trim()) {
    fail("The job description must contain text.");
  }

  return text;
}

export class JobDescriptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JobDescriptionError";
  }
}

export async function processJobDescription(
  input: JobDescriptionInput,
  overrides: Partial<Extractors> = {},
): Promise<ProcessedJobDescription> {
  if (input.kind === "pasted") {
    const bytes = new TextEncoder().encode(input.text);
    if (bytes.byteLength > MAX_JOB_DESCRIPTION_SIZE) {
      fail("The job description must be 10 MB or smaller.");
    }

    return { text: requireText(input.text) };
  }

  if (input.file.size === 0) {
    fail("Choose a non-empty job description file.");
  }
  if (input.file.size > MAX_JOB_DESCRIPTION_SIZE) {
    fail("The job description file must be 10 MB or smaller.");
  }

  const data = new Uint8Array(await input.file.arrayBuffer());
  const type = requireSupportedFile(input.file, data);
  const extract = { ...extractors, ...overrides };

  try {
    const text =
      type.kind === "txt"
        ? new TextDecoder("utf-8", { fatal: true }).decode(data)
        : type.kind === "pdf"
          ? await extract.pdf(data)
          : await extract.docx(Buffer.from(data));

    return { file: input.file, mimeType: type.mimeType, text: requireText(text) };
  } catch (error) {
    if (error instanceof JobDescriptionError) {
      throw error;
    }
    throw new JobDescriptionError("We could not extract text from this file. Try another file.");
  }
}
