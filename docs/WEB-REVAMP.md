# Web portal revamp: match the mobile app

Branch: `feature/web-revamp-v2`. **Web only.** Never edit `Gymmigo-app` or the backend from this work. Read them for reference only:
- the app: `/home/user/Gymmigo-app`
- the backend: `/home/user/gymmigo-backend`

## Goal

The web portal should look and work like the Gymmigo app, with the same design system and the same features and flows wherever a browser can support them. It should work on desktop (sidebar layout) and on phone browsers (bottom tab bar, like the app).

## Design system: Obsidian Kinetic

Copy the tokens from the app; don't invent new ones.

- **Sources:** `Gymmigo-app/src/theme/tokens.ts` (palette, spacing, radii, type scale, fonts) and `themes.ts` (light and dark semantic colours).
- **CSS variables:** map the tokens to CSS variables on `:root` (light) and `[data-theme="dark"]`, and expose them to Tailwind v4 through `@theme`. The colour names are `background`, `surface`, `surface-raised`, `surface-sunken`, `border`, `border-strong`, `text`, `text-muted`, `text-subtle`, `accent` (#FF5722 ignite), `accent-soft`, `accent-text`, `on-accent`, `success`, `warning`, `danger`, `info` plus their soft variants, and `overlay`.
- **Theme switch:** System / Light / Dark, the same as the app's Profile → App appearance. It's stored in `localStorage` and defaults to System (`prefers-color-scheme`).
- **Fonts:** Epilogue (display and headings, ExtraBold/Bold) and Inter (UI), both from Google Fonts. The type scale mirrors the app's `typography`: display, h1, h2, title, subtitle, body, callout, footnote, caption, label (uppercase, tracked), metric.
- **UI kit:** `src/components/kit/`. Each component mirrors the app component of the same name:
  - `AppBar` / `PageHeader`
  - `Button` (primary, secondary, ghost and danger; sm, md and lg; loading state; icon left or right)
  - `IconButton`
  - `Card`, plus `SignatureCard`: the dark card with the ember glow
  - `ListItem` (Settings-style row: icon, title, subtitle, right slot, chevron) and `ListGroup`
  - `Badge` and `Tag`
  - `SegmentedControl`
  - `StatTile`
  - `Avatar`: image or initials, with a coloured ring
  - `Toggle`, `Checkbox`, `TextField`, `OtpInput`, `DateField` and `TimeField`
  - `Sheet`: a dialog on desktop and a bottom sheet on mobile, with no keyboard problems on the web
  - `Dialog` / `ConfirmDialog`
  - `Toast` (reuse the existing context)
  - `Skeleton`
  - `EmptyState` / `ErrorState`
  - `ProgressSteps`
  - `SectionHeader`
  - `BarChart` (SVG)
  - `ProgressRing`
  - `Meter`
- **Icons:** lucide-react is already installed; use the closest lucide equivalents of the app's Hugeicons.
- **Retire the old look:** remove the old slate and glass styling (`glass-card`, `#0F172A` backgrounds) as pages are rebuilt. Keep the existing Google Maps autocomplete styling, re-themed.

## Shell and navigation

These mirror the app's `MainTabs`, by role.

| Role | Tabs (mobile bottom bar / desktop sidebar) | Extra sidebar items (desktop) |
|---|---|---|
| Member (`user`) | Home · Explore · Migo · Plan (calendar) · Clubs | Activity, Run together, People, Profile |
| Gym owner | Home (owner dashboard) · Explore · Migo · Plan · Clubs | My gyms, Profile |
| Trainer | Home · Explore · Manage · Profile | Profile |

- The header holds the location selector, the avatar menu (Profile, role switch, theme, log out) and notifications.
- Below 768 px wide, the layout switches to the app style: a bottom tab bar with Migo as the centre raised button.

## Flows to match the app

1. **Auth and onboarding:**
   - Steps: Welcome → Phone entry (with the Terms and Privacy checkbox) → OTP (6 boxes, resend timer) → Role select (Member, Trainer marked coming soon, Gym owner) → Profile details → Location step (members) → Dashboard.
   - Owners go from Profile details to Add gym.
   - Existing endpoints: `/auth/send-otp`, `/auth/verify-otp`, `/auth/register-role` or `/auth/add-role`, `/profile/me`, `/profile/me/addresses`.
   - Same validation and copy as the app.
2. **Member Home:** a **Gym | Sports** switch, remembered per browser.
   - **Gym mode:** the existing dashboard content, restyled: passes, check-in status, today's focus, coach packs, club perks, plus the gym analytics card.
   - **Sports mode:**
     - This week's distance, active time, activity count and calories.
     - Quick links: Run · Walk · Ride. On the web these show a "Track with the Gymmigo app" card with store links and a QR code, because GPS tracking is app-only.
     - The Run Club card.
     - Charts: weekly distance over 8 weeks, time per sport this month, and the run pace trend.
     - Recent activities, from the `/runs` list.
     - Share today.
   - Data comes from the endpoints in `Gymmigo-app/docs/revamp/07-RUN-TRACKING-API.md`.
3. **Activity:**
   - **`/app/activity`:** the Activity hub, with history (filter by type), totals and the same charts.
   - **`/app/activity/:id`:** run detail with a Google Maps route (dark style in dark theme), stats, splits, laps if present, and Delete.
   - **Share:**
     - Create a share link with `POST /shares` and copy it.
     - Download a card PNG drawn with canvas or SVG, using the app's share-card designs: route, story, stats.
     - WhatsApp and X web-intent links.
4. **Run together** (`08-RUN-ROOMS-AND-SOCIAL-API.md`):
   - **Hub:** the Run Club card, create a room (live or open, with an end time), join by code, invites, my rooms.
   - **Room pages:**
     - Lobby: code, share, invite people, members, and Start for the host.
     - Live and anytime map (Google Maps): avatar markers and coloured trails per session, a day switcher for the club, the leaderboard, cheers, and the "Joined" members page.
     - Web users join as **spectators** or watch the club. To run, they use the app, and a CTA says so.
     - Polling every 3 s with the `since` cursor, matching the app's `roomLogic`. Port the pure helpers.
   - **Deep link:** `/app/run-room/:code`.
5. **People:**
   - Find people (search), user profile card (follow, counts), followers, following and friends.
   - Deep link: `/app/u/:userId`.
6. **Migo:**
   - **Coach chat:**
     - Streaming via `/ai/chat/stream` if the current page uses it, otherwise `/ai/chat`.
     - The message box stays fixed at the bottom of the screen.
     - Quick consultations.
     - Image attach, with the existing upload.
   - **Markdown:** use the app's renderer rules: tables as row cards, `[METER:x/10:Label]` as a score bar, `Totals: a | b` as chips, `![alt](url)` images, headings, lists, bold and italic, and links that are safe and ask before opening external sites. Port `Gymmigo-app/src/components/migo/markdownBlocks.ts` (pure) plus its rendering.
   - Exercise demo GIFs and the YouTube strips.
   - **Training Plans tab = Programs** (`10-PLAN-PROGRAMS.md`): Your plans (active progress ring, drafts, past) → New plan form → Review (summary, phases, first week, week-by-week; Approve & add to calendar, Change it, Discard) → Plan detail (days, remove a day, reminder time, remove plan) → Log day (Done/Partly/Skipped, RPE, notes).
   - **Reminders:** browsers can't schedule them reliably, so show the reminder time and note that the app sends them.
7. **Plan (calendar):** the existing calendar restyled. Program days are labelled with the program name, and uncompleted days can be removed.
8. **Profile and Settings:** mirror the app's Profile screen sections:
   - identity card with follower counts;
   - FitCard pass;
   - Migo co-pilot;
   - memberships;
   - App appearance (theme);
   - Community: Find people, Run together;
   - Fitness tools;
   - Membership & wallet;
   - Gym ecosystem role (switch or add a role);
   - Devices: a "Connect your watch" guide page, with the same content as the app's `watchGuideContent.ts`, saying it's done in the app;
   - Account & security;
   - Help & legal;
   - Log out;
   - Delete account.
9. **Explore and gym or trainer profiles, Clubs, Wallet:** restyle with the kit and keep every feature.
10. **Gym owner and trainer dashboards:** restyle with the kit (tabs become a `SegmentedControl` or sidebar sub-nav, and tables and cards use kit styling), keeping every feature and endpoint.
11. **Shared links:** `/s/:token` is served by the backend. Add an in-app viewer at `/app/shared/:token`, using the public `GET /shares/{token}`, for signed-in users.

Keep every existing route working: redirect old paths to new ones where they move. Don't drop any existing feature or endpoint call.

## Code conventions

- **API modules:** `src/api/<domain>.ts` with typed functions built on the existing axios `api` (envelope `{success, data, error}`), plus TanStack Query hooks in `src/hooks/`. Port the types from the app's `src/services/endpoints/*` and `src/types/*`.
- **Pure logic:** port it as is, with its tests: run maths and format helpers, room logic, markdown blocks, activity analytics and program progress. Add **Vitest** for these.
- **Responsiveness:** test pages at 390 px and 1440 px wide, in light and dark.
- **Lint and build:** `npm run lint` and `npm run build` must pass. On this Linux machine `npm ci` needs the Linux native packages installed with `--no-save`: `@rolldown/binding-linux-x64-gnu`, `lightningcss-linux-x64-gnu` and `@tailwindcss/oxide-linux-x64-gnu`, at the versions in `node_modules`. Don't change `package-lock.json` for that.

## Verification

- **Real backend:** `cd /home/user/gymmigo-backend && E2E_KEEP=1 scripts/e2e.sh` leaves a real API and PostgreSQL running; the script prints the URL. Run the web portal against it with `VITE_API_URL=<that>/api/v1 npm run dev`. Sign in with the review phone 1234567890 and OTP 123456.
- **Browser runs:** drive pages with Playwright, using Chromium at `/opt/pw-browsers/chromium`. Take screenshots into `docs/web-previews/<area>/`, at desktop 1440×900 and mobile 390×844, light and dark, and look at them.
- **Flow tests:** `e2e/` (Playwright test) covers sign-in, onboarding, Home Gym/Sports, Activity detail, Run Club spectate, rooms create/join, follow, Migo plan create → approve → log day, and profile theme switching.
