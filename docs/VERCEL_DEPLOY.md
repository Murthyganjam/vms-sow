# Deploy VMS SOW to Vercel

## 1. Push code to GitHub

Ensure your project is in a Git repo and pushed to GitHub (e.g. `vms-sow` folder as repo root, or the whole repo).

## 2. Import / create project in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/murthyganjams-projects).
2. Click **Add New** → **Project**.
3. **Import** your GitHub repository.
4. If the repo root is the **parent** of `vms-sow`, set **Root Directory** to `vms-sow`. Otherwise leave blank.
5. **Framework Preset**: Next.js (auto-detected).

## 3. Environment variables

In the project → **Settings** → **Environment Variables**, add:

| Name | Value | Notes |
|------|--------|--------|
| `DATABASE_URL` | Your Neon connection string | From [Neon Dashboard](https://console.neon.tech) → connection string with `?sslmode=require` |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` | Replace with your actual Vercel app URL (e.g. after first deploy) |
| `NEXTAUTH_SECRET` | Random string | Run `openssl rand -base64 32` locally and paste |
| `OPENAI_API_KEY` | Your OpenAI key | Required for "Draft with AI" |

Apply to **Production**, **Preview**, and **Development** as needed.

## 4. Deploy

Click **Deploy**. Vercel will run `npm install`, `prisma generate`, and `next build`.

## 5. First-time database setup (if Neon is empty)

If the Neon database is new and has no tables:

- Schema is applied when you run **locally** with `DATABASE_URL` pointing at Neon and `npx prisma db push` (already done if you followed the Neon setup).
- For a fresh Neon DB, run once from your machine:
  ```bash
  DATABASE_URL="postgresql://..." npx prisma db push
  npx tsx prisma/seed.ts
  ```
  (Use the same Neon URL you set in Vercel.)

## 6. Update NEXTAUTH_URL after first deploy

After the first deploy, Vercel gives you a URL like `https://vms-sow-xxx.vercel.app`. Go back to **Settings** → **Environment Variables**, set `NEXTAUTH_URL` to that URL, and redeploy so login redirects work.
