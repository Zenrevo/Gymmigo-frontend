import type { ShotName } from '../../components/marketing/Shot';

export const SHOP_URL = 'https://shop.gymmigo.in';
export const WHATSAPP_PHONE = '917208221615';
export const CONTACT_EMAIL = 'official.zenrevo@gmail.com';
export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=in.zenrevo.gymmigo';

export type LeadRole = 'member' | 'owner' | 'trainer' | 'pricing' | 'general';

export type Faq = { question: string; answer: string };

export const homeFaqs: Faq[] = [
  {
    question: 'How much does Gymmigo cost?',
    answer:
      'The app is free to download and use as a member. Gym memberships and trainer packages are priced by each gym or trainer, and you see the full amount before you confirm. Gyms pay for the owner tools; see Pricing.',
  },
  {
    question: 'Which cities is it in?',
    answer:
      'Gymmigo works anywhere in India. What you see in Explore depends on which partner gyms are listed near you. Runs, the Run Club, Migo and plans work wherever you are.',
  },
  {
    question: 'Does it work with my watch?',
    answer:
      "Optionally. Gymmigo reads heart rate, steps and calories from Health Connect on Android and Apple Health on iPhone, so it works with watches whose app syncs there (Samsung, Fitbit, Garmin, Amazfit and others). Some budget watch apps don't sync. Live heart rate during a run isn't supported yet. GPS runs never need a watch.",
  },
  {
    question: 'Who can see where I run?',
    answer:
      "Only people in the same room or the Run Club see your live position, and the first and last 200 m of your route are hidden from them, so your home stays private. Share links show a trimmed route too. You can leave a room or delete your account at any time.",
  },
  {
    question: 'Can I use it in a browser?',
    answer:
      'Yes. Sign in on the web to see your home, plans, calendar, Migo, gyms and runs. Recording a GPS run needs the phone app, because browsers stop tracking when the screen locks.',
  },
  {
    question: 'Is there an iPhone app?',
    answer: 'The iPhone app is in testing and coming soon. The Android app is on Google Play now, and the web app works on any phone.',
  },
];

export type RolePage = {
  slug: 'members' | 'gym-owners' | 'trainers';
  leadRole: LeadRole;
  eyebrow: string;
  title: string;
  lead: string;
  primary: { label: string; to: 'app' | 'lead' };
  secondary?: { label: string; to: 'lead' | 'pricing' | 'store' };
  hero: [ShotName, ShotName];
  heroAlt: [string, string];
  sections: Array<{ title: string; body: string; points: string[]; shot: ShotName; alt: string }>;
  steps: Array<{ title: string; body: string }>;
  faqs: Faq[];
  note?: string;
};

