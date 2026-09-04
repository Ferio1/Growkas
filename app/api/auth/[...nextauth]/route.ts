// app/api/auth/[...nextauth]/route.ts
// Handler catchall untuk semua route NextAuth.js:
//   GET  /api/auth/session
//   GET  /api/auth/csrf
//   GET  /api/auth/providers
//   GET  /api/auth/callback/google
//   POST /api/auth/signin/google
//   POST /api/auth/signout
//   dll.

import { handlers } from "@/auth";

// Export GET dan POST handler dari NextAuth
export const { GET, POST } = handlers;
