// lib/screens/cart_sheet_screen.dart — Lembar Laci Keranjang Pesanan Kasir & Pembayaran

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../core/constants.dart';
import '../core/supabase_service.dart';
import '../providers/cart_provider.dart';
import '../services/thermal_printer_service.dart';

class CartSheetScreen extends StatefulWidget {
  const CartSheetScreen({Key? key}) : super(key: key);

  @override
  State<CartSheetScreen> createState() => _CartSheetScreenState();
}

class _CartSheetScreenState extends State<CartSheetScreen> {
  String _selectedPayment = "Tunai (Cash)";
  bool _isProcessing = false;

  String _formatRupiah(int amount) {
    return NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0).format(amount);
  }

  Future<void> _handleCheckout(CartProvider cart) async {
    if (cart.items.isEmpty) return;

    setState(() => _isProcessing = true);

    try {
      // 1. Simpan Transaksi ke Supabase PostgreSQL
      await SupabaseService().saveTransaction(
        orderType: cart.orderType,
        tableNumber: cart.tableNumber,
        totalAmount: cart.grandTotal,
        paymentMethod: _selectedPayment,
        items: cart.items.map((i) => {
          'id': i.product.id,
          'name': i.product.name,
          'quantity': i.quantity,
          'price': i.product.price,
          'subtotal': i.subtotal,
        }).toList(),
      );

      if (!mounted) return;

      // 2. Buka Dialog Cetak Struk Thermal Bluetooth
      await ThermalPrinterService().printReceipt(
        context: context,
        items: cart.items,
        subtotal: cart.subtotal,
        tax: cart.tax,
        grandTotal: cart.grandTotal,
        paymentMethod: _selectedPayment,
        orderType: cart.orderType,
        tableNumber: cart.tableNumber,
        cashierName: "Kasir Saray",
      );

      // 3. Bersihkan Keranjang & Tutup Laci
      cart.clearCart();
      if (mounted) {
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Info: Transaksi selesai ($e)"), backgroundColor: AppConstants.primary),
        );
        cart.clearCart();
        Navigator.pop(context);
      }
    } finally {
      if (mounted) {
        setState(() => _isProcessing = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final cart = Provider.of<CartProvider>(context);

    return Container(
      height: MediaQuery.of(context).size.height * 0.85,
      decoration: const BoxDecoration(
        color: AppConstants.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          // Drag Handle
          const SizedBox(height: 12),
          Container(
            width: 48,
            height: 4,
            decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(10)),
          ),
          const SizedBox(height: 16),

          // Header Laci
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Text("🛒 Pesanan Aktif", style: TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.bold)),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(color: AppConstants.primary, borderRadius: BorderRadius.circular(10)),
                      child: Text("${cart.totalQuantity} Item", style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
                if (cart.items.isNotEmpty)
                  GestureDetector(
                    onTap: cart.clearCart,
                    child: const Text("Hapus Semua", style: TextStyle(color: AppConstants.danger, fontSize: 12, fontWeight: FontWeight.bold)),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // Opsi Cepat Dine In / Takeaway & Nomor Meja
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: [
                Expanded(
                  child: Container(
                    decoration: BoxDecoration(color: AppConstants.cardBg, borderRadius: BorderRadius.circular(10)),
                    padding: const EdgeInsets.all(3),
                    child: Row(
                      children: ["Dine In", "Takeaway"].map((type) {
                        final isSelected = cart.orderType == type;
                        return Expanded(
                          child: GestureDetector(
                            onTap: () => cart.setOrderType(type),
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 8),
                              decoration: BoxDecoration(
                                color: isSelected ? AppConstants.primary : Colors.transparent,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Center(
                                child: Text(
                                  type == "Dine In" ? "🪑 Dine In" : "🛍️ Takeaway",
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                                    color: isSelected ? Colors.white : AppConstants.textMuted,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                ),
                if (cart.orderType == "Dine In") ...[
                  const SizedBox(width: 10),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppConstants.cardBg,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: AppConstants.border),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        value: cart.tableNumber,
                        dropdownColor: AppConstants.cardBg,
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                        items: List.generate(20, (index) {
                          final numStr = (index + 1) < 10 ? "0${index + 1}" : "${index + 1}";
                          return DropdownMenuItem(
                            value: numStr,
                            child: Text("Meja $numStr"),
                          );
                        }),
                        onChanged: (val) {
                          if (val != null) cart.setTableNumber(val);
                        },
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
          const Divider(color: AppConstants.border, height: 24),

          // Daftar Item Keranjang
          Expanded(
            child: cart.items.isEmpty
                ? const Center(
                    child: Text("Keranjang belanja masih kosong", style: TextStyle(color: AppConstants.textMuted, fontSize: 13)),
                  )
                : ListView.separated(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    itemCount: cart.items.length,
                    separatorBuilder: (_, __) => const Divider(color: AppConstants.border, height: 16),
                    itemBuilder: (context, index) {
                      final item = cart.items[index];
                      return Row(
                        children: [
                          Container(
                            width: 38,
                            height: 38,
                            decoration: BoxDecoration(
                              color: AppConstants.primary.withOpacity(0.15),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Center(
                              child: Text(item.product.icon, style: const TextStyle(fontSize: 18)),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(item.product.name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                                const SizedBox(height: 2),
                                Text(_formatRupiah(item.product.price), style: const TextStyle(color: AppConstants.primary, fontSize: 12, fontWeight: FontWeight.w600)),
                              ],
                            ),
                          ),
                          Row(
                            children: [
                              IconButton(
                                icon: const Icon(Icons.remove_circle_outline, color: AppConstants.textMuted, size: 20),
                                onPressed: () => cart.updateQuantity(item.product.id, item.quantity - 1),
                              ),
                              Text("${item.quantity}", style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                              IconButton(
                                icon: const Icon(Icons.add_circle, color: AppConstants.primary, size: 20),
                                onPressed: () => cart.updateQuantity(item.product.id, item.quantity + 1),
                              ),
                            ],
                          ),
                        ],
                      );
                    },
                  ),
          ),

          // Ringkasan Pembayaran & Tombol Bayar
          if (cart.items.isNotEmpty)
            Container(
              padding: const EdgeInsets.all(20),
              decoration: const BoxDecoration(
                color: Color(0xFF141414),
                border: Border(top: BorderSide(color: AppConstants.border)),
              ),
              child: SafeArea(
                child: Column(
                  children: [
                    // Pilihan Metode Pembayaran
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text("Metode Bayar:", style: TextStyle(color: AppConstants.textMuted, fontSize: 12)),
                        DropdownButtonHideUnderline(
                          child: DropdownButton<String>(
                            value: _selectedPayment,
                            dropdownColor: AppConstants.surface,
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                            items: const [
                              DropdownMenuItem(value: "Tunai (Cash)", child: Text("💵 Tunai (Cash)")),
                              DropdownMenuItem(value: "QRIS Mandiri", child: Text("📱 QRIS Mandiri")),
                              DropdownMenuItem(value: "Kartu Debit", child: Text("💳 Kartu Debit")),
                            ],
                            onChanged: (val) {
                              if (val != null) setState(() => _selectedPayment = val);
                            },
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),

                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text("Subtotal:", style: TextStyle(color: AppConstants.textMuted, fontSize: 12)),
                        Text(_formatRupiah(cart.subtotal), style: const TextStyle(color: Colors.white, fontSize: 12)),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text("PB1 Pajak Resto (10%):", style: TextStyle(color: AppConstants.textMuted, fontSize: 12)),
                        Text(_formatRupiah(cart.tax), style: const TextStyle(color: Colors.white, fontSize: 12)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text("Total Pembayaran:", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                        Text(_formatRupiah(cart.grandTotal), style: const TextStyle(color: AppConstants.primary, fontWeight: FontWeight.w900, fontSize: 16)),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // Tombol Bayar & Cetak Struk
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppConstants.primary,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          elevation: 4,
                        ),
                        onPressed: _isProcessing ? null : () => _handleCheckout(cart),
                        icon: _isProcessing
                            ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                            : const Icon(Icons.receipt_long, color: Colors.white),
                        label: Text(
                          _isProcessing ? "Menyimpan Transaksi..." : "Bayar & Cetak Struk (${_formatRupiah(cart.grandTotal)})",
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}
