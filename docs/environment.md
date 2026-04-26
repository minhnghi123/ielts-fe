# Frontend — Environment Variables

All environment variables for the Next.js application (`my-app/`).

---

## Setup

```bash
cp .env.example .env
# Edit .env with your actual values
```

Variables prefixed with `NEXT_PUBLIC_` are **inlined at build time** and visible in the browser bundle. All other variables are **server-side only** and safe to hold secrets.

---

## Variable Reference

### Public Variables (browser-safe)

| Variable | Required | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | `http://localhost:5000` | Base URL of the NestJS API Gateway. All `lib/api/*.ts` calls go here. |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | — | Supabase project URL (e.g., `https://<ref>.supabase.co`). Used by the Supabase client in `lib/supabase/`. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | — | Supabase publishable anon key. Safe to expose; enforced by Supabase Row Level Security. |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Yes | — | Cloudinary cloud name used to construct media URLs in the frontend. |

### Server-Side Secrets (never exposed to browser)

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | Yes | API key for Groq LLM service. Used in all `app/api/ai/*.ts` routes. Model: `llama-3.3-70b-versatile`. |
| `CLOUDINARY_API_KEY` | Yes | Cloudinary API key for signed uploads in `app/api/upload/*.ts` routes. |
| `CLOUDINARY_API_SECRET` | Yes | Cloudinary API secret for upload signature generation. |

---

## .env.example Template

```env
# === Public (browser-safe) ===
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=<your-cloud-name>

# === Server-side secrets ===
GROQ_API_KEY=<your-groq-api-key>
CLOUDINARY_API_KEY=<your-cloudinary-api-key>
CLOUDINARY_API_SECRET=<your-cloudinary-api-secret>
```

---

## Rules and Gotchas

1. **`NEXT_PUBLIC_` prefix is mandatory** for any value needed in client components or browser code. Forgetting the prefix causes `undefined` at runtime.
2. **Secrets must never use `NEXT_PUBLIC_`** — the build inlines them into the JS bundle and they become publicly readable.
3. **Changes require a rebuild** — `NEXT_PUBLIC_` vars are baked in at `npm run build`. Changing them after build has no effect until you rebuild.
4. **Local overrides** — Next.js loads `.env.local` after `.env`, so you can create `.env.local` for machine-specific overrides without affecting the committed `.env.example`.
5. **AI routes only** — `GROQ_API_KEY` and `CLOUDINARY_API_KEY`/`CLOUDINARY_API_SECRET` are only accessed inside `app/api/` routes. Component files have no access to these.

---

## Runtime Access Patterns

```typescript
// In a client component or lib/api.ts — PUBLIC vars only
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

// In a Next.js API route (app/api/**) — server-side secrets OK
const groqKey = process.env.GROQ_API_KEY;
const cloudinaryKey = process.env.CLOUDINARY_API_KEY;
```
