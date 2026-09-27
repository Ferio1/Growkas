import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs";
import path from "path";

// Track Supabase RPC calls and DB operations
let mockRpcCalls: { fn: string; params: any }[] = [];
let mockProductInserts: any[] = [];
let mockCategoryQueries: any[] = [];
let mockCategoryInserts: any[] = [];
let mockTableOrderInserts: any[] = [];
let shouldFailProductInsert = false;
let productInsertErrorMessage = "column 'category' does not exist in table 'products'";

const mockCategories = [
  { id: "cat-uuid-espresso-1111", name: "Espresso" },
  { id: "cat-uuid-iceblend-2222", name: "Ice Blend" },
  { id: "cat-uuid-camilan-3333", name: "Camilan" },
  { id: "cat-uuid-teh-4444", name: "Teh" },
  { id: "cat-uuid-umum-5555", name: "Umum" },
];

// Mock Auth
vi.mock("@/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: {
      id: "admin-uuid-0001",
      email: "admin@growkas.com",
      role: "admin",
    },
  }),
}));

// Mock Next Cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock shiftActions & ingredientActions
vi.mock("@/app/actions/shiftActions", () => ({
  recordSaleToActiveShift: vi.fn().mockResolvedValue({ success: true }),
  getActiveShift: vi.fn().mockResolvedValue({ shift: null }),
}));

vi.mock("@/app/actions/ingredientActions", () => ({
  deductRawIngredientsForItems: vi.fn().mockResolvedValue({ success: true }),
}));

// Supabase mock setup
function createMockSupabase() {
  return {
    rpc: vi.fn().mockImplementation((fn: string, params: any) => {
      mockRpcCalls.push({ fn, params });
      return Promise.resolve({ data: { success: true, remaining_stock: 10 }, error: null });
    }),
    from: vi.fn().mockImplementation((table: string) => {
      const chain: any = {
        select: vi.fn().mockImplementation((cols?: string) => {
          if (table === "categories") {
            mockCategoryQueries.push(cols);
            return Promise.resolve({ data: mockCategories, error: null });
          }
          if (table === "products") {
            return {
              or: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: "a0000000-0000-0000-0000-000000000001", stock: 50 },
                  error: null,
                }),
              }),
              single: vi.fn().mockResolvedValue({
                data: { id: "a0000000-0000-0000-0000-000000000001", stock: 50 },
                error: null,
              }),
            };
          }
          return chain;
        }),
        insert: vi.fn().mockImplementation((payload: any) => {
          if (table === "products") {
            if (shouldFailProductInsert) {
              return {
                select: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: productInsertErrorMessage },
                }),
              };
            }
            const items = Array.isArray(payload) ? payload : [payload];
            mockProductInserts.push(...items);
            return {
              select: vi.fn().mockResolvedValue({
                data: items.map((it, idx) => ({ id: `new-p-uuid-${idx}`, ...it })),
                error: null,
              }),
            };
          }
          if (table === "categories") {
            const items = Array.isArray(payload) ? payload : [payload];
            mockCategoryInserts.push(...items);
            return {
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: "new-cat-uuid-9999", name: items[0]?.name },
                  error: null,
                }),
              }),
            };
          }
          if (table === "table_orders") {
            mockTableOrderInserts.push(payload);
            return Promise.resolve({ data: payload, error: null });
          }
          if (table === "transactions") {
            return {
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: "trx-uuid-001", ...payload },
                  error: null,
                }),
              }),
            };
          }
          if (table === "transaction_items") {
            return Promise.resolve({ data: payload, error: null });
          }
          return chain;
        }),
        update: vi.fn().mockImplementation((payload: any) => {
          return {
            eq: vi.fn().mockResolvedValue({ data: payload, error: null }),
          };
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
          neq: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      };
      return chain;
    }),
  };
}

const mockSupabaseInstance = createMockSupabase();

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn().mockImplementation(() => mockSupabaseInstance),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockImplementation(async () => mockSupabaseInstance),
}));

import { saveTransaction } from "@/app/actions/posActions";
import { batchAddProducts, ExtractedMenuItem } from "@/app/actions/aiMenuActions";
import { createTableOrder } from "@/app/actions/orderActions";
import { recordSaleToActiveShift } from "@/app/actions/shiftActions";

