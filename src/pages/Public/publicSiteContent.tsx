import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  Award,
  BarChart3,
  Bell,
  Bot,
  Brain,
  BriefcaseBusiness,
  Calendar,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Crown,
  Dumbbell,
  FileSpreadsheet,
  Gift,
  MapPin,
  Package,
  QrCode,
  ScanLine,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  Timer,
  Trophy,
  UserCheck,
  Users,
  Wallet,
} from 'lucide-react';

export const SHOP_URL = 'https://shop.gymmigo.in';
export const WHATSAPP_PHONE = '917208221615';
export const CONTACT_EMAIL = 'official.zenrevo@gmail.com';
export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=in.zenrevo.gymmigo';

export type LeadRole = 'member' | 'owner' | 'trainer' | 'pricing' | 'general';

export type FeatureDetailId = 'ai' | 'clubs' | 'owner-crm' | 'trainer-booking' | 'shop';

export type MarketingItem = {
  title: string;
  desc: string;
  icon: LucideIcon;
  tone?: 'orange' | 'emerald' | 'cyan' | 'blue' | 'amber';
  detailId?: FeatureDetailId;
};

export type RolePageData = {
  slug: 'members' | 'gym-owners' | 'trainers';
  leadRole: LeadRole;
  eyebrow: string;
  title: string;
  accent: string;
  subtitle: string;
  primaryCta: string;
  secondaryCta: string;
  stats: { value: string; label: string }[];
  promises: MarketingItem[];
  capabilities: MarketingItem[];
  workflow: { step: string; title: string; desc: string }[];
  proof: { title: string; desc: string }[];
  faqs: { question: string; answer: string }[];
};

export const roleCards: Array<MarketingItem & { href: string; leadRole: LeadRole; cta: string }> = [
  {
    title: 'Members',
    desc: 'Discover gyms, follow AI plans, check in, earn rewards, book trainers, and use wallet value in the shop.',
    icon: Users,
    tone: 'cyan',
    href: '/members',
    leadRole: 'member',
    cta: 'See member journey',
  },
  {
    title: 'Gym Owners',
    desc: 'Run memberships, attendance, revenue, products, teams, leads, rewards, reviews, and multi-gym operations.',
    icon: Store,
    tone: 'orange',
    href: '/gym-owners',
    leadRole: 'owner',
    cta: 'Grow my gym',
  },
  {
    title: 'Trainers',
    desc: 'Publish packages, prove credentials, manage bookings, schedule sessions, and grow a trusted coaching brand.',
    icon: Dumbbell,
    tone: 'emerald',
    href: '/trainers',
    leadRole: 'trainer',
    cta: 'Build trainer profile',
  },
];

export const trustStats = [
  { value: '3', label: 'Connected role journeys' },
  { value: '24/7', label: 'AI and app access' },
  { value: '1', label: 'Wallet, rewards, shop loop' },
  { value: '0', label: 'Backend changes needed for public site' },
];

export const platformFlow = [
  { step: '01', title: 'Discover', desc: 'Members search gyms and trainers by location, rating, amenities, specialization, and live context.', icon: MapPin },
  { step: '02', title: 'Join or Book', desc: 'Members apply for memberships, select packages, book trainers, and track upcoming sessions.', icon: CreditCard },
  { step: '03', title: 'Check In', desc: 'Gyms use QR attendance and staff actions to keep entry, checkout, and occupancy clean.', icon: QrCode },
  { step: '04', title: 'Train With Migo AI', desc: 'Migo AI helps with workouts, diet planning, routine context, progress, and exercise demos.', icon: Brain },
  { step: '05', title: 'Earn Rewards', desc: 'Club Road, FitCard, referrals, streaks, points, and reward claims turn consistency into value.', icon: Trophy },
  { step: '06', title: 'Shop', desc: 'Wallet and rewards connect members to Gymmigo shop offers for supplements and fitness products.', icon: ShoppingBag },
  { step: '07', title: 'Retain and Grow', desc: 'Owners and trainers get CRM, reviews, finance, client, booking, and lead insights.', icon: BarChart3 },
];

