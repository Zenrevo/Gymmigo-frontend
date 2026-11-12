# Owner and trainer portal inventory

This is everything the gym-owner and trainer parts of the web portal do today. The restyle must keep every item, and each one gets ticked when its restyled version is verified. Endpoints are listed against `src/api/owner.ts` and `src/api/trainer.ts`. The app column points at the screen in `Gymmigo-app/src/screens` that sets the layout to match.

## Owner home (`/app/dashboard`, active role is gym_owner or gym_manager), app: `home/owner/OwnerHome.tsx`

- [ ] **Portfolio stats:** gym count, active members, revenue this month (MTD), summed over `GET /gym-owner/gyms` (`ownerApi.listGyms`).
- [ ] **"Your gyms" list:** a card per gym with status (active or inactive), metrics, and a link to `/app/gym-owner/gyms/:id`.
- [ ] **Add gym:** a link to `/app/gym-owner/add-gym`; the empty state is a "List your gym" hero.
- [ ] **Growth command centre / "Do this first":** growth signals.
- [ ] **Recent reviews:** `GET /gym-owner/gyms/reviews` (`ownerApi.ownerReviews`), linking to the gym's Reviews tab.
- [ ] **Insights (`GymOwnerInsights`):**
  - gym picker;
  - `GET /gym-owner/gyms/:id/dashboard-analytics`, with the month-to-date revenue breakdown and today's estimated traffic (live);
  - at-risk members with a WhatsApp message button;
  - Broadcast and Flash sale (promo) actions.
- [ ] **Managers:** a gym manager sees "assigned gyms" and no Add gym.

## Add gym (`/app/gym-owner/add-gym`), app: `owner/AddGymScreen.tsx`

- [ ] **Multi-step form** with step state:
  - **Basic info:** name, category, short description, about, established year, max capacity, open 24 hours.
  - **Contact:** person, phone, email.
  - **Location:** map picker (`MapPickerModal`) plus Google autocomplete, shown as "Verified location".
  - **Amenities:** chips.
  - **Equipment inventory:** machine name and quantity.
  - **Facilities.**
- [ ] **Submit:** `POST /gym-owner/gyms` (`ownerApi.createGym`), then open the new gym's manage page.

## Gym manage shell (`/app/gym-owner/gyms/:gymId`), app: `owner/GymHubScreen.tsx`

- [ ] **`GymContext`:** `GET /gym-owner/gyms/:id` (`ownerApi.getGym`) with the `{gym}` or bare unwrap; `refreshGym` for children.
- [ ] **Header:** gym name, active or inactive badge, "Back to portfolio", and a "Gym not found" state.
- [ ] **Sub-nav, 14 tabs:** Overview, Members, Clubs, Plans, Equipment, Schedule, Amenities, Gallery, Reviews, Settings, Finance, Stats, Team, Leads, plus the Coming soon route.

### Overview

- [ ] **Stat tiles:** members in the gym today, total occupancy, active plans, equipment types, average rating, total reviews.
- [ ] **Check-in QR:** `GET .../daily-qr` (`ownerApi.dailyQr`), the permanent check-in code, Download QR, Fullscreen QR.
- [ ] **Shortcuts:** Manage schedule, Member database.

### Members (largest tab), app: `owner/members/*`

- [ ] **List:** `GET .../members` with search (name or phone), a status filter (active, pending, expired, cancelled, suspended) and pagination (Prev/Next).
- [ ] **Columns:** member, plans, visits, gym status (in or out), action.
- [ ] **Quick check-in / check-out:**
  - `POST .../users/:userId/check-in` and `POST .../users/:userId/check-out`;
  - a member search field;
  - a "Currently in gym" marker.
- [ ] **Member detail drawer:** `GET .../members/:userId`.
  - Profile: full name and phone.
  - Active and past subscriptions, add-ons, remaining visits.
  - Engagement: total check-ins, total visits, streak, today's score, week goal, global rank, focus.
  - A Migo AI retention nudge, plus a message button.
- [ ] **Pending requests:** accept and reject (`POST .../members/:membershipId/accept|reject`).
- [ ] **Cancel subscription:** `POST .../members/:membershipId/cancel`, with a confirmation.
- [ ] **Edit membership and member info:** `PATCH .../members/:membershipId`, covering plan, start and end dates, auto renew, remaining visits ("Blank for unlimited"), and status.
- [ ] **Enrol new member:** `POST .../members/enroll`.
  - Fields: phone (10 digits), name, plan, add-ons, start date, end date ("Auto from plan"), amount paid.
  - Payment method: Cash, UPI, Card or Bank transfer.
