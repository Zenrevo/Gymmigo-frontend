# Profile / Explore / Clubs / Wallet — feature & endpoint inventory

Every item below exists on the web today (or in the app and is being added). Each must survive the revamp; tick when verified on the rebuilt page.

## Profile & Settings (`/app/profile` — `src/pages/Profile/Profile.tsx`)
- [x] GET `/profile/me` — identity (avatar, name, email, phone, role, city, bio, dob, gender)
- [x] PATCH `/profile/me` — basic details + bio + avatar_url (ImageUpload)
- [x] GET `/profile/me/addresses`, POST `/profile/me/addresses` (MapPickerModal, label/line1/city/state/pincode/lat/lng/is_primary), DELETE `/profile/me/addresses/{id}`
- [x] GET `/profile/fitness`, POST `/profile/fitness` — Migo intelligence profile (goal, activity, experience, height, weights, diet, allergies, injuries, conditions, duration, days/week, notes_for_agent)
- [x] GET `/memberships/dashboard-stats` — streak / sessions
- [x] GET `/memberships/my` — active memberships (+ renew → gym profile)
- [x] GET `/clubs/fitcard/me?gym_id=` — FitCard stats/badges/points
- [x] PremiumFitCard: GET `/clubs/fitness-card/me` (QR payload, code, tier, copy link `/fitness-card/{code}`)
- [x] Followers · following (app) — GET `/social/users/{id}` followers_count / following_count
- [x] Wallet balance (app stat) — GET `/wallet/me`
- [x] Roles: switch (AuthContext.switchRole), trainer "Soon", add role → `/register-role?role=`
- [x] App appearance System/Light/Dark (foundation ThemeProvider)
- [x] Community → people / run-together links
- [x] Devices → `/app/devices` watch guide (new, from app watchGuideContent; "Set up in the Gymmigo app" note)
- [x] Fitness tools: Fitness QR & share, Clubs & badges
- [x] Membership & wallet: memberships, wallet transactions, home location (addresses)
- [x] Account & security, Help & legal (contact, terms, privacy)
- [x] Log out (confirm), Delete account — DELETE `/auth/account` (confirm)
- [x] Social card link (`?social=true&socialTab=profile`) (`?social=true`) — drawer is mock UI in MainLayout; keep link

## Wallet (`/app/wallet-transactions` — WalletTransactionsPage, LoyaltyWalletPanel)
- [x] GET `/wallet/me/transactions` {limit 50, offset} → wallet + transactions; refresh; load more
- [x] Balance, lifetime earned / spent, loaded count, credit count
- [x] Row: direction, description, type, date, balance after, non-completed status, ±amount
- [x] LoyaltyWalletPanel: GET `/wallet/me` + `/wallet/me/transactions` {limit 25}, shop link, refreshKey/notice

## Clubs — not rebuilt yet (still legacy UI, all features intact) (`/app/clubs` — GymmigoClubsPage)
- [ ] GET `/memberships/my`; empty state → Explore
- [ ] Per gym: GET `/clubs/missions?gym_id` (missions + ladder), `/clubs/fitcard/me?gym_id`, `/clubs/reward-claims/my?gym_id`, `/clubs/transfer-options?target_gym_id`, `/clubs/transfer-requests/my`
- [ ] POST `/clubs/task-completions` {gym_id, mission_code, value 1, metadata{source:'clubs_page', category}}
- [ ] POST `/clubs/reward-claims` {gym_id, club_code} (wallet_credited_inr notice)
- [ ] POST `/clubs/transfer-requests` {source_gym_id, target_gym_id, member_note}
- [ ] Gym chooser, highlighted club hero (facilities, paused/protected, comeback, negative marking), journey progress, share WhatsApp/copy/claim
- [ ] Side stats (tier, streak, clubs, days left to protect, progress)
- [ ] Transfer section (eligible, locked < level 5, request statuses)
- [ ] Ladder chips + road cards → detail modal (requirement, tasks, Mark done if self-serve, system copy, benefits, share CTA, goal tracks, protected)
- [ ] FitCard panel (stats, QR share, clicks/leads); unlocked clubs + claim states

## Explore (`/app/discovery` — Discovery.tsx)
- [x] GET `/gyms/` / `/trainers/` {search, page_size 20, sort_by distance|rating, specialization | category in search, lat, lng, radius}
- [x] Tabs gyms/trainers, search, categories, near-me toggle (refreshGPS, info modal `hideDiscoveryNearMeInfo`), radius 1/2/5/10
- [x] Cards: image, distance, live crowd, rating, specializations, address → open in maps, starting price / hourly rate → `/app/gyms/:id`, `/app/trainers/:id`

## Gym profile — not rebuilt yet (`/app/gyms/:id` — GymProfile.tsx)
- [ ] GET `/gyms/{id}`, `/gyms/{id}/workout-stats` (weekly, hourly, best time), `/memberships/reviews/{gymId}`
- [ ] Tabs overview / plans / gallery / amenities / equipment / reviews; lightbox
- [ ] Plans grouped by slot, one plan per slot cart, time slots, entry fee for new members, add-ons, grand total
- [ ] POST `/memberships/apply-cart` {gym_id, plans[{plan_id, selected_addons}], payment_method 'cash'} → dashboard
- [ ] POST `/memberships/reviews` {gym_id, rating, title, review} when can_review
- [ ] Sidebar: location + distance, phone, hours, Google map (dark style)

## Trainer profile — not rebuilt yet (`/app/trainers/:id` — TrainerProfile.tsx)
- [ ] GET `/trainers/{id}`, `/trainer-bookings/reviews/{id}`
- [ ] Hero, certifications, availability, portfolio, reviews, pricing, packages
- [ ] Booking (enable, app parity): 14-day date picker, notes, review → POST `/trainer-bookings/bookings` {trainer_id, package_id, start_date, user_notes}

## Session detail — not rebuilt yet (`/app/sessions/:id` — SessionDetail.tsx)
- [ ] GET `/trainer-bookings/sessions/{id}`; POST `/trainer-bookings/sessions/{id}/cancel` (confirm)
- [ ] Status, date/time/progress, static map + directions, other party, notes

## Out of scope (other areas)
- MembershipDetailView (Home area), SocialHubDrawer (layout), people/follow pages (Community area)

## Notes
- LoyaltyWalletPanel (Clubs) unchanged. "My memberships" links to Home until a memberships page exists. Map on Explore needs VITE_GOOGLE_MAPS_API_KEY; shows a placeholder otherwise.