export const productPillars: MarketingItem[] = [
  {
    title: 'Migo AI Assistant',
    desc: 'Personalized workout, diet, progress, schedule, and routine support powered by member context.',
    icon: Bot,
    tone: 'orange',
    detailId: 'ai',
  },
  {
    title: 'Gym Discovery',
    desc: 'Search nearby gyms and trainers with ratings, amenities, plans, packages, and location-aware filters.',
    icon: MapPin,
    tone: 'cyan',
  },
  {
    title: 'Membership Engine',
    desc: 'Plan cart, owner approval, member enrollments, renewals, edits, payment records, and membership detail views.',
    icon: CreditCard,
    tone: 'blue',
  },
  {
    title: 'QR Attendance',
    desc: 'Check-in and checkout flows for members, staff, and owners with occupancy and history visibility.',
    icon: ScanLine,
    tone: 'orange',
  },
  {
    title: 'Club Road Rewards',
    desc: 'Eight-club progression, FitCard sharing, referrals, reward claims, and comeback missions.',
    icon: Trophy,
    tone: 'amber',
    detailId: 'clubs',
  },
  {
    title: 'Wallet and Shop',
    desc: 'Loyalty wallet balance, transactions, reward value, and external shop connection.',
    icon: Wallet,
    tone: 'emerald',
    detailId: 'shop',
  },
  {
    title: 'Owner CRM',
    desc: 'Member database, import/export, attendance, at-risk insights, leads, trials, reviews, and team controls.',
    icon: Users,
    tone: 'orange',
    detailId: 'owner-crm',
  },
  {
    title: 'Trainer Booking',
    desc: 'Trainer profiles, packages, certifications, gallery, reviews, bookings, session scheduling, and client management.',
    icon: Dumbbell,
    tone: 'emerald',
    detailId: 'trainer-booking',
  },
  {
    title: 'Finance and Products',
    desc: 'Invoices, expenses, product catalog, plan payments, session package value, and gym-level reporting.',
    icon: Package,
    tone: 'cyan',
  },
  {
    title: 'Security and Trust',
    desc: 'OTP login, role onboarding, protected dashboards, privacy pages, terms, and controlled app access.',
    icon: ShieldCheck,
    tone: 'blue',
  },
];

export const featureDetails: Record<FeatureDetailId, { title: string; desc: string; bullets: string[]; icon: LucideIcon }> = {
  ai: {
    title: 'Migo AI Assistant',
    desc: 'The assistant is positioned as a personal layer over the user journey, not a generic chatbot.',
    icon: Brain,
    bullets: [
      'Understands profile, goals, injuries, preferences, routine, workout history, and diet context.',
      'Can answer progress questions, suggest workouts, support meal planning, and explain exercise form.',
      'Connects with schedule and media flows without exposing internal tool traces to users.',
    ],
  },
  clubs: {
    title: 'Club Road and FitCard',
    desc: 'A retention loop that gives members visible progress and gives gyms measurable lead growth.',
    icon: Crown,
    bullets: [
      'Members unlock club tiers, badges, reward claims, and comeback missions.',
      'FitCard sharing creates referral leads that owners can track and convert.',
      'Rewards can include gym benefits, trainer touchpoints, body scans, and partner offers.',
    ],
  },
  'owner-crm': {
    title: 'Owner CRM and Operations',
    desc: 'The owner surface is built around repeated daily operations, not just vanity analytics.',
    icon: BriefcaseBusiness,
    bullets: [
      'Manage members, attendance, plan edits, Excel import/export, cancellations, and manual check-ins.',
      'Track finance, products, invoices, expenses, reviews, team permissions, equipment, amenities, and leads.',
      'Use overview and stats panels to see occupancy, growth, rewards, and priority actions.',
    ],
  },
  'trainer-booking': {
    title: 'Trainer Booking System',
    desc: 'Trainers get a professional profile and an operating dashboard for paid coaching relationships.',
    icon: Dumbbell,
    bullets: [
      'Publish certifications, gallery, pricing, packages, location, availability, and service modes.',
      'Accept bookings, manage active clients, schedule sessions, and track package progress.',
      'Members can book packages, schedule sessions, contact trainers, and leave reviews.',
    ],
  },
  shop: {
    title: 'Gymmigo Shop Link',
    desc: 'The public site links to the dedicated shop while keeping wallet and rewards context visible.',
    icon: ShoppingBag,
    bullets: [
      'Public shop CTAs open shop.gymmigo.in in a new tab.',
      'Members see wallet balance and lifetime earned value inside the app.',
      'Club rewards can include supplement partner value and shop-oriented discounts.',
    ],
  },
};

