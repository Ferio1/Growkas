// lib/models/cart_item_model.dart — Model Item Keranjang Pesanan Kasir

import 'product_model.dart';

class CartItemModel {
  final ProductModel product;
  int quantity;
  String notes;
  String orderType; // "Dine In" atau "Takeaway"
  String tableNumber;

  CartItemModel({
    required this.product,
    this.quantity = 1,
    this.notes = "",
    this.orderType = "Dine In",
    this.tableNumber = "01",
  });

  int get subtotal => product.price * quantity;
}
