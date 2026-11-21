/**
 * Gymmigo Clubs — public, member-facing content. Numbers mirror the platform's club template defaults
 * (one template for every gym). Rewards and coin offers are set by each gym within these limits.
 */

export type ClubPage = { path: string; label: string; short: string; title: string; description: string };

export const CLUB_PAGES: ClubPage[] = [
  { path: '/clubs', label: 'Overview', short: 'Overview', title: 'Gymmigo Clubs: progress you can see, rewards you earn',
    description: 'Gymmigo Clubs turns your workouts, habits and consistency into Club Points, eight club levels and rewards from your gym.' },
  { path: '/clubs/levels', label: 'Club levels', short: 'Levels', title: 'The 8 Gymmigo club levels',
    description: 'From Starter to Immortal: Club Point thresholds, what each level unlocks and how you keep your level.' },
  { path: '/clubs/points', label: 'Club Points & missions', short: 'Points', title: 'Club Points and daily missions',
    description: 'How you earn Club Points: personal daily missions, weekly challenges, difficulty bands, fair daily and weekly limits.' },
  { path: '/clubs/performance-index', label: 'Performance Index', short: 'GCPI', title: 'Club Performance Index and multipliers',
    description: 'The GCPI equation, its six dimensions, the streak score and the 1× to 4× multiplier table, with a calculator.' },
  { path: '/clubs/fair-play', label: 'Fair play & Shield', short: 'Fair play', title: 'Fair play, penalties and Club Shield',
    description: 'Weekly compliance, the capped penalty equation, how downgrades work, protections for illness or travel, and Club Shield.' },
  { path: '/clubs/rewards-and-coins', label: 'Rewards & Migo Coins', short: 'Rewards', title: 'Club rewards and Migo Coins',
    description: 'How gyms offer rewards by club level, what a Migo Coin is worth, coin types, cashback, limits and expiry.' },
  { path: '/clubs/migo-passport', label: 'Migo Passport', short: 'Passport', title: 'Migo Passport: take your progress to any Gymmigo gym',
    description: 'What moves with you when you change gyms, how your level is set at the new gym and how to restore it.' },
  { path: '/clubs/glossary', label: 'Glossary & FAQ', short: 'Glossary', title: 'Gymmigo Clubs glossary and FAQ',
    description: 'Every Gymmigo Clubs term explained: CP, Lifetime and Active CP, GCPI, multiplier, compliance, Club Shield, Migo Coins, Passport.' },
];

export const LEVELS = [
  { level: 1, name: 'Starter', cp: 0, feel: 'Foundation, habit formation and introductory challenges.', unlocks: 'Welcome badge, basic challenges, introductory partner offers.' },
  { level: 2, name: 'Consistent', cp: 2000, feel: 'Recognised regular participation.', unlocks: 'Guest pass eligibility, streak recognition, basic gym coupons.' },
  { level: 3, name: 'Committed', cp: 6000, feel: 'Sustained engagement and broader rewards.', unlocks: 'Renewal offers, fitness assessment, a wider reward catalogue.' },
  { level: 4, name: 'Athlete', cp: 14000, feel: 'Progression, personal insights and advanced challenges.', unlocks: 'Advanced analytics, PT trial or class offers, priority challenges.' },
  { level: 5, name: 'Elite', cp: 28000, feel: 'Premium engagement and services.', unlocks: 'Premium reward catalogue, trainer priority offers, exclusive events. Club Shield starts here.' },
  { level: 6, name: 'Champion', cp: 45000, feel: 'Advanced recognition.', unlocks: 'Higher-tier rewards, special classes and partner offers.' },
  { level: 7, name: 'Legend', cp: 70000, feel: 'Exclusive experiences.', unlocks: 'Limited merchandise, VIP events, premium gym privileges.' },
  { level: 8, name: 'Immortal', cp: 100000, feel: 'The highest recognition.', unlocks: 'The top reward tier, premium gifts and exclusive experiences.' },
];

export const DIMENSIONS = [
  { key: 'C', name: 'Consistency & streak', weight: 0.25, what: 'How well you keep to your own plan, plus how many qualifying weeks in a row you have.' },
  { key: 'P', name: 'Personal improvement', weight: 0.2, what: 'Progress against your own starting point and goal — not against anyone else.' },
  { key: 'H', name: 'Challenge performance', weight: 0.2, what: 'Harder missions and weekly challenges you complete.' },
  { key: 'B', name: 'Lifestyle balance', weight: 0.15, what: 'Nutrition habits, daily movement and balanced routines.' },
  { key: 'R', name: 'Recovery & discipline', weight: 0.1, what: 'Sleep, rest days and sustainable training. Rest counts.' },
  { key: 'E', name: 'Engagement & contribution', weight: 0.1, what: 'Group runs, community, trainer-verified achievements and bringing friends.' },
] as const;

