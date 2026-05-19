# Supabase setup (shared list for you + your partner)

Both of you open the same URL and see the **same tasks** in real time.

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign up / log in  
2. **New project** → pick a name and password → wait until it’s ready  

## 2. Create the database table

1. In Supabase: **SQL Editor** → **New query**  
2. Open `supabase/schema.sql` in this repo  
3. **Important:** change every `'our-couple-list'` to your own secret id (e.g. `'sun-family-2026'`)  
4. Click **Run**  

## 3. Turn on Realtime (live updates)

1. **Table Editor** → `tasks`  
2. Open the **Realtime** toggle (or Database → Replication → enable `tasks`)  

## 4. Get API keys

**Project Settings** → **API**:

| Copy | Use as |
|------|--------|
| Project URL | `VITE_SUPABASE_URL` |
| `anon` `public` key | `VITE_SUPABASE_ANON_KEY` |

Your list id from step 2 → `VITE_LIST_ID` (same string, no quotes)

## 5. Local development

```bash
cp .env.example .env
# edit .env with the three values above
npm run dev
```

## 6. GitHub Pages (live site)

Repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:

| Secret name | Value |
|-------------|--------|
| `VITE_SUPABASE_URL` | Project URL |
| `VITE_SUPABASE_ANON_KEY` | anon public key |
| `VITE_LIST_ID` | your list id (e.g. `sun-family-2026`) |

Push to `main` (or re-run the **Deploy to GitHub Pages** workflow). Wait ~2 minutes, then open:

**https://anneswx.github.io/to-do-list/**

Share that link with your boyfriend — no install needed.

## Notes

- The `anon` key is public in the browser; your list id in RLS policies keeps random visitors out of *your* rows (use a non-guessable id).  
- Anyone who knows your list id could still access the list; this is fine for a private couple list, not for secrets.  
- Old tasks in `localStorage` are no longer used after Supabase is connected.
