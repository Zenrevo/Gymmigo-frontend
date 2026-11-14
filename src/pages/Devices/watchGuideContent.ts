/** Copy for "Connect your watch" — ported from the app (screens/watch/watchGuideContent.ts). Menu names vary by app version, so steps say "usually". */

export type Platformish = 'android' | 'ios';

export const hubName = (os: Platformish) => (os === 'ios' ? 'Apple Health' : 'Health Connect');

export type BrandGuide = { key: string; name: string; app: string; android: string | null; ios: string | null };

export const BRANDS: BrandGuide[] = [
  {
    key: 'samsung',
    name: 'Samsung Galaxy Watch',
    app: 'Samsung Health',
    android: 'Open Samsung Health → ☰ / Settings → Health Connect → turn on sharing, then allow the data types.',
    ios: null,
  },
  {
    key: 'apple',
    name: 'Apple Watch',
    app: 'Apple Health (built in)',
    android: null,
    ios: 'Nothing to set up: Apple Watch saves workouts and heart rate to Apple Health automatically.',
  },
  {
    key: 'fitbit',
    name: 'Fitbit / Google Pixel Watch',
    app: 'Fitbit',
    android: 'Open the Fitbit app → profile picture → Settings → Health Connect → turn it on.',
    ios: 'Fitbit doesn’t share with Apple Health, so its data can’t reach Gymmigo on iPhone.',
  },
  {
    key: 'garmin',
    name: 'Garmin',
    app: 'Garmin Connect',
    android: 'Open Garmin Connect → More → Settings → Connected Apps → Health Connect → allow.',
    ios: 'Open Garmin Connect → More → Settings → Connected Apps → Apple Health → allow.',
  },
  {
    key: 'zepp',
    name: 'Amazfit',
    app: 'Zepp',
    android: 'Open Zepp → Profile → Add accounts → Health Connect → allow.',
    ios: 'Open Zepp → Profile → Add accounts → Apple Health → allow.',
  },
  {
    key: 'xiaomi',
    name: 'Xiaomi / Redmi / Mi Band',
    app: 'Mi Fitness',
    android: 'Open Mi Fitness → Profile → Third-party data → Health Connect → turn on.',
    ios: 'Open Mi Fitness → Profile → Third-party data → Apple Health → turn on.',
  },
  {
    key: 'budget',
    name: 'Noise, boAt, Fire-Boltt and others',
    app: 'NoiseFit, boAt Crest, Da Fit…',
    android:
      'Look in the watch app’s settings for “Health Connect” or “Google Fit”. Some apps (e.g. NoiseFit) can share; boAt Crest currently doesn’t seem to, so its data can’t reach Gymmigo yet.',
    ios: 'Look in the watch app’s settings for “Apple Health”. If there’s no such option, its data can’t reach Gymmigo yet.',
  },
];

export const FAQ: { q: string; a: (os: Platformish) => string }[] = [
  {
    q: 'Do I need to connect a watch?',
    a: os =>
      `No, it’s optional. Gymmigo tracks runs, walks and rides with your phone’s GPS on its own. ${hubName(os)} only adds steps, heart rate and calories from your watch, and saves your Gymmigo runs there for other apps.`,
  },
  {
    q: 'My watch app isn’t listed / boAt Crest doesn’t sync',
    a: os =>
      `Gymmigo can only read what your watch app shares with ${hubName(os)}. If the app has no ${hubName(os)} option (boAt Crest, for example, doesn’t seem to today), its data can’t reach Gymmigo. Ask the watch maker to add it — or use a watch whose app supports it.`,
  },
  {
    q: 'Why don’t I see heart rate during my run?',
    a: () =>
      'Live heart rate during runs isn’t supported yet. Your watch app usually syncs a few minutes after the workout; the heart-rate chart then appears on the run summary (pull to refresh).',
  },
  {
    q: 'What does Gymmigo read and write?',
    a: os =>
      `It reads steps, distance, active calories, exercise sessions and heart rate — only the types you allow. It writes your finished Gymmigo runs, walks and rides so they show up in ${hubName(os)} too. You can turn any of this off in ${hubName(os)} at any time.`,
  },
];

export const FLOW = (os: Platformish) => ['Your watch', 'Watch app', hubName(os), 'Gymmigo'];
