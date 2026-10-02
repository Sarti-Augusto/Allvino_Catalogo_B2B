# Supabase Auth setup

The app uses Supabase Auth for the admin session and keeps Prisma for catalog data.

1. Copy `.env.example` to `.env.local`.
2. In Supabase, open **Project Settings → API → Connect** and set
   `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
3. In **Authentication → Users**, create an email/password user whose email matches
   `ADMIN_EMAIL`. Use `ADMIN_PASSWORD` for the initial password if convenient.
4. Add the local and production URLs under **Authentication → URL Configuration**.
5. Start the app and open `/admin/login`.

Only the configured `ADMIN_EMAIL` is accepted by the protected admin pages and API
routes. Admin authorization does not use editable user metadata or the legacy
NextAuth credentials.
