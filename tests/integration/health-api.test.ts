import { describe, it, expect, vi, beforeEach } from "vitest";
import pkg from "@/package.json";

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

import { createAdminClient } from "@/lib/supabase/admin";
import { GET } from "@/app/api/health/route";

describe("Health Check API (/api/health)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 200 with status ok and database connected when Supabase is reachable", async () => {
    const mockSelect = vi.fn().mockReturnValue({
      limit: vi.fn().mockResolvedValue({ data: [{ id: "cat-1" }], error: null }),
    });
    const mockFrom = vi.fn().mockReturnValue({
      select: mockSelect,
    });
    vi.mocked(createAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const request = new Request("http://localhost:3000/api/health");
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.status).toBe("ok");
    expect(data.database).toBe("connected");
    expect(data.version).toBe(pkg.version);
    expect(typeof data.timestamp).toBe("string");
    expect(new Date(data.timestamp).toISOString()).toBe(data.timestamp);
    expect(mockFrom).toHaveBeenCalledWith("categories");
  });

  it("should return database degraded when Supabase query returns an error", async () => {
    const mockSelect = vi.fn().mockReturnValue({
      limit: vi.fn().mockResolvedValue({ data: null, error: { message: "Database connection timeout" } }),
    });
    const mockFrom = vi.fn().mockReturnValue({
      select: mockSelect,
    });
    vi.mocked(createAdminClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const request = new Request("http://localhost:3000/api/health");
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.status).toBe("ok");
    expect(data.database).toBe("degraded");
    expect(data.version).toBe(pkg.version);
    expect(typeof data.timestamp).toBe("string");
  });

  it("should return database degraded when createAdminClient throws (e.g. missing credentials)", async () => {
    vi.mocked(createAdminClient).mockImplementation(() => {
      throw new Error("Missing Supabase URL or Key environment variables.");
    });

    const request = new Request("http://localhost:3000/api/health");
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.status).toBe("ok");
    expect(data.database).toBe("degraded");
    expect(data.version).toBe(pkg.version);
    expect(typeof data.timestamp).toBe("string");
  });

  it("should accept invocation without explicit Request parameter", async () => {
    const mockSelect = vi.fn().mockReturnValue({
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    });
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn().mockReturnValue({ select: mockSelect }),
    } as any);

    const response = await GET();
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.status).toBe("ok");
    expect(data.database).toBe("connected");
  });
});
