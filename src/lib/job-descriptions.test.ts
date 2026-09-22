import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import {
  JobDescriptionError,
  MAX_JOB_DESCRIPTION_SIZE,
  processJobDescription,
} from "./job-descriptions";

function file(name: string, type: string, bytes: number[]) {
  return new File([new Uint8Array(bytes)], name, { type });
}

describe("processJobDescription", () => {
  it("accepts the uploaded TXT job-description fixture", async () => {
    const bytes = await readFile(
      join(process.cwd(), "src/lib/fixtures/job-descriptions/frontend-engineer.txt"),
    );
    const result = await processJobDescription({
      kind: "file",
      file: new File([bytes], "frontend-engineer.txt", { type: "text/plain" }),
    });

    expect(result.text).toContain("Senior Frontend Engineer");
  });

  it("accepts UTF-8 text, including a BOM", async () => {
    const result = await processJobDescription({
      kind: "file",
      file: file("role.txt", "text/plain", [0xef, 0xbb, 0xbf, 82, 111, 108, 101]),
    });

    expect(result.text).toBe("Role");
  });

  it.each([
    [
      "a PDF fixture",
      file("role.pdf", "application/pdf", [0x25, 0x50, 0x44, 0x46, 0x2d]),
      { pdf: async () => "PDF role" },
    ],
    [
      "a DOCX fixture",
      file("role.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", [0x50, 0x4b, 0x03, 0x04]),
      { docx: async () => "DOCX role" },
    ],
  ])("extracts %s after validation", async (_label, fixture, extractor) => {
    const result = await processJobDescription({ kind: "file", file: fixture }, extractor);

    expect(result.text).toMatch(/role/i);
  });

  it.each([
    ["an unsupported MIME type", file("role.rtf", "application/rtf", [1, 2])],
    ["a mismatched PDF signature", file("role.pdf", "application/pdf", [1, 2, 3])],
    ["invalid UTF-8 text", file("role.txt", "text/plain", [0xc3, 0x28])],
  ])("rejects %s", async (_label, fixture) => {
    await expect(processJobDescription({ kind: "file", file: fixture })).rejects.toBeInstanceOf(
      JobDescriptionError,
    );
  });

  it("rejects text that exceeds 10 MB", async () => {
    await expect(
      processJobDescription({ kind: "pasted", text: "x".repeat(MAX_JOB_DESCRIPTION_SIZE + 1) }),
    ).rejects.toThrow("10 MB");
  });

  it("turns parser failure into a retry-safe error", async () => {
    await expect(
      processJobDescription(
        { kind: "file", file: file("role.pdf", "application/pdf", [0x25, 0x50, 0x44, 0x46, 0x2d]) },
        { pdf: async () => Promise.reject(new Error("broken PDF")) },
      ),
    ).rejects.toThrow("Try another file");
  });
});
