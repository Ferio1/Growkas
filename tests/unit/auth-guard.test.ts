import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs";
import path from "path";

// Mock NextAuth
const mockAuth = vi.fn();
vi.mock("@/auth", () => ({
  auth: () => mockAuth(),
}));

// Mock Supabase Server Client
const mockGetUser = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockImplementation(async () => ({
    auth: {
      getUser: mockGetUser,
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
      insert: vi.fn().mockResolvedValue({ error: null }),
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    }),
  })),
}));

// Mock Supabase Admin Client
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { id: "trx-test-id" }, error: null }),
        }),
      }),
    }),
  }),
}));

// Mock Next.js cache revalidation
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock storeManager saveMasterStore to prevent mutating persistent json on test runs
vi.mock("@/app/actions/storeManager", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    saveMasterStore: vi.fn(),
    addStoreBranch: vi.fn().mockImplementation((b) => b),
    deleteStoreBranch: vi.fn(),
    resetMasterDatabaseToCleanState: vi.fn().mockReturnValue({}),
  };
});

import { assertAuthenticated, assertRole } from "@/lib/authGuard";
import { addBranch, deleteBranch } from "@/app/actions/branchActions";
import { clearAllTableOrders, deleteTableOrder } from "@/app/actions/orderActions";
import {
  updateIngredientStockManual,
  restockIngredient,
  addNewIngredient,
  resetDatabaseCleanAction,
} from "@/app/actions/ingredientActions";
import { saveTransaction, addProduct } from "@/app/actions/posActions";
import { config as proxyConfig } from "@/proxy";

