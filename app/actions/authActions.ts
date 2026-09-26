"use server";

import { createClient } from "@/lib/supabase/server";

export async function registerWithSupabase(formData: {
  email: string;
  password: string;
  fullName: string;
  role: string;
}) {
  try {
    const supabase = await createClient();

    // 1. Daftar ke Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.fullName,
          role: formData.role,
        },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    // 2. Simpan ke tabel profiles jika user berhasil dibuat
    if (data.user) {
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: data.user.id,
        email: formData.email,
        full_name: formData.fullName,
        role: formData.role,
      });

      if (profileError) {
        console.warn("Profil upsert info:", profileError.message);
      }
    }

    return {
      success: true,
      message: "Registrasi berhasil! Akun telah terdaftar di Supabase. Silakan masuk.",
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Terjadi kesalahan saat menghubungkan ke Supabase." };
  }
}

export async function loginWithSupabase(formData: {
  email: string;
  password: string;
}) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, user: data.user };
  } catch (err: any) {
    return { success: false, error: err.message || "Terjadi kesalahan saat masuk." };
  }
}

export async function sendPasswordResetEmail(email: string, redirectTo: string) {
  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      message: `Tautan pemulihan kata sandi telah dikirim ke ${email}. Silakan cek kotak masuk atau folder spam email Anda.`,
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Terjadi kesalahan saat mengirim email pemulihan." };
  }
}

export async function resetPasswordWithToken(newPassword: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      message: "Kata sandi berhasil diperbarui! Silakan masuk kembali dengan password baru Anda.",
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal memperbarui kata sandi." };
  }
}
