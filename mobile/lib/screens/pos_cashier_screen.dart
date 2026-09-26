// lib/screens/pos_cashier_screen.dart — Layar Utama Kasir POS & Waiter Ordering

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../core/constants.dart';
import '../core/supabase_service.dart';
import '../models/product_model.dart';
import '../providers/cart_provider.dart';
import 'cart_sheet_screen.dart';

class PosCashierScreen extends StatefulWidget {
  const PosCashierScreen({Key? key}) : super(key: key);

  @override
  State<PosCashierScreen> createState() => _PosCashierScreenState();
}

class _PosCashierScreenState extends State<PosCashierScreen> {
  final SupabaseService _supabaseService = SupabaseService();
  List<ProductModel> _allProducts = [];
  bool _isLoading = true;
  String _selectedCategory = "Semua";
  String _searchQuery = "";

  final List<String> _categories = [
    "Semua",
    "Kopi & Espresso",
    "Non-Coffee & Mocktail",
    "Makanan Utama",
    "Pastry & Snack",
  ];

  @override
  void initState() {
    super.initState();
    _loadProducts();
  }

  Future<void> _loadProducts() async {
    setState(() => _isLoading = true);
    final products = await _supabaseService.getProducts();
    setState(() {
      _allProducts = products;
      _isLoading = false;
    });
  }

  String _formatRupiah(int amount) {
    return NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0).format(amount);
  }

  List<ProductModel> get _filteredProducts {
    return _allProducts.where((p) {
      final matchCat = _selectedCategory == "Semua" || p.category.toLowerCase().contains(_selectedCategory.toLowerCase());
      final matchSearch = _searchQuery.isEmpty || p.name.toLowerCase().contains(_searchQuery.toLowerCase());
      return matchCat && matchSearch;
    }).toList();
  }

  void _openCartSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const CartSheetScreen(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final cart = Provider.of<CartProvider>(context);

    return Scaffold(
      backgroundColor: AppConstants.background,
      appBar: AppBar(
        backgroundColor: AppConstants.surface,
        elevation: 0,
        titleSpacing: 16,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: const [
            Text(
              "📍 Saray Coffee & Space",
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white),
            ),
            Text(
              "Shift Aktif: Kasir Saray • Online",
              style: TextStyle(fontSize: 10, color: AppConstants.success, fontWeight: FontWeight.w600),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: AppConstants.textLight, size: 20),
            onPressed: _loadProducts,
            tooltip: "Sinkronisasi Supabase",
          ),
          IconButton(
            icon: const Icon(Icons.logout, color: AppConstants.textMuted, size: 20),
            onPressed: () => Navigator.pop(context),
            tooltip: "Keluar",
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Search Bar & Filter Header
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              color: AppConstants.surface,
              child: TextField(
                style: const TextStyle(color: Colors.white, fontSize: 13),
                decoration: InputDecoration(
                  hintText: "Cari kopi, makanan, snack...",
                  hintStyle: const TextStyle(color: AppConstants.textMuted, fontSize: 12),
                  prefixIcon: const Icon(Icons.search, color: AppConstants.textMuted, size: 20),
                  filled: true,
                  fillColor: AppConstants.cardBg,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
                ),
                onChanged: (val) => setState(() => _searchQuery = val),
              ),
            ),

            // Horizontal Category Pills
            Container(
              height: 48,
              padding: const EdgeInsets.symmetric(vertical: 8),
              color: AppConstants.surface,
              child: ListView.separated(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                scrollDirection: Axis.horizontal,
                itemCount: _categories.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (context, index) {
                  final cat = _categories[index];
                  final isSelected = _selectedCategory == cat;
                  return GestureDetector(
                    onTap: () => setState(() => _selectedCategory = cat),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                      decoration: BoxDecoration(
                        color: isSelected ? AppConstants.primary : AppConstants.cardBg,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: isSelected ? AppConstants.primary : AppConstants.border),
                      ),
                      child: Center(
                        child: Text(
                          cat,
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                            color: isSelected ? Colors.white : AppConstants.textMuted,
                          ),
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),

            // Grid Katalog Menu Produk
            Expanded(
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator(color: AppConstants.primary))
                  : _filteredProducts.isEmpty
                      ? const Center(
                          child: Text("Menu tidak ditemukan", style: TextStyle(color: AppConstants.textMuted, fontSize: 13)),
                        )
                      : GridView.builder(
                          padding: const EdgeInsets.all(16),
                          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            crossAxisSpacing: 12,
                            mainAxisSpacing: 12,
                            childAspectRatio: 0.85,
                          ),
                          itemCount: _filteredProducts.length,
                          itemBuilder: (context, index) {
                            final product = _filteredProducts[index];
                            final inCart = cart.items.firstWhere(
                              (i) => i.product.id == product.id,
                              orElse: () => null as dynamic,
                            );

                            return GestureDetector(
                              onTap: () => cart.addToCart(product),
                              child: Container(
                                decoration: BoxDecoration(
                                  color: inCart != null ? AppConstants.primary.withOpacity(0.1) : AppConstants.surface,
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(
                                    color: inCart != null ? AppConstants.primary : AppConstants.border,
                                    width: inCart != null ? 1.5 : 1,
                                  ),
                                ),
                                padding: const EdgeInsets.all(12),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Container(
                                          width: 36,
                                          height: 36,
                                          decoration: BoxDecoration(
                                            color: AppConstants.primary.withOpacity(0.15),
                                            borderRadius: BorderRadius.circular(8),
                                          ),
                                          child: Center(
                                            child: Text(product.icon, style: const TextStyle(fontSize: 18)),
                                          ),
                                        ),
                                        if (inCart != null)
                                          Container(
                                            padding: const EdgeInsets.all(6),
                                            decoration: const BoxDecoration(color: AppConstants.primary, shape: BoxShape.circle),
                                            child: Text(
                                              "${inCart.quantity}",
                                              style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                                            ),
                                          ),
                                      ],
                                    ),
                                    const Spacer(),
                                    Text(
                                      product.name,
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      "Stok: ${product.stock}",
                                      style: const TextStyle(color: AppConstants.textMuted, fontSize: 10),
                                    ),
                                    const SizedBox(height: 8),
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text(
                                          _formatRupiah(product.price),
                                          style: const TextStyle(color: AppConstants.primary, fontSize: 12, fontWeight: FontWeight.w900),
                                        ),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                          decoration: BoxDecoration(
                                            color: AppConstants.primary,
                                            borderRadius: BorderRadius.circular(6),
                                          ),
                                          child: const Text(
                                            "+ Tambah",
                                            style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
            ),
          ],
        ),
      ),

      // Floating Sticky Bottom Cart Bar
      bottomNavigationBar: cart.totalQuantity > 0
          ? Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: AppConstants.surface,
                border: const Border(top: BorderSide(color: AppConstants.border)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.5),
                    blurRadius: 10,
                    offset: const Offset(0, -4),
                  ),
                ],
              ),
              child: SafeArea(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "🛒 ${cart.totalQuantity} Item (${cart.orderType})",
                          style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                        ),
                        Text(
                          _formatRupiah(cart.grandTotal),
                          style: const TextStyle(color: AppConstants.primary, fontSize: 16, fontWeight: FontWeight.w900),
                        ),
                      ],
                    ),
                    ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppConstants.primary,
                        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      onPressed: _openCartSheet,
                      icon: const Icon(Icons.arrow_forward, color: Colors.white, size: 18),
                      label: const Text("Lihat Pesanan", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                    ),
                  ],
                ),
              ),
            )
          : null,
    );
  }
}