export const rolePages: Record<RolePage['slug'], RolePage> = {
  members: {
    slug: 'members',
    leadRole: 'member',
    eyebrow: 'For members',
    title: 'Your gym, your runs and your plan, in one app.',
    lead: 'Find a gym near you, check in with a QR code, follow a plan you approved, and run with friends on a live map. Free to use as a member.',
    primary: { label: 'Open the web app', to: 'app' },
    secondary: { label: 'Get it on Google Play', to: 'store' },
    hero: ['sports-home', 'gym-profile'],
    heroAlt: ['Sports home: weekly distance, active time and the Run Club', 'Iron Haus Fitness gym page with passes, facilities and live occupancy'],
    sections: [
      {
        title: 'Pick a gym the way you pick a café.',
        body: 'Explore shows partner gyms around you with passes, facilities, reviews and how crowded it is right now.',
        points: ['Compare monthly, quarterly and day passes', 'See live occupancy before you leave home', 'Choose a plan in the app and pay at the front desk'],
        shot: 'find-gyms',
        alt: 'Explore screen listing gyms near Andheri East with filters',
      },
      {
        title: 'Check in, and the rest keeps itself.',
        body: 'Scan the QR code at the desk. Your visits, streak and club progress update on their own.',
        points: ['Your FitCard is a QR identity for every partner gym', 'Clubs unlock perks like renewal discounts as you show up', 'Rewards collect in your wallet'],
        shot: 'clubs',
        alt: 'Clubs screen showing Rhythm Club tier, streak and reward wallet',
      },
      {
        title: 'A coach that asks before it plans.',
        body: 'Migo knows your goal, injuries and history. Ask about workouts, food or form, or have it draft a 7, 30, 45 or 90-day plan for you to approve.',
        points: ['Plans arrive as drafts you review, change or discard', 'Log each day as done, partly done or skipped', 'A daily reminder at the time you pick'],
        shot: 'plan-review',
        alt: 'Review screen for a 45-day lean muscle plan with phases and the first week',
      },
      {
        title: 'Run alone or with the whole city.',
        body: 'Record runs, walks and rides with GPS. Join the Gymmigo Run Club or make a room for friends and see everyone on one map.',
        points: ['Splits, pace and climb for every kilometre', 'Heart rate from your watch through Health Connect or Apple Health', 'The start and end of your route stay hidden from others'],
        shot: 'run-together',
        alt: 'Live room map with four runners and a leaderboard',
      },
    ],
    steps: [
      { title: 'Set your area', body: 'Choose where you train so Explore shows gyms near you.' },
      { title: 'Join a gym', body: 'Pick a pass in the app and pay at the gym.' },
      { title: 'Check in', body: 'Scan the QR at the desk on every visit.' },
      { title: 'Train and run', body: 'Follow your plan, log your days, join the Run Club.' },
    ],
    faqs: [
      { question: 'Do I need a gym membership to use Gymmigo?', answer: 'No. Runs, the Run Club, Migo and plans work without one. A membership adds check-ins, clubs and gym rewards.' },
      { question: 'Can I book a personal trainer?', answer: 'Yes. Trainer profiles show packages and prices. You book a package and schedule sessions in the app.' },
      ...homeFaqs.slice(2, 4),
    ],
  },
  'gym-owners': {
    slug: 'gym-owners',
    leadRole: 'owner',
    eyebrow: 'For gym owners',
    title: 'Run your gym from your phone, with the desk work done for you.',
    lead: 'Memberships, check-ins, invoices, staff and a loyalty ladder your members can see. One account for one gym or several.',
    primary: { label: 'List your gym', to: 'lead' },
    secondary: { label: 'See pricing', to: 'pricing' },
    hero: ['owner-home', 'owner-members'],
    heroAlt: ['Owner home with gyms, members, revenue and occupancy', 'Members list with active, pending and expired memberships'],
    sections: [
      {
        title: 'Every member, every plan, in one list.',
        body: 'Approve applications, renew, cancel and check members in or out. Import your existing members from Excel and export them any time.',
        points: ['Active, pending and expired at a glance', 'WhatsApp a member from their card', 'Manual check-in when someone forgets their phone'],
        shot: 'owner-members',
        alt: 'Members screen with check-out, accept and renew actions',
      },
      {
        title: 'A loyalty ladder members can actually see.',
        body: 'Publish club tiers that unlock with check-ins. Members see their progress and perks in the app; you see referral leads and who is about to drop off.',
        points: ['Set targets and perks per tier', 'FitCard sharing brings referral leads to your Leads tab', 'Spot members at risk before they stop coming'],
        shot: 'owner-clubs',
        alt: 'Club ladder with eight published tiers and their targets',
      },
      {
        title: 'Know how the month is going.',
        body: 'Revenue, expenses, invoices and products for each gym, plus live occupancy so you know when the floor is busy.',
        points: ['Invoices with paid, pending and cancelled states', 'Expenses and products alongside memberships', 'Separate numbers for each branch'],
        shot: 'owner-home',
        alt: 'Owner home showing members, monthly revenue and occupancy for two gyms',
      },
    ],
    steps: [
      { title: 'List your gym', body: 'Add your location, passes, facilities, photos and hours.' },
      { title: 'Bring members in', body: 'Import from Excel, enrol manually, or accept applications.' },
      { title: 'Run the floor', body: 'QR check-ins, staff roles and daily occupancy.' },
      { title: 'Keep them coming', body: 'Clubs, reviews and referral leads.' },
    ],
    faqs: [
      { question: 'Can I import my existing members?', answer: 'Yes. Download the Excel template, fill it in and import it. You can export the full list any time.' },
      { question: 'Do members pay through Gymmigo?', answer: 'Members choose a plan in the app and pay at your front desk. You record the payment and the membership becomes active.' },
      { question: 'Can I manage more than one branch?', answer: 'Yes. Each gym has its own members, plans, finance and staff, under one owner account.' },
      { question: 'How is it priced?', answer: 'By your gym size and the tools you need. We agree the price on a call; see Pricing for the three setups.' },
    ],
  },
  trainers: {
    slug: 'trainers',
    leadRole: 'trainer',
    eyebrow: 'For trainers',
    title: 'Your clients, sessions and packages, without the spreadsheet.',
    lead: 'Publish packages, take bookings and keep every session in one calendar. Trainer accounts are opening in stages; tell us about your practice to get early access.',
    primary: { label: 'Request early access', to: 'lead' },
    hero: ['trainer-home', 'trainer-packages'],
    heroAlt: ['Trainer home with clients, sessions and completion rate', 'Packages screen with a 12-session strength pack'],
    sections: [
      {
        title: 'Packages members can book.',
        body: 'Create session packs, monthly plans or single sessions with your price, duration and what is included.',
        points: ['Online, at the gym or home visits', 'Offer prices and add-ons like a diet plan', 'Members see your packages on your profile'],
        shot: 'trainer-packages',
        alt: 'Trainer packages: 12-session strength pack and single session',
      },
      {
        title: 'A day you can see at a glance.',
        body: 'New requests, today’s sessions and your completion rate on one screen. Go online when you are taking clients.',
        points: ['Accept or decline booking requests', 'Reschedule or cancel sessions when plans change', 'Earnings for today and this month'],
        shot: 'trainer-home',
        alt: 'Trainer home showing 18 clients, 342 sessions and new requests',
      },
    ],
    steps: [
      { title: 'Build your profile', body: 'Certifications, specialities, photos and where you train.' },
      { title: 'Publish packages', body: 'Sessions, plans and prices members can book.' },
      { title: 'Take bookings', body: 'Accept requests and schedule sessions.' },
      { title: 'Grow by reviews', body: 'Clients rate you after their sessions.' },
    ],
    faqs: [
      { question: 'Can I sign up as a trainer today?', answer: 'Trainer accounts are opening in stages. Request early access and we will set you up.' },
      { question: 'Can I train clients online?', answer: 'Yes. Each package says whether it is online, at a gym or a home visit.' },
    ],
    note: 'Trainer sign-up is invite-only for now.',
  },
};

