import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractMenuWithGeminiVision } from "@/app/actions/geminiMenuActions";
import { registerWithSupabase } from "@/app/actions/authActions";

// Mock Supabase Server Client for authActions
const mockSignUp = vi.fn();
const mockUpsert = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockImplementation(async () => ({
    auth: {
      signUp: mockSignUp,
    },
    from: mockFrom,
  })),
}));

describe("Security Hardening: Purge Hardcoded Secrets & Lock Registration Role", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.GEMINI_API_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    mockUpsert.mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ upsert: mockUpsert });
    mockSignUp.mockResolvedValue({
      data: { user: { id: "user-test-id" } },
      error: null,
    });
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe("1. Static Code Analysis: No Hardcoded Secrets in Repository Files", () => {
    it("geminiMenuActions.ts does not contain the Base64 key string or fallback keys", () => {
      const filePath = path.resolve(__dirname, "../../app/actions/geminiMenuActions.ts");
      const fileContent = fs.readFileSync(filePath, "utf-8");

      const hardcodedBase64 = "QVEuQWI4Uk42SUJLSHJ2SU5qT3FMX0ExcTRBbHdGd0lQS0lsNDFqaE5VWGlrUWl0UnBtV0E=";
      expect(fileContent).not.toContain(hardcodedBase64);
      expect(fileContent).not.toContain("DEFAULT_KEY_B64");
      expect(fileContent).not.toContain("DEFAULT_GEMINI_API_KEY");
    });

    it("lib/supabase/admin.ts does not contain hardcoded fallback URL or service keys", () => {
      const filePath = path.resolve(__dirname, "../../lib/supabase/admin.ts");
      const fileContent = fs.readFileSync(filePath, "utf-8");

      expect(fileContent).not.toContain("https://pijpptetccvgmwyjvsse.supabase.co");
      expect(fileContent).not.toContain("sb_publishable_");
    });
  });

  describe("2. Runtime Behavior: Missing Environment Variables Handled Securely", () => {
    it("createAdminClient throws descriptive error when Supabase environment variables are missing", () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      expect(() => createAdminClient()).toThrow(/Supabase URL or Key/i);
    });

    it("extractMenuWithGeminiVision returns clean error when GEMINI_API_KEY is missing", async () => {
      delete process.env.GEMINI_API_KEY;

      const result = await extractMenuWithGeminiVision("dummy-base64-image");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Google AI Studio API Key belum terkonfigurasi pada server.");
    });
  });

  describe("3. Role Escalation Prevention: Registration Locked to 'kasir'", () => {
    it("registerWithSupabase ignores client-supplied role 'admin' and forces 'kasir'", async () => {
      const maliciousPayload = {
        email: "attacker@growkas.com",
        password: "password123",
        fullName: "Attacker User",
        role: "admin",
      };

      const result = await registerWithSupabase(maliciousPayload as any);

      expect(result.success).toBe(true);

      // Verify supabase.auth.signUp metadata forced to "kasir"
      expect(mockSignUp).toHaveBeenCalledWith({
        email: "attacker@growkas.com",
        password: "password123",
        options: {
          data: {
            full_name: "Attacker User",
            role: "kasir",
          },
        },
      });

      // Verify public.profiles upsert forced to "kasir"
      expect(mockUpsert).toHaveBeenCalledWith({
        id: "user-test-id",
        email: "attacker@growkas.com",
        full_name: "Attacker User",
        role: "kasir",
      });
    });

    it("registerWithSupabase assigns 'kasir' when role is not provided in input", async () => {
      const normalPayload = {
        email: "staff@growkas.com",
        password: "password123",
        fullName: "Staff User",
      };

      const result = await registerWithSupabase(normalPayload);

      expect(result.success).toBe(true);
      expect(mockSignUp).toHaveBeenCalledWith({
        email: "staff@growkas.com",
        password: "password123",
        options: {
          data: {
            full_name: "Staff User",
            role: "kasir",
          },
        },
      });
      expect(mockUpsert).toHaveBeenCalledWith({
        id: "user-test-id",
        email: "staff@growkas.com",
        full_name: "Staff User",
        role: "kasir",
      });
    });
  });
});