- [ ] **Excel import:** `POST .../members/import` (multipart), with the "Excel import summary" dialog.
- [ ] **Export:** `GET .../members/export` (blob download).
- [ ] **Attendance log:** `GET .../attendance`, with the "No attendance records" empty state.
- [ ] **Create invoice from a member:** a link into Finance.

### Clubs (loyalty engine), app: `owner/OwnerClubsScreen.tsx`

- [ ] **Configs:** `GET /clubs/gyms/:id/club-configs`, the Fitness clubs / Loyalty engine header, and the Migo AI hint.
- [ ] **Setup wizard:**
  - Step 1, Quick setup: primary goal, "Build your retention journey".
  - Step 2, Timeline review: tasks and rewards per tier.
  - Step 3, Publish to members: `POST .../club-configs/publish-batch`.
- [ ] **Tier editor (`ClubTierEditModal`):** includes the comeback mission.
- [ ] **Operations panel:**
  - active club members: `GET .../club-memberships`, with removal through `PATCH .../club-memberships/:id`;
  - transfer requests: `GET .../transfer-requests?status=pending`, with approve or reject through `PATCH .../transfer-requests/:id`;
  - reward claims: `GET .../reward-claims?status=claimed` and `PATCH .../reward-claims/:id`.

### Plans, app: `owner/plans/PlansScreen.tsx`

- [ ] **Two sub-tabs:** membership plans and add-on services, each with "Create first" empty states.
- [ ] **Plan form:**
  - name, price, duration type (Daily, Weekly, Monthly, Quarterly, Half yearly, Annual, Day pass, One-time/visit);
  - description;
  - access time slots, with a days picker (Select days) and start and end times;
  - "Highlight as popular".
- [ ] **Plan create, update, delete:** `POST`, `PATCH` and `DELETE .../plans`, with the "Delete plan" confirmation.
- [ ] **Add-on create, update, delete:** the same three calls on `.../addons`, with the "Delete service" confirmation.

### Equipment

- [ ] **Two sub-tabs:** equipment and facilities.
- [ ] **Equipment:** category (Cardio, Strength, Free weights, Functional, Stretching, Other), quantity and description. `POST`, `PATCH` and `DELETE .../equipment`, with the "Remove equipment" confirmation.
- [ ] **Facilities:** "Included in standard membership" and description. `POST`, `PATCH` and `DELETE .../facilities`, with the "Remove facility" confirmation.

### Schedule

- [ ] **Operating hours per day:** edit, Closed, Not set. `POST .../hours`.
- [ ] **Traffic heatmap analysis:** "Update traffic estimate" per day and hour (occupancy %). `POST .../busy-hours`.

### Amenities

- [ ] **Active amenities:** chips, plus "Add custom". `POST` and `DELETE .../amenities`.

### Gallery

- [ ] **Photos:** "Upload photo" (R2 or Cloudinary upload utils), then `POST .../images`, with Delete.
- [ ] **Videos:** "Add video tour", `POST .../videos`, with Delete.
- [ ] **Primary image:** "Set as primary display image".

### Reviews

- [ ] **List:** `GET /memberships/reviews/:gymId?sort_by=newest&page=1&page_size=50`, the overall score, and the "No reviews yet" empty state.
- [ ] **Reply:** "Your response" via `POST /memberships/reviews/:reviewId/respond`.

### Settings, app: `owner/settings/SettingsScreen.tsx`

- [ ] **Basic info:** gym name, description, established year, contact phone. `PATCH .../basic-info`.
- [ ] **Gym media:** logo and cover, `PATCH .../media`.
- [ ] **Operations and capacity:** maximum capacity, `PATCH .../capacity`.
- [ ] **Location:**
  - city and state, pincode, current pin location;
  - map picker;
  - `POST` or `PATCH .../addresses`.
- [ ] **Performance stats:** a "Show dashboard stats" toggle.

### Finance, app: `owner/finance/*`

- [ ] **Month selector:** `GET .../finance/summary`, showing revenue (incoming funds), expenses (operating costs) and net profit (after all deductions).
- [ ] **Invoices:**
  - list from `GET .../invoices`, with an empty state;
  - Generate new invoice: member search via `GET .../members`, invoice items (membership, service, merchandise, supplement, product), grand total, then `POST .../invoices`;
  - status changes (cancel or mark paid) through `PATCH .../invoices/:id/status?status=`;
  - Email the invoice: `POST .../invoices/:id/send-email`;
  - Download PDF.
