// lib/core/constants.dart — Konfigurasi Supabase & Desain Brand Growkas

import 'package:flutter/material.dart';

class AppConstants {
  // Kredensial Resmi Supabase Growkas
  static const String supabaseUrl = "https://pijpptetccvgmwyjvsse.supabase.co";
  static const String supabaseAnonKey = "sb_publishable_XhVW5_LCzb0Babc1zskrcw_VtYft_NJ";

  // Identitas Brand Growkas (Warm Terracotta Dark Theme)
  static const String appName = "Growkas POS Mobile";
  static const String appVersion = "v2.1.0";
  static const String defaultOutlet = "Saray Coffee & Space (Yogyakarta)";

  // Palet Warna UI
  static const Color primary = Color(0xFFD4651C);       // Warm Terracotta
  static const Color primaryDark = Color(0xFFC44F0D);   // Deep Terracotta
  static const Color background = Color(0xFF0A0A0A);    // Jet Black
  static const Color surface = Color(0xFF161616);       // Dark Neutral
  static const Color cardBg = Color(0xFF1C1C1C);        // Card Grey
  static const Color border = Color(0x1FFFFFFF);        // Subtle White Border
  static const Color textLight = Color(0xFFF5F0E8);     // Warm White
  static const Color textMuted = Color(0x99F5F0E8);     // Muted Gray
  static const Color success = Color(0xFF4ADE80);       // Emerald Green
  static const Color danger = Color(0xFFEF4444);        // Crimson Red
  static const Color warning = Color(0xFFF59E0B);       // Amber
}
