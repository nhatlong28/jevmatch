import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentRecruiter: vi.fn(),
  ownedApplication: vi.fn(),
  createSignedUrl: vi.fn(),
  createAdminClient: vi.fn(),
  createClient: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/recruiter", () => ({
  getCurrentRecruiter: mocks.getCurrentRecruiter,
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: mocks.createAdminClient,
}));

import { GET } from "./route";

function configureDatabaseResult(data: unknown) {
  mocks.createClient.mockResolvedValue({
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: mocks.ownedApplication }),
      }),
    }),
  });
  mocks.ownedApplication.mockResolvedValue({ data, error: null });
}

describe("resume signed URL boundary", () => {
  it("rejects anonymous access before reading application data", async () => {
    mocks.getCurrentRecruiter.mockResolvedValue(null);

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ applicationId: "application-1" }),
    });

    expect(response.status).toBe(401);
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("does not create a signed URL for an application hidden by ownership RLS", async () => {
    mocks.getCurrentRecruiter.mockResolvedValue({ id: "recruiter-a" });
    configureDatabaseResult(null);

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ applicationId: "application-from-recruiter-b" }),
    });

    expect(response.status).toBe(404);
    expect(mocks.createAdminClient).not.toHaveBeenCalled();
  });

  it("creates a temporary URL only after the authenticated query returns the file", async () => {
    mocks.getCurrentRecruiter.mockResolvedValue({ id: "recruiter-a" });
    configureDatabaseResult({ resume_file_path: "resume-1.pdf" });
    mocks.createSignedUrl.mockResolvedValue({
      data: { signedUrl: "https://storage.example/signed-resume" },
      error: null,
    });
    mocks.createAdminClient.mockReturnValue({
      storage: {
        from: () => ({ createSignedUrl: mocks.createSignedUrl }),
      },
    });

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ applicationId: "application-1" }),
    });

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://storage.example/signed-resume");
    expect(mocks.createSignedUrl).toHaveBeenCalledWith("resume-1.pdf", 300);
  });
});
