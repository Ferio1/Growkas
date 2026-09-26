// lib/providers/cart_provider.dart — State Management Keranjang Pesanan Kasir (Provider)

import 'package:flutter/foundation.dart';
import '../models/product_model.dart';
import '../models/cart_item_model.dart';

class CartProvider extends ChangeNotifier {
  final List<CartItemModel> _items = [];
  String _orderType = "Dine In";
  String _tableNumber = "01";

  List<CartItemModel> get items => List.unmodifiable(_items);
  String get orderType => _orderType;
  String get tableNumber => _tableNumber;

  int get totalQuantity => _items.fold(0, (sum, i) => sum + i.quantity);
  int get subtotal => _items.fold(0, (sum, i) => sum + i.subtotal);
  int get tax => (subtotal * 0.1).round(); // PB1 Pajak Resto 10%
  int get grandTotal => subtotal + tax;

  void setOrderType(String type) {
    _orderType = type;
    notifyListeners();
  }

  void setTableNumber(String table) {
    _tableNumber = table;
    notifyListeners();
  }

  void addToCart(ProductModel product) {
    final index = _items.indexWhere((i) => i.product.id == product.id);
    if (index >= 0) {
      _items[index].quantity += 1;
    } else {
      _items.add(CartItemModel(
        product: product,
        quantity: 1,
        orderType: _orderType,
        tableNumber: _tableNumber,
      ));
    }
    notifyListeners();
  }

  void updateQuantity(String productId, int quantity) {
    final index = _items.indexWhere((i) => i.product.id == productId);
    if (index >= 0) {
      if (quantity <= 0) {
        _items.removeAt(index);
      } else {
        _items[index].quantity = quantity;
      }
      notifyListeners();
    }
  }

  void removeItem(String productId) {
    _items.removeWhere((i) => i.product.id == productId);
    notifyListeners();
  }

  void clearCart() {
    _items.clear();
    notifyListeners();
  }
}
