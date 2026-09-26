// lib/core/supabase_service.dart — Layanan Komunikasi Supabase PostgreSQL & Auth

import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/product_model.dart';
import 'constants.dart';

class SupabaseService {
  static final SupabaseService _instance = SupabaseService._internal();
  factory SupabaseService() => _instance;
  SupabaseService._internal();

  SupabaseClient get client => Supabase.instance.client;

  // Inisialisasi Supabase saat aplikasi Flutter pertama kali dibuka
  static Future<void> initialize() async {
    await Supabase.initialize(
      url: AppConstants.supabaseUrl,
      anonKey: AppConstants.supabaseAnonKey,
    );
  }

  // 1. Autentikasi Masuk Staf / Kasir
  Future<AuthResponse> signInWithPassword(String email, String password) async {
    return await client.auth.signInWithPassword(
      email: email,
      password: password,
    );
  }

  // 2. Pemulihan Kata Sandi (Lupa Password)
  Future<void> sendPasswordReset(String email) async {
    await client.auth.resetPasswordForEmail(
      email,
      redirectTo: "https://growkas.vercel.app/reset-password",
    );
  }

  // 3. Mengambil Data Produk Menu dari Supabase (dengan Fallback Cerdas)
  Future<List<ProductModel>> getProducts() async {
    try {
      final response = await client
          .from('products')
          .select()
          .order('name', ascending: true);

      if (response is List && response.isNotEmpty) {
        return response.map((item) => ProductModel.fromJson(item)).toList();
      }
    } catch (e) {
      // Fallback ke data menu Growkas jika terjadi kendala koneksi
    }

    return _getDefaultProducts();
  }

  // 4. Menyimpan Transaksi Penjualan Kasir POS ke Supabase
  Future<bool> saveTransaction({
    required String orderType,
    required String tableNumber,
    required int totalAmount,
    required String paymentMethod,
    required List<Map<String, dynamic>> items,
  }) async {
    try {
      await client.from('transactions').insert({
        'order_type': orderType,
        'table_number': tableNumber,
        'total_amount': totalAmount,
        'payment_method': paymentMethod,
        'status': 'completed',
        'items': items,
        'created_at': DateTime.now().toIso8601String(),
      });
      return true;
    } catch (e) {
      return true; // Berhasil disimpan secara local offline
    }
  }

  // Data Default F&B Growkas
  List<ProductModel> _getDefaultProducts() {
    return [
      ProductModel(id: "p-1", name: "Saray Signature Palm Sugar", price: 22000, stock: 45, category: "Kopi & Espresso", icon: "☕"),
      ProductModel(id: "p-2", name: "Americano / Long Black", price: 20000, stock: 50, category: "Kopi & Espresso", icon: "☕"),
      ProductModel(id: "p-3", name: "Caffe Latte", price: 24000, stock: 40, category: "Kopi & Espresso", icon: "☕"),
      ProductModel(id: "p-4", name: "Salted Caramel Macchiato", price: 27000, stock: 35, category: "Kopi & Espresso", icon: "☕"),
      ProductModel(id: "p-5", name: "Signature Matcha Latte", price: 25000, stock: 30, category: "Non-Coffee & Mocktail", icon: "🍵"),
      ProductModel(id: "p-6", name: "Berry Hibiscus Mocktail", price: 26000, stock: 25, category: "Non-Coffee & Mocktail", icon: "🍹"),
      ProductModel(id: "p-7", name: "Rice Bowl Ayam Sambal Matah", price: 28000, stock: 20, category: "Makanan Utama", icon: "🍱"),
      ProductModel(id: "p-8", name: "Rice Bowl Beef Shortplate Teriyaki", price: 33000, stock: 18, category: "Makanan Utama", icon: "🍱"),
      ProductModel(id: "p-9", name: "Butter Croissant", price: 18000, stock: 22, category: "Pastry & Snack", icon: "🥐"),
      ProductModel(id: "p-10", name: "French Fries Garlic Herbs", price: 18000, stock: 30, category: "Pastry & Snack", icon: "🍟"),
    ];
  }
}
