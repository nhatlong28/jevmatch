import { describe, expect, it } from "vitest";

import { MAX_RESUME_SIZE, ResumeError, processResume } from "./resumes";

function file(name: string, type: string, bytes: number[]) {
  return new File([new Uint8Array(bytes)], name, { type });
}

describe("processResume", () => {
  it.each([
    ["a non-PDF MIME type", file("resume.txt", "text/plain", [0x25, 0x50])],
    ["a mismatched PDF signature", file("resume.pdf", "application/pdf", [1, 2, 3])],
    ["an empty file", file("resume.pdf", "application/pdf", [])],
  ])("rejects %s", async (_label, fixture) => {
    await expect(processResume(fixture)).rejects.toBeInstanceOf(ResumeError);
  });

  it("rejects a PDF larger than 10 MB before parsing", async () => {
    const oversized = new File(
      [new Uint8Array(MAX_RESUME_SIZE + 1)],
      "resume.pdf",
      { type: "application/pdf" },
    );

    await expect(processResume(oversized)).rejects.toThrow("10 MB");
  });
});
