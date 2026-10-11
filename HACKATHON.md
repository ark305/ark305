# eMerge AI Hackathon 2026 — scaffold branch

Branch: `hackathon-emerge-2026`. Created 2026-10-11.

## What this branch is
Hackathon sandbox only. One-screen demo scaffold + fallbacks for the Oct 17 eMerge AI Hackathon (The LAB Miami, 8am–8pm EDT).

## What's in it
- `src/app/hackathon/page.tsx` — one-screen demo: ONE input ("Yate y cena para 6 este sábado") → ONE output (the plan) → ONE action ("Confirmar plan").
- Live path: POST `/api/ai` (needs Supabase session + Anthropic key), 8s timeout.
- Demo path: `?demo=1` or the "Modo demo" toggle, or automatic on ANY live failure → canned plan, zero network. Judges always see a working screen.

## Rules
- NEVER merge to `main`. Production code is owned by Claude Code on Felipe's Mac.
- This branch is additive-only scaffolding; it touches no existing routes or components.
- After the Oct 16 rehearsal: polish only, no new features.
