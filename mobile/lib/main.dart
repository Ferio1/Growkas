// lib/main.dart — Entry Point Aplikasi Flutter Growkas Mobile POS

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'core/constants.dart';
import 'core/supabase_service.dart';
import 'providers/cart_provider.dart';
import 'screens/login_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Inisialisasi Kredensial Supabase PostgreSQL & Auth
  try {
    await SupabaseService.initialize();
  } catch (e) {
    debugPrint("Supabase init note: $e");
  }

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => CartProvider()),
      ],
      child: const GrowkasMobileApp(),
    ),
  );
}

class GrowkasMobileApp extends StatelessWidget {
  const GrowkasMobileApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: AppConstants.appName,
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: AppConstants.background,
        primaryColor: AppConstants.primary,
        colorScheme: const ColorScheme.dark(
          primary: AppConstants.primary,
          secondary: AppConstants.primaryDark,
          surface: AppConstants.surface,
          background: AppConstants.background,
        ),
        textTheme: GoogleFonts.plusJakartaSansTextTheme(
          ThemeData(brightness: Brightness.dark).textTheme,
        ),
      ),
      home: const LoginScreen(),
    );
  }
}