- [ ] **Expenses:**
  - list from `GET .../expenses`, with an empty state;
  - add: category (Rent, Electricity, Staff salary, Maintenance, Marketing, New equipment, Other), amount, expense date and notes, via `POST .../expenses`.
- [ ] **Products:** `GET .../products`; "Create new product/service" via `POST .../products`, with an empty state.

### Stats

- [ ] **Gym analytics:** `GET /gyms/:id/workout-stats`, "Historical occupancy and workout patterns", an hourly distribution per day (day picker) and insights. Empty state: "No workout data available yet".

### Team

- [ ] **Authorized managers:** `GET .../managers`, showing name and role (Creator or Co-owner/Manager), contact information and the date added.
- [ ] **Add team member:** name, phone, email, via `POST .../managers`. New users are asked to sign up.
- [ ] **Remove a co-owner:** `DELETE .../managers/:userId`, with a confirmation.
- [ ] **Team access policy:** an info card (full system access, secure access).

### Leads

- [ ] **FitCard referral leads (growth loop):** `GET /clubs/gyms/:id/referral-leads?…` with filters; status and next follow-up through `PATCH .../referral-leads/:id`; the "No referral leads yet" empty state.

## Trainer portal (`/app/dashboard`, active role is trainer → `TrainerDashboard`), app: `home/trainer/TrainerHome.tsx` and `trainer/manage/*`

- [ ] **Data loading:** `GET /trainer`, `GET /trainer/dashboard`, `GET /trainer-bookings/bookings/my?role=trainer`, `GET /trainer-bookings/sessions/my?role=trainer`, `GET /trainer-bookings/reviews/:trainerId`, `GET /trainer/gallery`.
- [ ] **Stats:** today's earnings, this month, sessions, bookings, rating, total reviews, active clients.
- [ ] **Availability toggle:** `PATCH /trainer/toggle-availability`.
- [ ] **Sub-tabs:** Overview, Sessions, Bookings, Clients, Profile settings.
- [ ] **Session management:**
  - today's sessions, with a "No sessions scheduled for today" empty state;
  - pending review;
  - accept or reject via `POST /trainer-bookings/sessions/:id/accept|reject`;
  - full schedule.
- [ ] **Booking management:** recent purchases, "View all bookings", and booking detail.
- [ ] **My clients:** client list, a "No clients found yet" empty state, and a selected-client detail.
- [ ] **Service packages:**
  - a "Create first package" empty state;
  - `CreatePackageModal`: package type and description, `POST /trainer/packages`.
- [ ] **Pricing & service info (`TrainerPricingSettingsModal`):** reads `GET /trainer/full`, saves with `PATCH /trainer`, includes "Rates are negotiable".
- [ ] **Professional details (`TrainerProfessionalSettingsModal`):** years of experience, level (Beginner to Expert), languages spoken, brief bio. Saves with `PATCH /trainer`.
- [ ] **Weekly schedule (`TrainerScheduleModal`):** per day, available or off, time slots, and session mode (online only, in person only, or both). `POST /trainer/availability` per day.
- [ ] **Professional certifications (`AddCertificationModal`):** `POST /trainer/certifications`.
- [ ] **Location settings:** "Pin working address" (map), then `PATCH /trainer`.
- [ ] **Portfolio gallery:** `POST /trainer/gallery` and `DELETE /trainer/gallery/:id`.
- [ ] **Reviews:** "Your response".

## Shared modals

- [ ] **`BookingDetailModal`** (member booking view, used from member home):
  - booking summary: amount paid, balance, completion rate, location details with Open maps;
  - session history from `GET /trainer-bookings/sessions/my?trainer_id=`, with a "No sessions recorded" empty state;
  - Schedule new session: date and available slots from `GET /trainers/:id/available-slots`, session type, then `POST /trainer-bookings/bookings/:id/schedule-session`;
  - cancel a session: `POST /trainer-bookings/sessions/:id/cancel`.
- [ ] **`QRScannerModal`** (member check-in):
  - scan the gym QR with html5-qrcode, then `POST /memberships/check-in`;
  - workout type selection;
  - today's AI recommendations from `GET /ai/recommendations`;
  - checkout confirmation;
  - the "Check-in failed" state.