describe("Task 2: Authentication & Route Protection — Auth Guard & RBAC", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(null);
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
  });

  describe("1. assertAuthenticated()", () => {
    it("throws Unauthorized error when no session is present in NextAuth or Supabase", async () => {
      mockAuth.mockResolvedValue(null);
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

      await expect(assertAuthenticated()).rejects.toThrow("Unauthorized: Authentication required");
    });

    it("rejects when NextAuth session has empty user object with no id, sub, or email", async () => {
      mockAuth.mockResolvedValue({ user: {} });
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

      await expect(assertAuthenticated()).rejects.toThrow("Unauthorized: Authentication required");
    });

    it("returns authenticated user details from NextAuth session", async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: "nextauth-user-123",
          email: "admin@growkas.com",
          role: "admin",
        },
      });

      const user = await assertAuthenticated();
      expect(user).toEqual({
        userId: "nextauth-user-123",
        email: "admin@growkas.com",
        role: "admin",
      });
    });

    it("falls back to Supabase SSR session when NextAuth session is absent", async () => {
      mockAuth.mockResolvedValue(null);
      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: "supabase-user-456",
            email: "kasir@growkas.com",
            user_metadata: { role: "kasir" },
          },
        },
        error: null,
      });

      const user = await assertAuthenticated();
      expect(user).toEqual({
        userId: "supabase-user-456",
        email: "kasir@growkas.com",
        role: "kasir",
      });
    });
  });

  describe("2. assertRole()", () => {
    it("throws Unauthorized error when user is not authenticated", async () => {
      mockAuth.mockResolvedValue(null);
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

      await expect(assertRole(["admin"])).rejects.toThrow("Unauthorized: Authentication required");
    });

    it("throws Forbidden error when user role does not match allowedRoles", async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: "user-kasir-1",
          email: "kasir@growkas.com",
          role: "kasir",
        },
      });

      await expect(assertRole(["admin"])).rejects.toThrow("Forbidden: Insufficient permissions");
    });

    it("succeeds and returns user when user role is in allowedRoles", async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: "user-admin-1",
          email: "admin@growkas.com",
          role: "admin",
        },
      });

      const user = await assertRole(["admin"]);
      expect(user).toEqual({
        userId: "user-admin-1",
        email: "admin@growkas.com",
        role: "admin",
      });
    });

    it("allows access when role matches one of multiple allowed roles", async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: "user-kasir-2",
          email: "kasir@growkas.com",
          role: "kasir",
        },
      });

      const user = await assertRole(["admin", "kasir"]);
      expect(user.role).toBe("kasir");
    });
  });

  describe("3. Server Actions RBAC and Auth Protection", () => {
    it("deleteBranch rejects when user is unauthenticated or not an admin", async () => {
      mockAuth.mockResolvedValue(null);
      await expect(deleteBranch("br-test")).rejects.toThrow("Unauthorized: Authentication required");

      mockAuth.mockResolvedValue({
        user: { id: "u1", email: "k@growkas.com", role: "kasir" },
      });
      await expect(deleteBranch("br-test")).rejects.toThrow("Forbidden: Insufficient permissions");
    });

    it("addBranch rejects when user is unauthenticated or not an admin", async () => {
      mockAuth.mockResolvedValue(null);
      await expect(
        addBranch({ name: "Cabang Baru", city: "Bandung" })
      ).rejects.toThrow("Unauthorized: Authentication required");

      mockAuth.mockResolvedValue({
        user: { id: "u1", email: "k@growkas.com", role: "kasir" },
      });
      await expect(
        addBranch({ name: "Cabang Baru", city: "Bandung" })
      ).rejects.toThrow("Forbidden: Insufficient permissions");
    });

    it("clearAllTableOrders rejects when user is unauthenticated or not an admin", async () => {
      mockAuth.mockResolvedValue(null);
      await expect(clearAllTableOrders()).rejects.toThrow("Unauthorized: Authentication required");

      mockAuth.mockResolvedValue({
        user: { id: "u1", email: "k@growkas.com", role: "kasir" },
      });
      await expect(clearAllTableOrders()).rejects.toThrow("Forbidden: Insufficient permissions");
    });

    it("deleteTableOrder rejects when user is unauthenticated or not an admin", async () => {
      mockAuth.mockResolvedValue(null);
      await expect(deleteTableOrder("ord-1")).rejects.toThrow("Unauthorized: Authentication required");

      mockAuth.mockResolvedValue({
        user: { id: "u1", email: "k@growkas.com", role: "kasir" },
      });
      await expect(deleteTableOrder("ord-1")).rejects.toThrow("Forbidden: Insufficient permissions");

      mockAuth.mockResolvedValue({
        user: { id: "u1", email: "admin@growkas.com", role: "admin" },
      });
      const res = await deleteTableOrder("ord-1");
      expect(res.success).toBe(true);
    });

    it("updateIngredientStockManual rejects when user is unauthenticated or not an admin", async () => {
      mockAuth.mockResolvedValue(null);
      await expect(updateIngredientStockManual("ing-1", 100)).rejects.toThrow(
        "Unauthorized: Authentication required"
      );

      mockAuth.mockResolvedValue({
        user: { id: "u1", email: "k@growkas.com", role: "kasir" },
      });
      await expect(updateIngredientStockManual("ing-1", 100)).rejects.toThrow(
        "Forbidden: Insufficient permissions"
      );
    });

    it("restockIngredient permits both admin and kasir, but rejects unauthenticated callers", async () => {
      mockAuth.mockResolvedValue(null);
      await expect(restockIngredient("ing-1", 50)).rejects.toThrow("Unauthorized: Authentication required");

      mockAuth.mockResolvedValue({
        user: { id: "u-kasir", email: "kasir@growkas.com", role: "kasir" },
      });
      const resKasir = await restockIngredient("ing-1", 50);
      expect(resKasir).toBeDefined();

      mockAuth.mockResolvedValue({
        user: { id: "u-admin", email: "admin@growkas.com", role: "admin" },
      });
      const resAdmin = await restockIngredient("ing-1", 50);
      expect(resAdmin).toBeDefined();
    });

    it("addNewIngredient rejects non-admin users and allows admin", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "u-kasir", email: "kasir@growkas.com", role: "kasir" },
      });
      await expect(
        addNewIngredient({
          name: "Sirup Pandan",
          unit: "ml",
          stock: 1000,
          min_stock: 100,
          cost_per_unit: 50,
          category: "sirup_gula",
        })
      ).rejects.toThrow("Forbidden: Insufficient permissions");

      mockAuth.mockResolvedValue({
        user: { id: "u-admin", email: "admin@growkas.com", role: "admin" },
      });
      const res = await addNewIngredient({
        name: "Sirup Pandan",
        unit: "ml",
        stock: 1000,
        min_stock: 100,
        cost_per_unit: 50,
        category: "sirup_gula",
      });
      expect(res.success).toBe(true);
    });

    it("resetDatabaseCleanAction rejects non-admin users and allows admin", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "u-kasir", email: "kasir@growkas.com", role: "kasir" },
      });
      await expect(resetDatabaseCleanAction()).rejects.toThrow("Forbidden: Insufficient permissions");

      mockAuth.mockResolvedValue({
        user: { id: "u-admin", email: "admin@growkas.com", role: "admin" },
      });
      const res = await resetDatabaseCleanAction();
      expect(res.success).toBe(true);
    });

    it("addProduct rejects non-admin users and allows admin", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "u-kasir", email: "kasir@growkas.com", role: "kasir" },
      });
      await expect(addProduct({ name: "Kopi Gayo", price: 25000, stock: 10 })).rejects.toThrow(
        "Forbidden: Insufficient permissions"
      );

      mockAuth.mockResolvedValue({
        user: { id: "u-admin", email: "admin@growkas.com", role: "admin" },
      });
      const res = await addProduct({ name: "Kopi Gayo", price: 25000, stock: 10 });
      expect(res.success).toBe(true);
    });

    it("saveTransaction rejects when unauthenticated", async () => {
      mockAuth.mockResolvedValue(null);
      await expect(
        saveTransaction({
          invoice_number: "INV-TEST",
          cashier_name: "Kasir Test",
          branch_name: "Cabang Test",
          payment_method: "cash",
          total_amount: 50000,
          paid_amount: 50000,
          change_amount: 0,
          items: [],
        })
      ).rejects.toThrow("Unauthorized: Authentication required");
    });

    it("saveTransaction succeeds when authenticated (even as kasir)", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "u-kasir", email: "kasir@growkas.com", role: "kasir" },
      });
      const result = await saveTransaction({
        invoice_number: "INV-TEST-AUTH",
        cashier_name: "Kasir Test",
        branch_name: "Cabang Test",
        payment_method: "cash",
        total_amount: 50000,
        paid_amount: 50000,
        change_amount: 0,
        items: [],
      });
      expect(result.success).toBe(true);
    });
  });

  describe("4. Route Protection Middleware & Config", () => {
    it("proxy.ts matcher does not exempt dashboard or kitchen routes", () => {
      const matcherPattern = proxyConfig.matcher[0];
      // The regex exclusion group should not contain 'dashboard' or 'kitchen'
      expect(matcherPattern).not.toContain("dashboard");
      expect(matcherPattern).not.toContain("kitchen");
    });

    it("auth.ts authorized callback blocks unauthenticated access to /dashboard and /kitchen", () => {
      const authFileContent = fs.readFileSync(path.resolve(__dirname, "../../auth.ts"), "utf-8");
      // Verify authorized callback is implemented with route checking
      expect(authFileContent).toMatch(/authorized\s*\(\s*\{\s*auth\s*,\s*request/);
      expect(authFileContent).not.toMatch(/authorized\(\s*\{\s*auth\s*,\s*request\s*\}\s*\)\s*\{\s*return true;\s*\}/);
      expect(authFileContent).toContain("/dashboard");
      expect(authFileContent).toContain("/kitchen");
    });
  });
});
