# Local PostgreSQL for development

The backend uses PostgreSQL through Prisma. The backend folder includes a
Docker Compose service with a persistent named volume for local development.

1. Install and start Docker Desktop.
2. Copy `backend/.env.example` to `backend/.env`; keep the real `GOOGLE_CLIENT_ID`
   and `JWT_SECRET` values private.
3. From `backend`, run:

   ```powershell
   pnpm db:up
   pnpm db:migrate
   pnpm dev
   ```

The default local database URL is
`postgresql://smart_explorer:smart_explorer_dev@localhost:5432/smart_explorer?schema=public`.
For Neon, use its pooled connection string as `DATABASE_URL` and keep it private.

Use the local credentials only for the local development database. Replace
them before using any shared or deployed environment.

Run `pnpm db:down` from `backend` to stop PostgreSQL without deleting its data.