export const homeFaqs = [
  {
    question: 'Is Gymmigo for only gym owners?',
    answer: 'No. Gymmigo connects members, gym owners, and trainers in one operating system. Members use the app to train, discover, book, and earn. Owners run the gym. Trainers manage packages, sessions, and clients.',
  },
  {
    question: 'Does the public site change backend APIs?',
    answer: 'No. This rebuild is web-only. It markets the capabilities already present in the app and routes users to login, WhatsApp, email, app screens, or shop.',
  },
  {
    question: 'How does shop work?',
    answer: 'Shop CTAs open the dedicated Gymmigo shop at shop.gymmigo.in. Wallet and reward surfaces inside the app explain earned value and future shop usage.',
  },
  {
    question: 'Can owners manage existing member lists?',
    answer: 'Yes. The owner member dashboard supports member views, Excel export/import, enrollment, edits, check-ins, checkouts, cancellations, and attendance history.',
  },
  {
    question: 'Can trainers use Gymmigo independently?',
    answer: 'Yes. Trainers can build a profile, add certifications, set packages and pricing, upload gallery images, manage bookings, schedule sessions, and track clients.',
  },
];

export const rolePageData: Record<RolePageData['slug'], RolePageData> = {
  members: {
    slug: 'members',
    leadRole: 'member',
    eyebrow: 'For members',
    title: 'A fitness app that actually follows your gym life.',
    accent: 'Train, track, earn, and shop from one connected member journey.',
    subtitle: 'Members get discovery, memberships, trainer bookings, Migo AI, daily fitness score, schedule, QR check-ins, FitCard, Club Road rewards, wallet, and shop access.',
    primaryCta: 'Start as member',
    secondaryCta: 'Explore gyms',
    stats: [
      { value: '100', label: 'Daily score target' },
      { value: '8', label: 'Club Road tiers' },
      { value: '1', label: 'Wallet for rewards' },
    ],
    promises: [
      { title: 'AI Coach', desc: 'Ask Migo AI for plans, progress, diet, routine, and exercise guidance.', icon: Brain, tone: 'orange', detailId: 'ai' },
      { title: 'Fitness Score', desc: 'See daily score, streak, active days, rank, and coach nudges.', icon: Activity, tone: 'emerald' },
      { title: 'Gym Discovery', desc: 'Find gyms and trainers near you with pricing, ratings, and location context.', icon: MapPin, tone: 'cyan' },
      { title: 'Rewards Wallet', desc: 'Track reward balance, lifetime earned value, and shop-driven benefits.', icon: Wallet, tone: 'emerald', detailId: 'shop' },
    ],
    capabilities: [
      { title: 'Workout and diet planning', desc: 'Use assistant and schedule views to keep your plan visible.', icon: ClipboardList, tone: 'orange' },
      { title: 'QR check-in and checkout', desc: 'Log gym attendance and keep membership activity clean.', icon: QrCode, tone: 'cyan' },
      { title: 'FitCard sharing', desc: 'Share progress, clubs, referrals, and claim rewards.', icon: Award, tone: 'amber' },
      { title: 'Trainer booking', desc: 'Buy packages, schedule sessions, and track remaining sessions.', icon: Calendar, tone: 'emerald' },
      { title: 'Exercise demos', desc: 'View workout media and demo support for better form.', icon: Dumbbell, tone: 'blue' },
      { title: 'Shop connection', desc: 'Use shop CTAs for supplements and fitness products.', icon: ShoppingBag, tone: 'emerald' },
    ],
    workflow: [
      { step: '01', title: 'Set location', desc: 'Choose your area so discovery can show relevant gyms and trainers.' },
      { step: '02', title: 'Join and check in', desc: 'Apply for plans, track memberships, and use QR attendance.' },
      { step: '03', title: 'Train with Migo', desc: 'Ask for workouts, diet, schedule help, progress, and demos.' },
      { step: '04', title: 'Earn and redeem', desc: 'Build streaks, unlock clubs, claim rewards, and visit the shop.' },
    ],
    proof: [
      { title: 'Built for repeat training', desc: 'The app focuses on daily score, active days, schedule, streaks, and habit nudges.' },
      { title: 'Connected to real gyms', desc: 'Membership, check-in, trainer, reward, and shop flows are tied to actual gym activity.' },
    ],
    faqs: [
      { question: 'Do members need to download an app?', answer: 'Members can use the web/PWA experience and the Android app link where available.' },
      { question: 'Can members book trainers?', answer: 'Yes. Members can discover trainers, buy packages, schedule sessions, and track progress.' },
    ],
  },
  'gym-owners': {
    slug: 'gym-owners',
    leadRole: 'owner',
    eyebrow: 'For gym owners',
    title: 'A command center for modern gym operations.',
    accent: 'Members, money, attendance, rewards, leads, team, and growth in one place.',
    subtitle: 'Owners can manage listings, memberships, member CRM, Excel import/export, QR attendance, finance, products, Club Road rewards, referral leads, reviews, team, equipment, amenities, and multiple gyms.',
    primaryCta: 'Book owner demo',
    secondaryCta: 'See pricing',
    stats: [
      { value: '360', label: 'Member view' },
      { value: 'Excel', label: 'Import and export' },
      { value: 'Multi', label: 'Gym operations' },
    ],
    promises: [
      { title: 'Member CRM', desc: 'Manage member records, active plans, check-ins, cancellations, edits, and history.', icon: Users, tone: 'orange', detailId: 'owner-crm' },
      { title: 'QR Attendance', desc: 'Use gym QR and staff actions for fast check-ins and checkouts.', icon: ScanLine, tone: 'cyan' },
      { title: 'Finance and Products', desc: 'Track invoices, expenses, products, package value, and payment records.', icon: Package, tone: 'emerald' },
      { title: 'Referral Growth', desc: 'Use FitCard and Club Road to capture leads, trials, conversions, and rewards.', icon: Gift, tone: 'amber', detailId: 'clubs' },
    ],
    capabilities: [
      { title: 'Plans and memberships', desc: 'Create flexible plans, enroll members, edit dates, payment method, and amount.', icon: CreditCard, tone: 'orange' },
      { title: 'Excel workflows', desc: 'Download member Excel and import member records for faster operations.', icon: FileSpreadsheet, tone: 'emerald' },
      { title: 'Team and permissions', desc: 'Manage managers, primary owner controls, and operational access.', icon: UserCheck, tone: 'cyan' },
      { title: 'Reviews and gallery', desc: 'Build trust through images, reviews, and owner responses.', icon: Star, tone: 'amber' },
      { title: 'Equipment and amenities', desc: 'Keep facilities, equipment, hours, and amenities up to date.', icon: Dumbbell, tone: 'blue' },
      { title: 'Clubs and wallet value', desc: 'Publish club journeys, reward claims, and member loyalty value.', icon: Wallet, tone: 'emerald' },
    ],
    workflow: [
      { step: '01', title: 'List your gym', desc: 'Add location, brand, plans, amenities, gallery, and operating details.' },
      { step: '02', title: 'Bring members in', desc: 'Enroll manually, import via Excel, or receive applications from discovery.' },
      { step: '03', title: 'Operate daily', desc: 'Use QR attendance, member detail, finance, staff, and equipment tabs.' },
      { step: '04', title: 'Retain and grow', desc: 'Use clubs, FitCard leads, reviews, rewards, and analytics to improve retention.' },
    ],
    proof: [
      { title: 'Operational, not decorative', desc: 'Owner screens cover the boring-but-critical daily jobs: attendance, members, money, team, reviews, and records.' },
      { title: 'Growth loop included', desc: 'Club Road and FitCard convert member progress into shareable referrals and reward-led retention.' },
    ],
    faqs: [
      { question: 'Can I import my existing members?', answer: 'Yes. The member dashboard includes Excel download and import workflows.' },
      { question: 'Can Gymmigo support multiple gyms?', answer: 'Yes. The owner dashboard is structured around gym-specific routes and multi-gym management.' },
    ],
  },
  trainers: {
    slug: 'trainers',
    leadRole: 'trainer',
    eyebrow: 'For trainers',
    title: 'A professional training business inside Gymmigo.',
    accent: 'Profile, packages, bookings, sessions, clients, reviews, and proof in one trainer hub.',
    subtitle: 'Trainers can publish certifications, gallery, pricing, packages, availability, online/offline/home visit options, accept bookings, manage clients, schedule sessions, and build trust through reviews.',
    primaryCta: 'Join as trainer',
    secondaryCta: 'Talk on WhatsApp',
    stats: [
      { value: '3', label: 'Service modes' },
      { value: '1', label: 'Client hub' },
      { value: 'Live', label: 'Bookings and sessions' },
    ],
    promises: [
      { title: 'Professional Profile', desc: 'Show bio, pricing, location, specializations, services, gallery, and certifications.', icon: BriefcaseBusiness, tone: 'orange' },
      { title: 'Packages and Pricing', desc: 'Create monthly, weekly, or session-based packages members can book.', icon: Package, tone: 'emerald' },
      { title: 'Booking System', desc: 'Accept bookings, track paid value, and manage active and past packages.', icon: Calendar, tone: 'cyan', detailId: 'trainer-booking' },
      { title: 'Client Management', desc: 'See clients, sessions, package progress, notes, reviews, and session status.', icon: Users, tone: 'blue' },
    ],
    capabilities: [
      { title: 'Certifications', desc: 'Add certificates and credential proof to build trust.', icon: Award, tone: 'amber' },
      { title: 'Availability', desc: 'Set schedule and location preferences for real-world sessions.', icon: Timer, tone: 'cyan' },
      { title: 'Online and offline', desc: 'Support gym, online, and home visit service modes.', icon: CheckCircle2, tone: 'emerald' },
      { title: 'Gallery', desc: 'Upload portfolio images and keep your profile fresh.', icon: Sparkles, tone: 'orange' },
      { title: 'Reviews', desc: 'Collect trainer reviews and improve conversion from discovery.', icon: Star, tone: 'amber' },
      { title: 'Session actions', desc: 'Accept, reject, schedule, cancel, and manage sessions from dashboard.', icon: Bell, tone: 'blue' },
    ],
    workflow: [
      { step: '01', title: 'Complete profile', desc: 'Add location, bio, specializations, certifications, gallery, and pricing.' },
      { step: '02', title: 'Publish packages', desc: 'Create services members can discover and book.' },
      { step: '03', title: 'Manage sessions', desc: 'Accept bookings, schedule sessions, and track client progress.' },
      { step: '04', title: 'Grow reputation', desc: 'Use reviews, completion rate, and portfolio proof to build demand.' },
    ],
    proof: [
      { title: 'Built for trainers who operate', desc: 'The dashboard covers client lists, bookings, sessions, packages, gallery, reviews, and settings.' },
      { title: 'Visible to members', desc: 'Trainer discovery and profile pages let members inspect, choose, book, and schedule.' },
    ],
    faqs: [
      { question: 'Can trainers offer home visits?', answer: 'Yes. Trainer onboarding and settings include online, offline, and home visit availability.' },
      { question: 'Can trainers manage packages?', answer: 'Yes. Trainers can create packages and track client package progress after booking.' },
    ],
  },
};

export const pricingPlans = [
  {
    name: 'Launch',
    audience: 'For independent gyms starting digital operations',
    price: 'Talk to us',
    tone: 'cyan' as const,
    features: ['Gym listing and profile', 'Membership plan setup', 'QR attendance', 'Member CRM basics', 'Reviews and gallery', 'WhatsApp onboarding support'],
  },
  {
    name: 'Growth',
    audience: 'For gyms that want retention, finance, and lead systems',
    price: 'Custom quote',
    tone: 'orange' as const,
    featured: true,
    features: ['Everything in Launch', 'Excel member import/export', 'Finance and products', 'Club Road rewards', 'Referral lead tracking', 'Owner analytics and insights'],
  },
  {
    name: 'Network',
    audience: 'For multi-location operators and premium fitness brands',
    price: 'Custom quote',
    tone: 'emerald' as const,
    features: ['Everything in Growth', 'Multi-gym operations', 'Team and manager controls', 'Advanced reward setup', 'Priority support', 'Trainer and shop rollout guidance'],
  },
];
