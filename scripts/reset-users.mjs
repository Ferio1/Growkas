import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
const envConfig = {};

envFile.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
      const key = trimmed.substring(0, idx).trim();
      const val = trimmed.substring(idx + 1).trim();
      envConfig[key] = val;
    }
  }
});

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function resetUsers() {
  console.log("--- RESETTING ALL SUPABASE USERS ---");
  
  // 1. List existing users
  const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  if (listError) {
    console.error("Error listing users:", listError.message);
    process.exit(1);
  }

  const users = listData.users || [];
  console.log(`Found ${users.length} existing users in Supabase.`);

  // 2. Delete each user
  for (const user of users) {
    console.log(`Deleting: ${user.email} (${user.id})`);
    const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (delErr) {
      console.warn(`Error deleting ${user.email}:`, delErr.message);
    }
  }

  // 3. Delete profiles
  console.log("Clearing public.profiles table...");
  const { error: profErr } = await supabaseAdmin.from('profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (profErr) {
    console.log("Profiles clear result:", profErr.message);
  }

  // 4. Create Official Kasir Account
  console.log("\nCreating Official Kasir Account (kasir@growkas.com)...");
  const { data: kasirRes, error: kasirErr } = await supabaseAdmin.auth.admin.createUser({
    email: "kasir@growkas.com",
    password: "password123",
    email_confirm: true,
    user_metadata: {
      full_name: "Kasir Saray Yogyakarta",
      role: "kasir"
    }
  });

  if (kasirErr) {
    console.error("Kasir creation failed:", kasirErr.message);
  } else if (kasirRes.user) {
    console.log("✓ Kasir account created. ID:", kasirRes.user.id);
    const { error: profKasirErr } = await supabaseAdmin.from('profiles').upsert({
      id: kasirRes.user.id,
      email: "kasir@growkas.com",
      full_name: "Kasir Saray Yogyakarta",
      role: "kasir"
    });
    if (profKasirErr) console.warn("Kasir profile error:", profKasirErr.message);
    else console.log("✓ Kasir profile created.");
  }

  // 5. Create Official Admin Account
  console.log("\nCreating Official Admin Account (admin@growkas.com)...");
  const { data: adminRes, error: adminErr } = await supabaseAdmin.auth.admin.createUser({
    email: "admin@growkas.com",
    password: "password123",
    email_confirm: true,
    user_metadata: {
      full_name: "Admin Manager Saray",
      role: "admin"
    }
  });

  if (adminErr) {
    console.error("Admin creation failed:", adminErr.message);
  } else if (adminRes.user) {
    console.log("✓ Admin account created. ID:", adminRes.user.id);
    const { error: profAdminErr } = await supabaseAdmin.from('profiles').upsert({
      id: adminRes.user.id,
      email: "admin@growkas.com",
      full_name: "Admin Manager Saray",
      role: "admin"
    });
    if (profAdminErr) console.warn("Admin profile error:", profAdminErr.message);
    else console.log("✓ Admin profile created.");
  }

  console.log("\n--- SUCCESS: RESET COMPLETE! ---");
}

resetUsers();