export const pricingPlans = [
  {
    name: 'Launch',
    audience: 'Independent gyms starting with digital memberships',
    price: 'Talk to us',
    features: ['Gym listing and profile', 'Membership plan setup', 'QR attendance', 'Member list basics', 'Reviews and gallery', 'WhatsApp onboarding support'],
  },
  {
    name: 'Growth',
    audience: 'Gyms that want retention, finance and leads',
    price: 'Custom quote',
    featured: true,
    features: ['Everything in Launch', 'Excel member import and export', 'Finance and products', 'Club ladder rewards', 'Referral lead tracking', 'Owner analytics'],
  },
  {
    name: 'Network',
    audience: 'Multi-location operators and premium brands',
    price: 'Custom quote',
    features: ['Everything in Growth', 'Multiple gyms under one account', 'Team and manager roles', 'Advanced reward setup', 'Priority support', 'Trainer and shop rollout help'],
  },
];

export const pricingFaqs: Faq[] = [
  { question: 'Why is there no price on the page?', answer: 'Gyms differ a lot in size, branches and what they want switched on. We would rather agree a fair monthly price on a short call than publish a number that fits nobody.' },
  { question: 'Do members pay anything to Gymmigo?', answer: 'No. Members use the app free. They pay your gym for the membership, at your front desk.' },
  { question: 'Can we start small and add tools later?', answer: 'Yes. You can start with the listing, plans and QR check-in, and add finance, clubs or more branches when they need them.' },
  { question: 'How long does setup take?', answer: 'Usually a day or two: your gym profile, plans and an Excel import of current members. We help over WhatsApp while you do it.' },
];
