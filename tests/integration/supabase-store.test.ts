import { describe, it, expect, vi, beforeEach } from "vitest";

// In-memory mock database representing Supabase tables
let mockDbIngredients: any[] = [];
let mockDbCashierShifts: any[] = [];
let mockDbTableOrders: any[] = [];
let mockDbTableOrderItems: any[] = [];

// Helper to reset mock db
function resetMockDb() {
  mockDbIngredients = [];
  mockDbCashierShifts = [];
  mockDbTableOrders = [];
  mockDbTableOrderItems = [];
}

// Mock auth to allow admin actions by default
vi.mock("@/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: {
      id: "admin-user-id",
      email: "admin@growkas.com",
      role: "admin",
    },
  }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockImplementation(async () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "admin-user-id", email: "admin@growkas.com" } },
        error: null,
      }),
    },
  })),
}));

// Mock createAdminClient from lib/supabase/admin
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn().mockImplementation(() => ({
    from: (table: string) => {
      let selectedData: any = null;
      let filterCol: string | null = null;
      let filterVal: any = null;

      const chain: any = {
        select: vi.fn().mockImplementation((columns = "*") => {
          if (table === "ingredients") {
            chain._data = [...mockDbIngredients];
          } else if (table === "cashier_shifts") {
            chain._data = [...mockDbCashierShifts];
          } else if (table === "table_orders") {
            // Join table_order_items if requested
            chain._data = mockDbTableOrders.map((o) => ({
              ...o,
              table_order_items: mockDbTableOrderItems.filter((it) => it.order_id === o.id),
            }));
          } else if (table === "table_order_items") {
            chain._data = [...mockDbTableOrderItems];
          } else {
            chain._data = [];
          }
          return chain;
        }),
        insert: vi.fn().mockImplementation((payload: any) => {
          const items = Array.isArray(payload) ? payload : [payload];
          if (table === "ingredients") {
            mockDbIngredients.push(...items);
          } else if (table === "cashier_shifts") {
            mockDbCashierShifts.push(...items);
          } else if (table === "table_orders") {
            mockDbTableOrders.push(...items);
          } else if (table === "table_order_items") {
            mockDbTableOrderItems.push(...items);
          }
          chain._lastInserted = Array.isArray(payload) ? payload : payload;
          return chain;
        }),
        update: vi.fn().mockImplementation((updates: any) => {
          chain._updates = updates;
          return chain;
        }),
        delete: vi.fn().mockImplementation(() => {
          chain._isDelete = true;
          return chain;
        }),
        eq: vi.fn().mockImplementation((col: string, val: any) => {
          if (chain._updates) {
            if (table === "ingredients") {
              const item = mockDbIngredients.find((i) => i[col] === val);
              if (item) Object.assign(item, chain._updates);
              chain._lastUpdated = item;
            } else if (table === "cashier_shifts") {
              const shift = mockDbCashierShifts.find((s) => s[col] === val);
              if (shift) Object.assign(shift, chain._updates);
              chain._lastUpdated = shift;
            } else if (table === "table_orders") {
              const order = mockDbTableOrders.find((o) => o[col] === val);
              if (order) Object.assign(order, chain._updates);
              chain._lastUpdated = order;
            }
          }
          if (chain._isDelete) {
            if (table === "ingredients") {
              mockDbIngredients = mockDbIngredients.filter((i) => i[col] !== val);
            } else if (table === "cashier_shifts") {
              mockDbCashierShifts = mockDbCashierShifts.filter((s) => s[col] !== val);
            } else if (table === "table_orders") {
              mockDbTableOrders = mockDbTableOrders.filter((o) => o[col] !== val);
              mockDbTableOrderItems = mockDbTableOrderItems.filter((it) => it.order_id !== val);
            }
          }
          if (chain._data) {
            chain._data = chain._data.filter((d: any) => d[col] === val);
          }
          return chain;
        }),
        neq: vi.fn().mockImplementation((col: string, val: any) => {
          if (chain._isDelete) {
            if (table === "table_orders") {
              mockDbTableOrders = mockDbTableOrders.filter((o) => o[col] === val);
            }
          }
          return chain;
        }),
        order: vi.fn().mockImplementation(() => chain),
        limit: vi.fn().mockImplementation((n: number) => {
          if (chain._data) chain._data = chain._data.slice(0, n);
          return chain;
        }),
        single: vi.fn().mockImplementation(() => {
          const item = chain._lastUpdated || chain._lastInserted || (chain._data && chain._data[0]) || null;
          return Promise.resolve({ data: item, error: item ? null : { message: "Not found" } });
        }),
        maybeSingle: vi.fn().mockImplementation(() => {
          const item = (chain._data && chain._data[0]) || null;
          return Promise.resolve({ data: item, error: null });
        }),
        then: (resolve: any) => {
          resolve({
            data: chain._data || chain._lastInserted || chain._lastUpdated || null,
            error: null,
          });
        },
      };
      return chain;
    },
  })),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import {
  addNewIngredient,
  getIngredientsAndCOGS,
  restockIngredient,
  updateIngredientStockManual,
} from "@/app/actions/ingredientActions";
import {
  openShift,
  getActiveShift,
  recordSaleToActiveShift,
  closeShift,
  getShiftHistory,
} from "@/app/actions/shiftActions";
import {
  createTableOrder,
  getTableOrders,
  updateTableOrderStatus,
  deleteTableOrder,
  clearAllTableOrders,
} from "@/app/actions/orderActions";
import { loadMasterStore, saveMasterStore } from "@/app/actions/storeManager";