export const STREAK_TABLE = [
  { weeks: '0–3', s: 20, min: 0 }, { weeks: '4–12', s: 40, min: 4 }, { weeks: '13–25', s: 60, min: 13 },
  { weeks: '26–51', s: 80, min: 26 }, { weeks: '52–103', s: 90, min: 52 }, { weeks: '104+', s: 100, min: 104 },
];

export const MULTIPLIERS = [
  { range: '0–39', min: 0, x: 1.0, label: 'Foundation' }, { range: '40–49', min: 40, x: 1.1, label: 'Developing' },
  { range: '50–59', min: 50, x: 1.2, label: 'Improving' }, { range: '60–69', min: 60, x: 1.35, label: 'Good' },
  { range: '70–79', min: 70, x: 1.5, label: 'Strong' }, { range: '80–87', min: 80, x: 1.75, label: 'Advanced' },
  { range: '88–92', min: 88, x: 2.0, label: 'Excellent' }, { range: '93–96', min: 93, x: 2.5, label: 'Exceptional' },
  { range: '97–98', min: 97, x: 3.0, label: 'Elite' }, { range: '99–100', min: 99, x: 4.0, label: 'Extraordinary' },
];

export const DIFFICULTY = [
  { level: 'Easy / micro', cp: '5–10', examples: 'Short walk, mobility, hydration, a simple habit.' },
  { level: 'Moderate', cp: '15–20', examples: 'Planned workout, meal plan, a meaningful activity target.' },
  { level: 'Challenging', cp: '25–35', examples: 'A personal workout milestone or a multi-step lifestyle challenge.' },
  { level: 'Advanced', cp: '40–50', examples: 'High-effort but safe challenge matched to your experience and readiness.' },
  { level: 'Weekly mission', cp: '75–150', examples: 'A multi-day challenge, e.g. train on your planned days this week.' },
];

export const CAPS = { daily: 120, weekly: 600, categories: [['Workout', 60], ['Nutrition', 30], ['Activity', 30], ['Recovery', 30], ['Challenge', 50]] as [string, number][] };

export const SOURCES = [
  { source: 'Verified daily missions', treatment: 'Earn CP, multiplied by your GCPI multiplier (within limits).' },
  { source: 'Workouts and gym sessions', treatment: 'Earn CP through your missions, multiplied.' },
  { source: 'Nutrition and lifestyle missions', treatment: 'Earn CP with category limits, multiplied.' },
  { source: 'Weekly missions and challenges', treatment: 'Earn CP, multiplied.' },
  { source: 'Badges and one-time milestones', treatment: 'Fixed CP, not multiplied.' },
  { source: 'Referral bonuses and promotions', treatment: 'Not multiplied (promotions only if clearly announced).' },
  { source: 'Purchases and Migo Coins', treatment: 'Never turn into CP — coins are a separate balance.' },
  { source: 'Corrections by Gymmigo', treatment: 'Not multiplied; always explained in your history.' },
];

export const SEVERITY = [
  { week: '1st week below 60%', s: '0×', response: 'A friendly warning and an easier plan. No points lost.' },
  { week: '2nd week in a row', s: '0.5×', response: 'A small deduction and a recovery plan.' },
  { week: '3rd week in a row', s: '1.0×', response: 'A higher deduction, still within your club cap.' },
  { week: '4th week in a row', s: '1.5×', response: 'More support and a downgrade warning.' },
  { week: '5th week onwards', s: '2.0×', response: 'Maximum severity — still capped.' },
];

export const LOSS_CAPS = [
  { clubs: 'Levels 1–2', pct: '2.00%' }, { clubs: 'Levels 3–4', pct: '1.50%' }, { clubs: 'Levels 5–6', pct: '1.00%' },
  { clubs: 'Level 7', pct: '0.75%' }, { clubs: 'Level 8', pct: '0.50%' },
];

export const SHIELD = [
  { clubs: 'Levels 1–4', interval: 'No automatic shield — standard grace and recovery apply', max: 0 },
  { clubs: 'Level 5 · Elite', interval: 'After 120 qualifying days', max: 1 },
  { clubs: 'Level 6 · Champion', interval: 'After 90 qualifying days', max: 1 },
  { clubs: 'Level 7 · Legend', interval: 'After 75 qualifying days', max: 1 },
  { clubs: 'Level 8 · Immortal', interval: 'After 60 qualifying days', max: 1 },
];

export const COIN_CEILINGS = [25, 50, 75, 100, 150, 200, 300, 500];
export const CASHBACK = ['0.25%', '0.50%', '0.75%', '1.00%', '1.25%', '1.50%', '1.75%', '2.00%'];

