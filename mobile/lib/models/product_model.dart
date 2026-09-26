// lib/models/product_model.dart — Model Data Menu Produk F&B

class ProductModel {
  final String id;
  final String name;
  final int price;
  final int stock;
  final String category;
  final String icon;
  final String? description;

  ProductModel({
    required this.id,
    required this.name,
    required this.price,
    required this.stock,
    required this.category,
    this.icon = "☕",
    this.description,
  });

  factory ProductModel.fromJson(Map<String, dynamic> json) {
    final cat = (json['category'] ?? json['category_name'] ?? 'Kopi & Espresso').toString();
    final nameLower = (json['name'] ?? '').toString().toLowerCase();

    String iconSymbol = "☕";
    if (nameLower.contains("tea") || nameLower.contains("teh") || nameLower.contains("matcha")) {
      iconSymbol = "🍵";
    } else if (nameLower.contains("rice") || nameLower.contains("nasi") || nameLower.contains("ayam") || nameLower.contains("beef")) {
      iconSymbol = "🍱";
    } else if (nameLower.contains("croissant") || nameLower.contains("toast") || nameLower.contains("snack") || nameLower.contains("camilan")) {
      iconSymbol = "🥐";
    } else if (nameLower.contains("mocktail") || nameLower.contains("juice") || nameLower.contains("blend")) {
      iconSymbol = "🍹";
    }

    return ProductModel(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Menu Tanpa Nama',
      price: (json['price'] is num) ? (json['price'] as num).toInt() : 20000,
      stock: (json['stock'] is num) ? (json['stock'] as num).toInt() : 50,
      category: cat,
      icon: iconSymbol,
      description: json['description']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'price': price,
      'stock': stock,
      'category': category,
      'description': description,
    };
  }
}
