// lib/services/thermal_printer_service.dart — Layanan Cetak Struk Bluetooth Thermal POS 58mm

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/cart_item_model.dart';
import '../core/constants.dart';

class ThermalPrinterService {
  static final ThermalPrinterService _instance = ThermalPrinterService._internal();
  factory ThermalPrinterService() => _instance;
  ThermalPrinterService._internal();

  bool isConnected = false;

  // Format Mata Uang Rupiah
  String formatRupiah(int amount) {
    final formatter = NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0);
    return formatter.format(amount);
  }

  // Simulasi Cetak Struk Staf Kasir (Dialog Preview & Bluetooth Dispatch)
  Future<void> printReceipt({
    required BuildContext context,
    required List<CartItemModel> items,
    required int subtotal,
    required int tax,
    required int grandTotal,
    required String paymentMethod,
    required String orderType,
    required String tableNumber,
    required String cashierName,
  }) async {
    final now = DateTime.now();
    final dateStr = DateFormat("dd/MM/yyyy HH:mm").format(now);
    final orderId = "GK-${now.millisecondsSinceEpoch.toString().substring(7)}";

    // Tampilkan Dialog Preview Struk Thermal 58mm Presisi
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1E1E1E),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: const [
            Icon(Icons.print, color: AppConstants.primary),
            SizedBox(width: 8),
            Text("Struk Thermal 58mm", style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
          ],
        ),
        content: SizedBox(
          width: double.maxFinite,
          child: SingleChildScrollView(
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text("GROWKAS COFFEE & SPACE", style: TextStyle(color: Colors.black, fontWeight: FontWeight.w900, fontSize: 14)),
                  const Text("Saray Coffee • Yogyakarta", style: TextStyle(color: Colors.black87, fontSize: 10)),
                  const Text("Telp: 0812-3456-7890", style: TextStyle(color: Colors.black87, fontSize: 10)),
                  const Divider(color: Colors.black54, thickness: 1),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text("No: $orderId", style: const TextStyle(color: Colors.black, fontSize: 10)),
                      Text(dateStr, style: const TextStyle(color: Colors.black, fontSize: 10)),
                    ],
                  ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text("Kasir: $cashierName", style: const TextStyle(color: Colors.black, fontSize: 10)),
                      Text("$orderType ($tableNumber)", style: const TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 10)),
                    ],
                  ),
                  const Divider(color: Colors.black54, thickness: 1),
                  ...items.map((item) => Padding(
                    padding: const EdgeInsets.symmetric(vertical: 3),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("${item.quantity}x ", style: const TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 11)),
                        Expanded(
                          child: Text(item.product.name, style: const TextStyle(color: Colors.black, fontSize: 11)),
                        ),
                        Text(formatRupiah(item.subtotal), style: const TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 11)),
                      ],
                    ),
                  )),
                  const Divider(color: Colors.black54, thickness: 1),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text("Subtotal:", style: TextStyle(color: Colors.black87, fontSize: 11)),
                      Text(formatRupiah(subtotal), style: const TextStyle(color: Colors.black87, fontSize: 11)),
                    ],
                  ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text("Pajak PB1 (10%):", style: TextStyle(color: Colors.black87, fontSize: 11)),
                      Text(formatRupiah(tax), style: const TextStyle(color: Colors.black87, fontSize: 11)),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text("TOTAL AKHIR:", style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 13)),
                      Text(formatRupiah(grandTotal), style: const TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 13)),
                    ],
                  ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text("Metode Bayar:", style: TextStyle(color: Colors.black, fontSize: 10)),
                      Text(paymentMethod.toUpperCase(), style: const TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 10)),
                    ],
                  ),
                  const Divider(color: Colors.black54, thickness: 1),
                  const Text("Terima kasih atas kunjungan Anda!", style: TextStyle(color: Colors.black87, fontSize: 10, fontStyle: FontStyle.italic)),
                  const Text("Powered by Growkas POS", style: TextStyle(color: Colors.black54, fontSize: 9)),
                ],
              ),
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text("Tutup", style: TextStyle(color: Colors.white70)),
          ),
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(backgroundColor: AppConstants.primary),
            onPressed: () {
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text("✓ Struk berhasil dikirim ke Bluetooth Thermal Printer (58mm)!"),
                  backgroundColor: AppConstants.success,
                ),
              );
            },
            icon: const Icon(Icons.check, color: Colors.white),
            label: const Text("Kirim ke Printer", style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }
}