export const COIN_TYPES = [
  { name: 'Gym Coins', from: 'Your gym', use: 'That gym’s eligible services and offers.', moves: 'Stay with the gym that gave them.' },
  { name: 'Universal Migo Coins', from: 'Gymmigo', use: 'Approved Gymmigo network offers.', moves: 'Coming later.' },
  { name: 'Partner Coins', from: 'A named brand', use: 'That partner’s eligible products or services.', moves: 'Coming later.' },
];

export const REWARD_TYPES = [
  { family: 'Percentage discount', example: '5% off an eligible renewal, up to a rupee limit.' },
  { family: 'Fixed discount', example: '₹200 off an eligible purchase above a minimum spend.' },
  { family: 'Complimentary service', example: 'A free fitness assessment or class.' },
  { family: 'Experience', example: 'A guest pass for a friend or event entry.' },
  { family: 'Personal training', example: 'A PT trial or discounted session.' },
  { family: 'Product or partner', example: 'Discounts on merchandise, nutrition or fitness products.' },
];

export const PASSPORT_MOVES = [
  ['Your Gymmigo account and identity', 'Moves with you'],
  ['Lifetime CP', 'Moves with you'],
  ['Badges and achievements', 'Moves with you'],
  ['Workout, running and fitness history', 'Moves with you (with your consent)'],
  ['Your streak', 'Protected for 14 days while you settle in'],
  ['Club Shield', 'One shield can travel with you as a transfer protection'],
  ['Your level at the new gym', 'Set from your verified level (see below)'],
  ['Gym Coins, coupons and rewards from your old gym', 'Stay with the old gym under its terms'],
];

export const GLOSSARY: [string, string][] = [
  ['Club Points (CP)', 'Points you earn for verified missions, challenges and milestones. CP measures progress — it is not money.'],
  ['Lifetime CP', 'Your permanent total. It only ever goes up and moves with you between gyms.'],
  ['Active CP', 'Your current balance at a gym. It decides your club level there and can drop slightly under fair-play rules.'],
  ['Club level', 'One of 8 levels from Starter to Immortal, reached by Active CP plus a promotion review.'],
  ['Mission', 'A personal daily task (up to 3 core + 1 bonus) or a weekly challenge, with points, a deadline and how it is verified.'],
  ['GCPI', 'Gymmigo Club Performance Index: a 0–100 score of your last 28 days across six dimensions.'],
  ['Multiplier', 'Set by your GCPI, from 1× to 4×. It multiplies the CP you earn in the next 28 days.'],
  ['Qualifying week', 'A week where you completed at least 60% of your core missions. Streaks are counted in qualifying weeks.'],
  ['Weekly compliance (W)', 'The share of your core missions completed in a week. Optional and protected days don’t count.'],
  ['Review', 'Every 28 days: your GCPI, next multiplier and level maintenance are worked out and explained.'],
  ['Club Shield', 'Earned protection from level 5 that blocks one downgrade review. You can hold one at a time.'],
  ['Protection', 'Approved illness, injury, travel, membership freeze, gym closure or app outage days — they never count against you.'],
  ['Migo Coin', 'A loyalty credit worth ₹1 of eligible redemption value under its sponsor’s terms. Not cash.'],
  ['Gym Coins', 'Coins funded by your gym, usable at that gym.'],
  ['Sponsor', 'Whoever funds a coin or reward — your gym, Gymmigo or a partner brand.'],
  ['Migo Passport', 'Your portable Gymmigo identity: Lifetime CP, badges and history travel with you to any Gymmigo gym.'],
];

export const CLUB_FAQS = [
  { q: 'Do I need to work out every day?', a: 'No. Missions follow your own plan, including rest days. A qualifying week is about keeping to your plan, not daily workouts.' },
  { q: 'Can I lose my level for missing one week?', a: 'No. The first weak week is only a warning. A downgrade needs repeated weak 28-day reviews, after a grace period, a recovery plan and any Club Shield you hold.' },
  { q: 'Will I ever lose Lifetime CP?', a: 'Never. Fair-play deductions only touch Active CP, and they are capped by your level.' },
  { q: 'What if I am ill, injured or travelling?', a: 'Ask for a protection in the app. Approved days are left out of your targets, and gym closures or app outages never count against you.' },
  { q: 'Are Migo Coins cash?', a: 'No. One coin reduces an eligible purchase by ₹1 under its sponsor’s terms. Coins can’t be withdrawn, topped up or sent to someone else.' },
  { q: 'Is every reward the same at every gym?', a: 'No. The level rules are the same everywhere, but each gym chooses its own rewards, limits and offers.' },
  { q: 'What happens when I change gyms?', a: 'With Migo Passport your Lifetime CP, badges and history move with you. Your level at the new gym starts one level lower and is restored after 30 days of keeping your plan (same level for gyms in one chain).' },
  { q: 'How do I see why my points changed?', a: 'Every CP change in your history shows the mission or reason, the multiplier and any limit that applied. You can appeal anything that looks wrong.' },
];