describe("Integration: Supabase Relational Store Migration (Task 4)", () => {
  beforeEach(() => {
    resetMockDb();
    vi.clearAllMocks();
  });

  describe("1. Ingredients & Inventory Supabase Integration", () => {
    it("should insert ingredient into public.ingredients and fetch via getIngredientsAndCOGS", async () => {
      const newIngData = {
        name: "Susu Oat Barista",
        unit: "ml" as const,
        stock: 5000,
        min_stock: 1000,
        cost_per_unit: 45,
        category: "susu_dairy" as const,
      };

      const addResult = await addNewIngredient(newIngData);
      expect(addResult.success).toBe(true);
      expect(addResult.ingredient.name).toBe("Susu Oat Barista");

      // Verify inserted into Supabase mock DB
      expect(mockDbIngredients.some((i) => i.name === "Susu Oat Barista")).toBe(true);

      // Verify retrieved via getIngredientsAndCOGS
      const fetchResult = await getIngredientsAndCOGS();
      expect(fetchResult.success).toBe(true);
      const found = fetchResult.ingredients.find((i) => i.name === "Susu Oat Barista");
      expect(found).toBeDefined();
      expect(found?.stock).toBe(5000);
      expect(found?.cost_per_unit).toBe(45);
    });

    it("should update stock in public.ingredients via restockIngredient", async () => {
      // First insert an ingredient
      const addRes = await addNewIngredient({
        name: "Sirup Pandan Wangi",
        unit: "ml",
        stock: 200,
        min_stock: 500,
        cost_per_unit: 60,
        category: "sirup_gula",
      });
      const ingId = addRes.ingredient.id;

      // Restock +800
      const restockRes = await restockIngredient(ingId, 800);
      expect(restockRes.success).toBe(true);
      expect(restockRes.updatedIngredient?.stock).toBe(1000);

      // Verify in Supabase mock DB
      const dbIng = mockDbIngredients.find((i) => i.id === ingId);
      expect(dbIng?.stock).toBe(1000);
    });

    it("should update stock, min_stock, and cost in public.ingredients via updateIngredientStockManual", async () => {
      const addRes = await addNewIngredient({
        name: "Biji Kopi Robusta Temanggung",
        unit: "gram",
        stock: 100,
        min_stock: 200,
        cost_per_unit: 150,
        category: "kopi",
      });
      const ingId = addRes.ingredient.id;

      const updateRes = await updateIngredientStockManual(ingId, 2500, 500, 180);
      expect(updateRes.success).toBe(true);
      expect(updateRes.updatedIngredient?.stock).toBe(2500);
      expect(updateRes.updatedIngredient?.min_stock).toBe(500);
      expect(updateRes.updatedIngredient?.cost_per_unit).toBe(180);

      const dbIng = mockDbIngredients.find((i) => i.id === ingId);
      expect(dbIng?.stock).toBe(2500);
      expect(dbIng?.cost_per_unit).toBe(180);
    });
  });

  describe("2. Cashier Shift Management Supabase Integration", () => {
    it("should open shift in public.cashier_shifts and retrieve it as active shift", async () => {
      const openRes = await openShift("Budi Kasir", 150000, "7co (Yogyakarta)");
      expect(openRes.success).toBe(true);
      expect(openRes.shift.cashier_name).toBe("Budi Kasir");
      expect(openRes.shift.initial_cash).toBe(150000);
      expect(openRes.shift.status).toBe("open");

      // Verify in mock Supabase table
      const dbShift = mockDbCashierShifts.find((s) => s.id === openRes.shift.id);
      expect(dbShift).toBeDefined();
      expect(dbShift.status).toBe("open");
      expect(Number(dbShift.initial_cash)).toBe(150000);

      // Retrieve via getActiveShift
      const activeRes = await getActiveShift();
      expect(activeRes.success).toBe(true);
      expect(activeRes.shift).not.toBeNull();
      expect(activeRes.shift?.cashier_name).toBe("Budi Kasir");
    });

    it("should record sale and update expected_cash in public.cashier_shifts", async () => {
      await openShift("Kasir Test", 100000);

      const saleRes = await recordSaleToActiveShift("cash", 50000);
      expect(saleRes.success).toBe(true);
      expect(saleRes.shift.expected_cash).toBe(150000);

      // Verify in Supabase table
      const activeDb = mockDbCashierShifts.find((s) => s.status === "open");
      expect(Number(activeDb?.expected_cash)).toBe(150000);
    });

    it("should close shift, record discrepancy, and mark status as closed", async () => {
      const openRes = await openShift("Kasir Closing", 200000);
      await recordSaleToActiveShift("cash", 100000); // expected_cash = 300000

      // Closing with 295000 (selisih -5000)
      const closeRes = await closeShift(295000, "Selisih 5rb uang kembalian permen");
      expect(closeRes.success).toBe(true);
      expect(closeRes.closedShift.status).toBe("closed");
      expect(closeRes.closedShift.actual_cash).toBe(295000);
      expect(closeRes.closedShift.discrepancy).toBe(-5000);

      // Verify in Supabase table
      const dbShift = mockDbCashierShifts.find((s) => s.id === openRes.shift.id);
      expect(dbShift?.status).toBe("closed");
      expect(Number(dbShift?.actual_cash)).toBe(295000);
      expect(Number(dbShift?.discrepancy)).toBe(-5000);

      // getActiveShift should now return null
      const activeAfterClose = await getActiveShift();
      expect(activeAfterClose.shift).toBeNull();
    });
  });

  describe("3. Table Orders & Items Supabase Integration", () => {
    it("should create order and items in public.table_orders and table_order_items", async () => {
      const newOrder = await createTableOrder({
        invoice_number: "INV-TBL-001",
        table_number: "Meja 07",
        branch_name: "7co (Yogyakarta)",
        payment_method: "qris",
        payment_status: "paid",
        status: "pending",
        total_amount: 51000,
        items: [
          { product_name: "7co Caramel Macchiato", quantity: 1, price: 28000, subtotal: 28000 },
          { product_name: "7co Kopi Susu Creamy", quantity: 1, price: 23000, subtotal: 23000 },
        ],
      });

      expect(newOrder.success).toBe(true);
      expect(newOrder.order.invoice_number).toBe("INV-TBL-001");

      // Verify in public.table_orders
      const dbOrder = mockDbTableOrders.find((o) => o.invoice_number === "INV-TBL-001");
      expect(dbOrder).toBeDefined();
      expect(Number(dbOrder?.total_amount)).toBe(51000);

      // Verify in public.table_order_items
      const dbItems = mockDbTableOrderItems.filter((it) => it.order_id === newOrder.order.id);
      expect(dbItems.length).toBe(2);

      // Retrieve via getTableOrders
      const allOrders = await getTableOrders();
      expect(allOrders.success).toBe(true);
      const retrieved = allOrders.orders.find((o) => o.invoice_number === "INV-TBL-001");
      expect(retrieved).toBeDefined();
      expect(retrieved?.items.length).toBe(2);
    });

    it("should update table order status", async () => {
      const created = await createTableOrder({
        invoice_number: "INV-TBL-002",
        table_number: "Meja 03",
        branch_name: "7co (Yogyakarta)",
        payment_method: "cash",
        payment_status: "unpaid",
        status: "pending",
        total_amount: 36000,
        items: [{ product_name: "7co Smash Beef Burger", quantity: 1, price: 36000, subtotal: 36000 }],
      });

      const updated = await updateTableOrderStatus(created.order.id, "processing");
      expect(updated.success).toBe(true);
      expect(updated.order?.status).toBe("processing");

      const dbOrder = mockDbTableOrders.find((o) => o.id === created.order.id);
      expect(dbOrder?.status).toBe("processing");
    });

    it("should delete specific table order and cascade items", async () => {
      const created = await createTableOrder({
        invoice_number: "INV-TBL-003",
        table_number: "Meja 05",
        branch_name: "7co (Yogyakarta)",
        payment_method: "cash",
        payment_status: "unpaid",
        status: "pending",
        total_amount: 25000,
        items: [{ product_name: "7co Truffle Cheese Fries", quantity: 1, price: 25000, subtotal: 25000 }],
      });

      const delRes = await deleteTableOrder(created.order.id);
      expect(delRes.success).toBe(true);

      const dbOrder = mockDbTableOrders.find((o) => o.id === created.order.id);
      expect(dbOrder).toBeUndefined();
    });

    it("should clear all table orders", async () => {
      await createTableOrder({
        invoice_number: "INV-CLR-01",
        table_number: "Meja 01",
        branch_name: "7co",
        payment_method: "cash",
        payment_status: "unpaid",
        status: "pending",
        total_amount: 20000,
        items: [],
      });

      const clearRes = await clearAllTableOrders();
      expect(clearRes.success).toBe(true);

      const all = await getTableOrders();
      expect(all.orders.length).toBe(0);
    });
  });

  describe("4. Safe In-Memory Fallback & No /tmp Deprecation", () => {
    it("should maintain safe in-memory data integrity without crashing when Supabase is offline", async () => {
      const store = loadMasterStore();
      expect(store).toBeDefined();
      expect(Array.isArray(store.products)).toBe(true);
      expect(Array.isArray(store.ingredients)).toBe(true);

      // Mutate in-memory store
      store.ingredients[0].stock = 777;
      saveMasterStore(store);

      const reloaded = loadMasterStore();
      expect(reloaded.ingredients[0].stock).toBe(777);
    });
  });
});
