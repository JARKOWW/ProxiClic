# Proxi'Tech — L'informatique à domicile

Neighbourhood tech-support platform. Tech-savvy young helpers (*aidants*) assist seniors and other residents (*demandeurs*) with home IT tasks: printer setup, Wi-Fi trouble, smartphone training, online paperwork, and so on.

The whole interface, its notifications and the sample data are in French.

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Server Components, Server Actions), React 19, TypeScript |
| Database | SQLite via libSQL (`@libsql/client`) — a single local file, no server to install |
| ORM / migrations | Drizzle ORM + Drizzle Kit |
| Auth | bcrypt password hashing (`bcryptjs`, cost 12), signed JWT session (`jose`) in an HttpOnly cookie |
| Validation | Zod, on every server action and API route |
| Styling | Tailwind CSS v4, Atkinson Hyperlegible typeface |

## Getting started

Requires Node.js 20.12 or newer.

```bash
npm install
cp .env.example .env          # then set SESSION_SECRET (see below)
npm run setup                 # applies migrations + loads the French sample data
npm run dev                   # http://localhost:3000
```

### Demo accounts

Every seeded account uses the password `Proxitech2026`.

| Role | E-mail | Good for trying |
| --- | --- | --- |
| Demandeuse (client) | `monique.durand@example.fr` | A pending proposal to accept, a confirmed appointment, an unread message |
| Aidant (helper) | `lucas.martin@example.fr` | The request feed, a pending proposal, past appointments |

Other accounts follow the same `prenom.nom@example.fr` pattern (see `scripts/seed.ts`). All sample members live in Lyon.

## Environment variables

Defined in `.env` (never committed; `.env.example` is the template).

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | yes | libSQL URL. Local file by default: `file:./data/proxitech.db` (relative to the project root) |
| `SESSION_SECRET` | yes | Key used to sign session cookies, 32 characters minimum. Generate one with `openssl rand -base64 48` |

The app refuses to start a session if `SESSION_SECRET` is missing or too short.

## Database commands

| Command | What it does |
| --- | --- |
| `npm run db:migrate` | Applies the SQL migrations in `drizzle/` |
| `npm run db:seed` | Empties every table, then inserts the sample data (10 members, 25 requests, bookings, reviews, conversations) |
| `npm run setup` | `db:migrate` followed by `db:seed` |
| `npm run db:reset` | Deletes the local SQLite file, then migrates and seeds again. Stop the dev server first |
| `npm run db:generate` | Generates a new migration after editing `src/db/schema.ts` |
| `npm run db:studio` | Opens Drizzle Studio to browse the data |

Schema change workflow: edit `src/db/schema.ts` → `npm run db:generate` → `npm run db:migrate`.

## Other scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npm run typecheck` | TypeScript check |

## Features

**Accounts and profiles**
- Registration and login, with two roles chosen at sign-up: *demandeur* (needs help) or *aidant* (offers help).
- Profile with neighbourhood, city, postcode, optional phone number, introduction and (for helpers) skills.
- Privacy by default: other members only see a first name, the initial of the surname and the neighbourhood. The phone number is shown only to the other party of a confirmed appointment.

**Requests and booking**
- A client publishes a request (category, title, description, availability).
- Helpers browse the open requests of their city — their own neighbourhood first — and can filter by category.
- A helper proposes an appointment through the booking dialog: day picker (next 14 days), time slots, duration and an optional note.
- The client accepts one proposal (the others are declined automatically) or declines it. Either party can cancel a confirmed appointment, which reopens the request. Once the appointment time has passed, either party can mark it as done.

**Messaging**
- One conversation per helper and request, opened by a proposal or by "Envoyer un message".
- Chat window with near-real-time updates (polling every 3 seconds), unread counters in the navigation and the conversation list.
- Booking events (proposal, confirmation, cancellation) are posted into the conversation.

**Reviews and grades**
- After a completed appointment, the client can rate the helper from 1 to 5 stars and leave a comment (one review per appointment).
- Helpers earn a grade from their number of completed interventions (thresholds in `src/lib/grades.ts`): Nouvel aidant, Voisin serviable (1), Aidant confirmé (3), Expert du quartier (5), Ange gardien du numérique (10).
- Grade and average rating appear on each proposal a client receives, on the helper's profile and on the landing page.

**Landing page**
- Live figures from the database, top helpers, latest reviews, the grade ladder, recent open requests (no personal data), FAQ and safety advice.

**Branding**
- `public/logo.png` is the official logo (also used for the browser icon via `src/app/icon.png`). `src/components/Logo.tsx` holds a vector version of the emblem for the header.

All appointment times are entered and displayed in the Europe/Paris time zone, wherever the server runs.

## Project structure

```
drizzle/                  SQL migrations (generated)
scripts/                  migrate, seed and reset scripts
src/
  actions/                Server Actions: auth, profile, requests, bookings, messages
  app/
    (auth)/               connexion, inscription
    (app)/                signed-in area: demandes, mes-demandes, rendez-vous, messages, profil
    api/conversations/    JSON endpoint polled by the chat window
    page.tsx              public landing page
  components/             UI components (forms, booking dialog, chat window, header…)
  db/                     Drizzle schema and database client
  lib/                    auth, session, validation schemas, formatting, constants, rate limiting
```

## Security

- Passwords are hashed with bcrypt (cost 12) and never leave the server; the hash is excluded from every user object passed to the UI.
- Sessions are HS256-signed JWTs in an `HttpOnly`, `SameSite=Lax` cookie (also `Secure` in production), valid for 7 days.
- Every server action and API route re-checks the session, the user's role and ownership of the record before reading or writing. Requests, bookings and conversations belonging to other members return a 404.
- All input is validated with Zod on the server; the database is only reached through Drizzle's parameterised queries.
- Login attempts are rate-limited (5 per 15 minutes per e-mail and IP), with a constant-time path and an identical error message for unknown e-mails. Registration and message sending are rate-limited too.
- Server Actions are protected against cross-site requests by Next.js' origin check; security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`) are set in `next.config.ts`.

### Before deploying to production

- The rate limiter is in memory, so it only works for a single server instance. Use a shared store (Redis or similar) if you run several.
- No Content-Security-Policy is set yet.
- SQLite as a local file needs a persistent disk. For serverless hosting, point `DATABASE_URL` at a hosted libSQL database (and extend `src/db/index.ts` to pass its auth token).
- There is no e-mail verification or password-reset flow.

## Accessibility

Designed for senior users and WCAG 2.1 AA, with AAA contrast for body text:

- 18 px base font size, Atkinson Hyperlegible typeface, generous line height.
- Buttons, links and form controls are at least 48 px tall.
- Brand palette: burgundy `#8B0000` for primary actions (about 10:1 on white), soft pink `#FADADD` for surfaces, near-black text on light backgrounds.
- Status is never conveyed by colour alone: badges and notices always carry a text label.
- Semantic landmarks, a skip link, visible keyboard focus, labelled form fields with errors linked through `aria-describedby`, and live regions for notices and new chat messages.
- The booking dialog uses the native `<dialog>` element (focus trap, Escape to close).
- Respects `prefers-reduced-motion`.

## Notes

- `AGENTS.md` is generated by `next dev` (guidance for AI coding assistants about this Next.js version). Set `agentRules: false` in `next.config.ts` to turn it off.
