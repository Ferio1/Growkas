import { auth } from "@/auth";
import { createClient } from "@/lib/supabase/server";

export interface AuthUser {
  userId: string;
  role: string;
  email: string;
}

interface SessionUser {
  id?: string;
  sub?: string;
  email?: string;
  role?: string;
}

/**
 * Asserts that the incoming request is authenticated via NextAuth or Supabase SSR session.
 * Throws an Error("Unauthorized: Authentication required") if no valid session is found.
 */
export async function assertAuthenticated(): Promise<AuthUser> {
  // 1. Check NextAuth session
  try {
    const session = await auth();
    if (session?.user) {
      const user = session.user as SessionUser;
      const userId = user.id || user.sub || "";
      const email = user.email || "";
      const role = user.role || "kasir";

      return {
        userId,
        role,
        email,
      };
    }
  } catch {
    // NextAuth auth() can fail in test environment or outside active request context
  }

  // 2. Check Supabase SSR session fallback
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (user && !error) {
      const role =
        (user.user_metadata?.role as string) ||
        (user.app_metadata?.role as string) ||
        "kasir";

      return {
        userId: user.id,
        role,
        email: user.email || "",
      };
    }
  } catch {
    // Supabase createClient or getUser can fail if env vars are missing or outside cookies context
  }

  throw new Error("Unauthorized: Authentication required");
}

/**
 * Asserts that the authenticated user possesses one of the allowed roles.
 * Throws Error("Unauthorized: Authentication required") if unauthenticated,
 * or Error("Forbidden: Insufficient permissions") if role is not permitted.
 */
export async function assertRole(allowedRoles: string[]): Promise<AuthUser> {
  const user = await assertAuthenticated();

  if (!allowedRoles.includes(user.role)) {
    throw new Error("Forbidden: Insufficient permissions");
  }

  return user;
}