describe("Task 5: Concurrency, Inventory Atomic Decrement & Secure Orders", () => {
  beforeEach(() => {
    mockRpcCalls = [];
    mockProductInserts = [];
    mockCategoryQueries = [];
    mockCategoryInserts = [];
    mockTableOrderInserts = [];
    shouldFailProductInsert = false;
    vi.clearAllMocks();
  });

  describe("1. Atomic Inventory Decrement in posActions:saveTransaction", () => {
    it("should invoke deduct_product_stock_atomic stored procedure for valid product UUIDs", async () => {
      const validUuid = "123e4567-e89b-12d3-a456-426614174000";

      const result = await saveTransaction({
        invoice_number: "INV-ATOMIC-001",
        cashier_name: "Kasir Test",
        branch_name: "7co (Yogyakarta)",
        payment_method: "cash",
        total_amount: 35000,
        paid_amount: 50000,
        change_amount: 15000,
        items: [
          {
            product_id: validUuid,
            product_name: "Double Espresso",
            price: 35000,
            quantity: 2,
            subtotal: 70000,
          },
        ],
      });

      expect(result.success).toBe(true);

      // Verify that deduct_product_stock_atomic was called via supabase.rpc
      const rpcCall = mockRpcCalls.find((c) => c.fn === "deduct_product_stock_atomic");
      expect(rpcCall).toBeDefined();
      expect(rpcCall?.params).toEqual({
        p_id: validUuid,
        qty: 2,
      });
    });

    it("should handle multiple items atomically across concurrent/batch items", async () => {
      const uuid1 = "123e4567-e89b-12d3-a456-426614174001";
      const uuid2 = "123e4567-e89b-12d3-a456-426614174002";

      const result = await saveTransaction({
        invoice_number: "INV-ATOMIC-002",
        cashier_name: "Kasir Test",
        branch_name: "7co (Yogyakarta)",
        payment_method: "cash",
        total_amount: 80000,
        paid_amount: 100000,
        change_amount: 20000,
        items: [
          {
            product_id: uuid1,
            product_name: "Latte",
            price: 42000,
            quantity: 1,
            subtotal: 42000,
          },
          {
            product_id: uuid2,
            product_name: "Americano",
            price: 38000,
            quantity: 1,
            subtotal: 38000,
          },
        ],
      });

      expect(result.success).toBe(true);

      const rpcCallsForThisTx = mockRpcCalls.filter((c) => c.fn === "deduct_product_stock_atomic");
      expect(rpcCallsForThisTx.length).toBe(2);
      expect(rpcCallsForThisTx[0].params).toEqual({ p_id: uuid1, qty: 1 });
      expect(rpcCallsForThisTx[1].params).toEqual({ p_id: uuid2, qty: 1 });
    });

    it("should fallback to resolving DB product UUID and calling deduct_product_stock_atomic if item.product_id is non-UUID", async () => {
      const nonUuidId = "p-legacy-coffee-123";

      const result = await saveTransaction({
        invoice_number: "INV-ATOMIC-003",
        cashier_name: "Kasir Test",
        branch_name: "7co (Yogyakarta)",
        payment_method: "cash",
        total_amount: 30000,
        paid_amount: 50000,
        change_amount: 20000,
        items: [
          {
            product_id: nonUuidId,
            product_name: "Legacy Product",
            price: 30000,
            quantity: 3,
            subtotal: 90000,
          },
        ],
      });

      expect(result.success).toBe(true);

      // It looked up the product, got DB UUID 'a0000000-0000-0000-0000-000000000001', and invoked deduct_product_stock_atomic
      const rpcCall = mockRpcCalls.find((c) => c.fn === "deduct_product_stock_atomic");
      expect(rpcCall).toBeDefined();
      expect(rpcCall?.params).toEqual({
        p_id: "a0000000-0000-0000-0000-000000000001",
        qty: 3,
      });
    });
  });

  describe("2. aiMenuActions:batchAddProducts Schema Alignment & Error Propagation", () => {
    it("should map text category to category_id UUID and NOT send invalid 'category' column", async () => {
      const itemsToInsert: ExtractedMenuItem[] = [
        {
          id: "item-1",
          name: "Americano Larana",
          price: 30000,
          category: "Espresso",
          stock: 50,
          selected: true,
        },
        {
          id: "item-2",
          name: "Karamel Ice Blend",
          price: 42500,
          category: "Ice Blend",
          stock: 45,
          selected: true,
        },
      ];

      const res = await batchAddProducts(itemsToInsert);

      expect(res.success).toBe(true);
      expect(mockProductInserts.length).toBe(2);

      // Verify mapped category_id UUID is used
      expect(mockProductInserts[0].category_id).toBe("cat-uuid-espresso-1111");
      expect(mockProductInserts[1].category_id).toBe("cat-uuid-iceblend-2222");

      // Verify the broken 'category' text column was removed / replaced
      expect(mockProductInserts[0]).not.toHaveProperty("category");
      expect(mockProductInserts[1]).not.toHaveProperty("category");
    });

    it("should NOT swallow database errors and return error message when insert fails", async () => {
      shouldFailProductInsert = true;
      productInsertErrorMessage = "violates foreign key constraint on category_id";

      const itemsToInsert: ExtractedMenuItem[] = [
        {
          id: "item-1",
          name: "Test Failure",
          price: 20000,
          category: "Espresso",
          stock: 10,
          selected: true,
        },
      ];

      const res = await batchAddProducts(itemsToInsert);

      // Must NOT return { success: true } when database insert failed!
      expect(res.success).toBe(false);
      expect(res.error).toBeDefined();
      expect(res.error).toContain("violates foreign key constraint");
    });

    it("should NOT swallow unhandled exceptions and report failure", async () => {
      // Force exception during batch operation
      mockSupabaseInstance.from.mockImplementationOnce(() => {
        throw new Error("Connection refused to database pooler");
      });

      const itemsToInsert: ExtractedMenuItem[] = [
        {
          id: "item-1",
          name: "Crash Item",
          price: 20000,
          category: "Espresso",
          stock: 10,
          selected: true,
        },
      ];

      const res = await batchAddProducts(itemsToInsert);

      expect(res.success).toBe(false);
      expect(res.error).toContain("Connection refused");
    });
  });

  describe("3. QR Self-Order Payment Security in orderActions & order/page.tsx", () => {
    it("should enforce payment_status: 'unpaid' for QR self-orders even if payment_method is QRIS", async () => {
      const qrOrderResult = await createTableOrder({
        invoice_number: "ORD-QR-123456",
        table_number: "Meja 07",
        branch_name: "7co (Yogyakarta)",
        payment_method: "qris",
        payment_status: "paid" as any, // Customer simulated paying or requested paid
        status: "pending",
        total_amount: 55000,
        source: "customer_qr",
        items: [
          {
            product_name: "Latte",
            price: 55000,
            quantity: 1,
            subtotal: 55000,
          },
        ],
      });

      expect(qrOrderResult.success).toBe(true);
      // Security rule: unverified customer self-order MUST NOT be marked paid!
      expect(qrOrderResult.order.payment_status).toBe("unpaid");

      // Verify that recordSaleToActiveShift was NOT called since order is unpaid
      expect(recordSaleToActiveShift).not.toHaveBeenCalled();
    });

    it("should enforce payment_status: 'unpaid' for cash self-orders", async () => {
      const qrCashResult = await createTableOrder({
        invoice_number: "ORD-CASH-654321",
        table_number: "Meja 03",
        branch_name: "7co (Yogyakarta)",
        payment_method: "cash",
        payment_status: "unpaid",
        status: "pending",
        total_amount: 30000,
        source: "customer_qr",
        items: [
          {
            product_name: "Americano",
            price: 30000,
            quantity: 1,
            subtotal: 30000,
          },
        ],
      });

      expect(qrCashResult.success).toBe(true);
      expect(qrCashResult.order.payment_status).toBe("unpaid");
      expect(recordSaleToActiveShift).not.toHaveBeenCalled();
    });

    it("verifies order/page.tsx source code does not grant instant 'paid' status for QRIS orders", () => {
      const orderPagePath = path.resolve(
        process.cwd(),
        "app/order/page.tsx"
      );
      const content = fs.readFileSync(orderPagePath, "utf-8");

      // Should not contain: payment_method === "qris" ? "paid" : "unpaid"
      expect(content).not.toMatch(/paymentMethod\s*===\s*["']qris["']\s*\?\s*\(?["']paid["']/);
      
      // Should default customer QR order to unpaid
      expect(content).toMatch(/payment_status:\s*["']unpaid["']/);

      // Should show waiting / cashier confirmation text
      expect(content).toMatch(/Menunggu Konfirmasi Kasir|Menunggu Verifikasi/i);
    });
  });
});
