export interface CatalogService {
  name: string;
  category: string;
  defaultAmount: number;
  annualPrice?: number; // Optional annual tier price (for savings calculations)
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  color: string;
  websiteUrl: string;
  cancelUrl?: string;
  description?: string;
  aliases: string[];
}

export const POPULAR_SERVICES: CatalogService[] = [
  // --- AI & Machine Learning ---
  {
    name: 'ChatGPT Plus',
    category: 'Software',
    defaultAmount: 20.00,
    currency: 'USD',
    billingCycle: 'monthly',
    color: '#10A37F',
    websiteUrl: 'https://chat.openai.com',
    cancelUrl: 'https://chat.openai.com/#settings/Account',
    description: 'GPT-4o, DALL-E, Advanced Data Analysis',
    aliases: ['chatgpt', 'chatgpt plus', 'openai', 'openai *chatgpt', 'chat.openai.com']
  },
  {
    name: 'Claude Pro',
    category: 'Software',
    defaultAmount: 20.00,
    currency: 'USD',
    billingCycle: 'monthly',
    color: '#D97706',
    websiteUrl: 'https://claude.ai',
    cancelUrl: 'https://claude.ai/settings/billing',
    description: 'Claude 3.5 Sonnet & Opus priority access',
    aliases: ['claude', 'claude pro', 'anthropic', 'anthropic *claude', 'claude.ai']
  },
  {
    name: 'Cursor Pro',
    category: 'Software',
    defaultAmount: 20.00,
    currency: 'USD',
    billingCycle: 'monthly',
    color: '#000000',
    websiteUrl: 'https://cursor.com',
    cancelUrl: 'https://cursor.com/settings',
    description: 'AI code editor with Claude & GPT models',
    aliases: ['cursor', 'cursor pro', 'anysphere', 'cursor.com']
  },
  {
    name: 'GitHub Copilot',
    category: 'Software',
    defaultAmount: 10.00,
    currency: 'USD',
    billingCycle: 'monthly',
    color: '#24292F',
    websiteUrl: 'https://github.com',
    cancelUrl: 'https://github.com/settings/billing/summary',
    description: 'AI pair programmer by GitHub',
    aliases: ['github', 'github copilot', 'copilot', 'github *copilot']
  },
  {
    name: 'Midjourney Standard',
    category: 'Software',
    defaultAmount: 30.00,
    currency: 'USD',
    billingCycle: 'monthly',
    color: '#2B2D42',
    websiteUrl: 'https://midjourney.com',
    cancelUrl: 'https://www.midjourney.com/account',
    description: 'Generative AI image generation',
    aliases: ['midjourney', 'midjourney inc', 'midjourney.com']
  },
  {
    name: 'Perplexity Pro',
    category: 'Software',
    defaultAmount: 20.00,
    currency: 'USD',
    billingCycle: 'monthly',
    color: '#22B8CD',
    websiteUrl: 'https://perplexity.ai',
    cancelUrl: 'https://www.perplexity.ai/settings/account',
    description: 'AI conversational search engine',
    aliases: ['perplexity', 'perplexity pro', 'perplexity.ai']
  },

  // --- Streaming & Entertainment ---
  {
    name: 'Netflix Standard',
    category: 'Streaming',
    defaultAmount: 15.49,
    currency: 'USD',
    billingCycle: 'monthly',
    color: '#E50914',
    websiteUrl: 'https://netflix.com',
    cancelUrl: 'https://www.netflix.com/youraccount',
    description: '1080p Full HD, 2 simultaneous devices',
    aliases: ['netflix', 'netflix.com', 'netflix standard', 'netflix monthly']
  },
  {
    name: 'Netflix Premium 4K',
    category: 'Streaming',
    defaultAmount: 22.99,
    currency: 'USD',
    billingCycle: 'monthly',
    color: '#E50914',
    websiteUrl: 'https://netflix.com',
    cancelUrl: 'https://www.netflix.com/youraccount',
    description: '4K Ultra HD + HDR, 4 simultaneous screens',
    aliases: ['netflix premium', 'netflix 4k', 'netflix family']
  },
  {
    name: 'YouTube Premium',
    category: 'Streaming',
    defaultAmount: 13.99,
    currency: 'USD',
    billingCycle: 'monthly',
    color: '#FF0000',
    websiteUrl: 'https://youtube.com/premium',
    cancelUrl: 'https://www.youtube.com/paid_memberships',
    description: 'Ad-free videos, background play, YouTube Music',
    aliases: ['youtube', 'youtube premium', 'google youtube', 'yt premium', 'google *youtube']
  },
  {
    name: 'Amazon Prime',
    category: 'Streaming',
    defaultAmount: 139.00,
    currency: 'USD',
    billingCycle: 'yearly',
    color: '#FF9900',
    websiteUrl: 'https://amazon.com/prime',
    cancelUrl: 'https://www.amazon.com/mc/manage',
    description: 'Free expedited delivery, Prime Video, Prime Music',
    aliases: ['amazon prime', 'prime video', 'amazon.com/prime', 'amzn prime', 'amazon prime membership']
  },
  {
    name: 'Disney+ Standard',
    category: 'Streaming',
    defaultAmount: 13.99,
    currency: 'USD',
    billingCycle: 'monthly',
    color: '#113CCF',
    websiteUrl: 'https://disneyplus.com',
    cancelUrl: 'https://www.disneyplus.com/account',
    description: 'Disney, Pixar, Marvel, Star Wars & Nat Geo',
    aliases: ['disney', 'disney+', 'disney plus', 'disneyplus.com']
  },
  {
    name: 'Max (HBO Max)',
    category: 'Streaming',
    defaultAmount: 16.99,
    currency: 'USD',
    billingCycle: 'monthly',
    color: '#002BE7',
    websiteUrl: 'https://max.com',
    cancelUrl: 'https://auth.max.com/account',
    description: 'HBO, Warner Bros, Max Originals',
    aliases: ['max', 'hbo', 'hbo max', 'warner max', 'max.com']
  },
  {
    name: 'Apple TV+',
    category: 'Streaming',
    defaultAmount: 9.99,
    currency: 'USD',
    billingCycle: 'monthly',
    color: '#000000',
    websiteUrl: 'https://tv.apple.com',
    cancelUrl: 'https://support.apple.com/billing',
    description: 'Apple Original series and films',
    aliases: ['apple tv', 'apple tv+', 'apple tv plus', 'itunes *apple tv']
  },
  {
    name: 'Hulu (No Ads)',
    category: 'Streaming',
    defaultAmount: 17.99,
    currency: 'USD',
    billingCycle: 'monthly',
    color: '#1CE783',
    websiteUrl: 'https://hulu.com',
    cancelUrl: 'https://secure.hulu.com/account',
    description: 'On-demand TV and movies without commercials',
    aliases: ['hulu', 'hulu no ads', 'hulu.com']
  },
  {
    name: 'Crunchyroll Mega Fan',
    category: 'Streaming',
    defaultAmount: 9.99,
    currency: 'USD',
    billingCycle: 'monthly',
    color: '#F47521',
    websiteUrl: 'https://crunchyroll.com',
    cancelUrl: 'https://www.crunchyroll.com/account/membership',
    description: 'Ad-free anime simulcasts & offline viewing',
    aliases: ['crunchyroll', 'crunchyroll mega fan', 'funimation']
  },

  // --- Music & Audio ---
  {
    name: 'Spotify Individual',
    category: 'Music',
    defaultAmount: 11.99,
    currency: 'USD',
    billingCycle: 'monthly',
    color: '#1DB954',
    websiteUrl: 'https://spotify.com',
    cancelUrl: 'https://www.spotify.com/account/overview/',
    description: 'Ad-free music listening & offline playback',
    aliases: ['spotify', 'spotify premium', 'spotify individual', 'spotify ab', 'spotify.com']
  },
  {
    name: 'Spotify Family',
    category: 'Music',
    defaultAmount: 19.99,
    currency: 'USD',
    billingCycle: 'monthly',
    color: '#1DB954',
    websiteUrl: 'https://spotify.com/family',
    cancelUrl: 'https://www.spotify.com/account/overview/',
    description: '6 individual premium accounts under one roof',
    aliases: ['spotify family', 'spotify premium family']
  },
  {
    name: 'Apple Music Individual',
    category: 'Music',
    defaultAmount: 10.99,
    currency: 'USD',
    billingCycle: 'monthly',
    color: '#FA243C',
    websiteUrl: 'https://music.apple.com',
    cancelUrl: 'https://support.apple.com/billing',
    description: 'Lossless audio & Spatial Audio music',
    aliases: ['apple music', 'itunes music', 'apple.com/music']
  },
  {
    name: 'Audible Premium Plus',
    category: 'Music',
    defaultAmount: 14.95,
    currency: 'USD',
    billingCycle: 'monthly',
    color: '#F8991D',
    websiteUrl: 'https://audible.com',
    cancelUrl: 'https://www.audible.com/account/overview',
    description: '1 credit/month + Audible Plus catalog',
    aliases: ['audible', 'audible membership', 'amazon audible']
  },

  // --- Software, Dev & Productivity ---
  {
    name: 'Adobe Creative Cloud',
    category: 'Software',
    defaultAmount: 59.99,
    currency: 'USD',
    billingCycle: 'monthly',
    color: '#FF0000',
    websiteUrl: 'https://adobe.com',
    cancelUrl: 'https://account.adobe.com/plans',
    description: 'Photoshop, Illustrator, Premiere, After Effects',
    aliases: ['adobe', 'creative cloud', 'adobe cc', 'adobe systems', 'adobe *creative cloud']
  },
  {
    name: 'Figma Professional',
    category: 'Software',
    defaultAmount: 15.00,
    currency: 'USD',
    billingCycle: 'monthly',
    color: '#F24E1E',
    websiteUrl: 'https://figma.com',
    cancelUrl: 'https://www.figma.com/settings',
    description: 'Collaborative interface design tool',
    aliases: ['figma', 'figma professional', 'figma inc']
  },
  {
    name: 'Notion Plus',
    category: 'Software',
    defaultAmount: 10.00,
    currency: 'USD',
    billingCycle: 'monthly',
    color: '#000000',
    websiteUrl: 'https://notion.so',
    cancelUrl: 'https://www.notion.so/settings',
    description: 'All-in-one workspace for notes, docs & tasks',
    aliases: ['notion', 'notion plus', 'notion labs', 'notion.so']
  },
  {
    name: 'Linear Standard',
    category: 'Software',
    defaultAmount: 8.00,
    currency: 'USD',
    billingCycle: 'monthly',
    color: '#5E6AD2',
    websiteUrl: 'https://linear.app',
    cancelUrl: 'https://linear.app/settings/billing',
    description: 'Modern issue tracking and project planning',
    aliases: ['linear', 'linear app', 'linear.app']
  },
  {
    name: 'Slack Pro',
    category: 'Software',
    defaultAmount: 8.75,
    currency: 'USD',
    billingCycle: 'monthly',
    color: '#4A154B',
    websiteUrl: 'https://slack.com',
    cancelUrl: 'https://my.slack.com/admin/billing',
    description: 'Unlimited message history & canvas integrations',
    aliases: ['slack', 'slack pro', 'slack technologies']
  },
  {
    name: '1Password Individual',
    category: 'Software',
    defaultAmount: 2.99,
    currency: 'USD',
    billingCycle: 'monthly',
    color: '#0A85EA',
    websiteUrl: 'https://1password.com',
    cancelUrl: 'https://my.1password.com/billing',
    description: 'Password manager and digital wallet',
    aliases: ['1password', 'agilebits 1password', '1password.com']
  },
  {
    name: 'Raycast Pro',
    category: 'Software',
    defaultAmount: 8.00,
    currency: 'USD',
    billingCycle: 'monthly',
    color: '#FF6363',
    websiteUrl: 'https://raycast.com',
    cancelUrl: 'https://www.raycast.com/settings/billing',
    description: 'AI launcher & custom extensions for Mac',
    aliases: ['raycast', 'raycast pro']
  },
  {
    name: 'Loom Business',
    category: 'Software',
    defaultAmount: 12.50,
    currency: 'USD',
    billingCycle: 'monthly',
    color: '#625DF5',
    websiteUrl: 'https://loom.com',
    cancelUrl: 'https://www.loom.com/settings/billing',
    description: 'Screen recording and video messaging',
    aliases: ['loom', 'loom inc', 'loom video']
  },
  {
    name: 'Canva Pro',
    category: 'Software',
    defaultAmount: 14.99,
    currency: 'USD',
    billingCycle: 'monthly',
    color: '#00C4CC',
    websiteUrl: 'https://canva.com',
    cancelUrl: 'https://www.canva.com/settings/billing',
    description: 'Graphic design, brand kits & premium templates',
    aliases: ['canva', 'canva pro', 'canva pty ltd']
  },

  // --- Cloud, Infrastructure & Storage ---
  {
    name: 'AWS Cloud Services',
    category: 'Cloud',
    defaultAmount: 42.50,
    currency: 'USD',
    billingCycle: 'monthly',
    color: '#FF9900',
    websiteUrl: 'https://aws.amazon.com',
    cancelUrl: 'https://console.aws.amazon.com/billing',
    description: 'EC2, S3, RDS, Lambda cloud compute',
    aliases: ['aws', 'amazon web services', 'aws emea', 'aws cloud']
  },
  {
    name: 'Vercel Pro',
    category: 'Cloud',
    defaultAmount: 20.00,
    currency: 'USD',
    billingCycle: 'monthly',
    color: '#000000',
    websiteUrl: 'https://vercel.com',
    cancelUrl: 'https://vercel.com/dashboard/billing',
    description: 'Next.js frontend cloud & serverless deployments',
    aliases: ['vercel', 'vercel pro', 'zeit vercel', 'vercel.com']
  },
  {
    name: 'Supabase Pro',
    category: 'Cloud',
    defaultAmount: 25.00,
    currency: 'USD',
    billingCycle: 'monthly',
    color: '#3ECF8E',
    websiteUrl: 'https://supabase.com',
    cancelUrl: 'https://supabase.com/dashboard/org/_/billing',
    description: 'Postgres database, Auth, Storage & Realtime',
    aliases: ['supabase', 'supabase pro', 'supabase.com']
  },
  {
    name: 'Apple One Individual',
    category: 'Cloud',
    defaultAmount: 19.95,
    currency: 'USD',
    billingCycle: 'monthly',
    color: '#555555',
    websiteUrl: 'https://apple.com/apple-one',
    cancelUrl: 'https://support.apple.com/billing',
    description: 'Apple Music, TV+, Arcade, 50GB iCloud+',
    aliases: ['apple one', 'apple one individual', 'apple services']
  },
  {
    name: 'Apple One Family',
    category: 'Cloud',
    defaultAmount: 25.95,
    currency: 'USD',
    billingCycle: 'monthly',
    color: '#555555',
    websiteUrl: 'https://apple.com/apple-one',
    cancelUrl: 'https://support.apple.com/billing',
    description: 'Apple Music, TV+, Arcade, 200GB iCloud+ for up to 6',
    aliases: ['apple one family', 'apple family']
  },
  {
    name: 'Apple One Premier',
    category: 'Cloud',
    defaultAmount: 37.95,
    currency: 'USD',
    billingCycle: 'monthly',
    color: '#555555',
    websiteUrl: 'https://apple.com/apple-one',
    cancelUrl: 'https://support.apple.com/billing',
    description: 'Apple Music, TV+, Arcade, 2TB iCloud+, Fitness+, News+ for up to 6',
    aliases: ['apple one premier', 'apple one premier plan', 'apple premier']
  },
  {
    name: 'iCloud+ 200GB',
    category: 'Cloud',
    defaultAmount: 2.99,
    currency: 'USD',
    billingCycle: 'monthly',
    color: '#3B82F6',
    websiteUrl: 'https://apple.com/icloud',
    cancelUrl: 'https://support.apple.com/billing',
    description: '200GB cloud storage, Private Relay, Hide My Email',
    aliases: ['icloud', 'icloud+', 'icloud storage', 'apple icloud']
  },
  {
    name: 'Google Workspace Business',
    category: 'Cloud',
    defaultAmount: 14.00,
    currency: 'USD',
    billingCycle: 'monthly',
    color: '#4285F4',
    websiteUrl: 'https://workspace.google.com',
    cancelUrl: 'https://admin.google.com/ac/billing',
    description: 'Custom Gmail, Google Drive, Meet, Docs',
    aliases: ['google workspace', 'gsuite', 'google apps', 'google *workspace']
  },
  {
    name: 'Google One 2TB',
    category: 'Cloud',
    defaultAmount: 9.99,
    currency: 'USD',
    billingCycle: 'monthly',
    color: '#EA4335',
    websiteUrl: 'https://one.google.com',
    cancelUrl: 'https://one.google.com/settings',
    description: '2TB cloud storage across Photos, Drive & Gmail',
    aliases: ['google one', 'google storage', 'google *google one']
  },
  {
    name: 'Microsoft 365 Personal',
    category: 'Software',
    defaultAmount: 6.99,
    currency: 'USD',
    billingCycle: 'monthly',
    color: '#D83B01',
    websiteUrl: 'https://microsoft365.com',
    cancelUrl: 'https://account.microsoft.com/services',
    description: 'Word, Excel, PowerPoint & 1TB OneDrive',
    aliases: ['microsoft 365', 'office 365', 'msft *365', 'microsoft office']
  },

  // --- Gaming ---
  {
    name: 'Xbox Game Pass Ultimate',
    category: 'Gaming',
    defaultAmount: 19.99,
    currency: 'USD',
    billingCycle: 'monthly',
    color: '#107C10',
    websiteUrl: 'https://xbox.com/gamepass',
    cancelUrl: 'https://account.microsoft.com/services',
    description: 'Hundreds of games on PC, Console and Cloud',
    aliases: ['xbox', 'xbox game pass', 'game pass ultimate', 'microsoft xbox']
  },
  {
    name: 'PlayStation Plus Extra',
    category: 'Gaming',
    defaultAmount: 14.99,
    currency: 'USD',
    billingCycle: 'monthly',
    color: '#003791',
    websiteUrl: 'https://playstation.com/ps-plus',
    cancelUrl: 'https://www.playstation.com/acct/management',
    description: 'Online multiplayer + PS4 & PS5 Game Catalog',
    aliases: ['playstation', 'ps plus', 'psn', 'sony interactive', 'playstation plus']
  },
  {
    name: 'Nintendo Switch Online',
    category: 'Gaming',
    defaultAmount: 19.99,
    currency: 'USD',
    billingCycle: 'yearly',
    color: '#E60012',
    websiteUrl: 'https://nintendo.com/switch-online',
    cancelUrl: 'https://ec.nintendo.com/my/membership',
    description: 'Online multiplayer, Cloud saves & NES/SNES classics',
    aliases: ['nintendo', 'switch online', 'nintendo switch online']
  },
  {
    name: 'Discord Nitro',
    category: 'Gaming',
    defaultAmount: 9.99,
    currency: 'USD',
    billingCycle: 'monthly',
    color: '#5865F2',
    websiteUrl: 'https://discord.com/nitro',
    cancelUrl: 'https://discord.com/app/settings/subscriptions',
    description: 'HD streaming, 500MB uploads, custom emojis',
    aliases: ['discord', 'discord nitro', 'discord inc']
  },

  // --- Fitness, Health & Lifestyle ---
  {
    name: 'Strava Subscription',
    category: 'Fitness',
    defaultAmount: 11.99,
    currency: 'USD',
    billingCycle: 'monthly',
    color: '#FC4C02',
    websiteUrl: 'https://strava.com',
    cancelUrl: 'https://www.strava.com/settings/billing',
    description: 'Route planning, training analysis & segments',
    aliases: ['strava', 'strava summit', 'strava inc']
  },
  {
    name: 'Whoop Membership',
    category: 'Fitness',
    defaultAmount: 30.00,
    currency: 'USD',
    billingCycle: 'monthly',
    color: '#000000',
    websiteUrl: 'https://whoop.com',
    cancelUrl: 'https://app.whoop.com/membership',
    description: '24/7 fitness tracker, recovery & sleep coach',
    aliases: ['whoop', 'whoop strap', 'whoop inc']
  },
  {
    name: 'Duolingo Super',
    category: 'Education',
    defaultAmount: 12.99,
    currency: 'USD',
    billingCycle: 'monthly',
    color: '#58CC02',
    websiteUrl: 'https://duolingo.com',
    cancelUrl: 'https://www.duolingo.com/settings/super',
    description: 'Unlimited hearts, no ads, progress reviews',
    aliases: ['duolingo', 'duolingo super', 'duolingo plus']
  },
  {
    name: 'Gym Membership',
    category: 'Fitness',
    defaultAmount: 65.00,
    currency: 'USD',
    billingCycle: 'monthly',
    color: '#E63946',
    websiteUrl: '',
    description: 'Monthly fitness club access',
    aliases: ['gym', 'equinox', 'anytime fitness', 'planet fitness', 'crunch fitness', 'puregym', 'lifetime fitness']
  },

  // --- News & Reading ---
  {
    name: 'The New York Times',
    category: 'News',
    defaultAmount: 4.00,
    currency: 'USD',
    billingCycle: 'monthly',
    color: '#1A1A1A',
    websiteUrl: 'https://nytimes.com',
    cancelUrl: 'https://www.nytimes.com/subscription/cancel',
    description: 'All Access: News, Games, Cooking, Wirecutter, Athletic',
    aliases: ['nytimes', 'new york times', 'nyt all access', 'the new york times']
  },
  {
    name: 'The Wall Street Journal',
    category: 'News',
    defaultAmount: 9.99,
    currency: 'USD',
    billingCycle: 'monthly',
    color: '#008080',
    websiteUrl: 'https://wsj.com',
    cancelUrl: 'https://customercenter.wsj.com/',
    description: 'Business news, markets analysis and reporting',
    aliases: ['wsj', 'wall street journal', 'dow jones *wsj']
  },
  {
    name: 'Medium Membership',
    category: 'News',
    defaultAmount: 5.00,
    currency: 'USD',
    billingCycle: 'monthly',
    color: '#000000',
    websiteUrl: 'https://medium.com',
    cancelUrl: 'https://medium.com/me/settings/membership',
    description: 'Unlimited member stories and author support',
    aliases: ['medium', 'medium membership', 'medium.com']
  }
];

export const CATEGORY_COLORS: Record<string, string> = {
  Streaming: '#3B82F6', // Blue
  Music: '#10B981',     // Green
  Software: '#8B5CF6',  // Purple
  Gaming: '#EC4899',   // Pink
  Fitness: '#EF4444',   // Red
  Cloud: '#06B6D4',     // Cyan
  Utilities: '#F59E0B', // Amber
  News: '#6366F1',      // Indigo
  Education: '#14B8A6', // Teal
  Other: '#64748B'      // Slate
};

export const CATEGORIES = [
  'Streaming',
  'Music',
  'Software',
  'Gaming',
  'Fitness',
  'Cloud',
  'Utilities',
  'News',
  'Education',
  'Other'
];

import { GLOBAL_CURRENCIES } from './locationCurrency';

export const CURRENCIES = GLOBAL_CURRENCIES;


/**
 * Intelligent matcher that finds a catalog service given a name, partial keyword, or pasted URL.
 */
export function findCatalogService(input: string): CatalogService | null {
  if (!input || !input.trim()) return null;
  const clean = input.trim().toLowerCase().replace(/^https?:\/\/(www\.)?/, '').replace(/\/.*$/, '');

  // Exact name match
  const exact = POPULAR_SERVICES.find(s => s.name.toLowerCase() === clean);
  if (exact) return exact;

  // Exact alias or domain match
  const aliasMatch = POPULAR_SERVICES.find(s =>
    s.aliases.some(a => a.toLowerCase() === clean || clean.includes(a.toLowerCase()))
  );
  if (aliasMatch) return aliasMatch;

  // Starts-with name match
  const prefixMatch = POPULAR_SERVICES.find(s => s.name.toLowerCase().startsWith(clean));
  if (prefixMatch) return prefixMatch;

  // Word match
  const wordMatch = POPULAR_SERVICES.find(s => s.name.toLowerCase().includes(clean));
  if (wordMatch) return wordMatch;

  return null;
}

/**
 * Returns prioritized suggestions matching a query
 */
export function searchCatalog(query: string, limit = 8): CatalogService[] {
  if (!query || !query.trim()) return POPULAR_SERVICES.slice(0, limit);
  const q = query.trim().toLowerCase();

  const results = POPULAR_SERVICES.filter(s => {
    const nameMatch = s.name.toLowerCase().includes(q);
    const catMatch = s.category.toLowerCase().includes(q);
    const aliasMatch = s.aliases.some(a => a.toLowerCase().includes(q));
    return nameMatch || catMatch || aliasMatch;
  });

  return results.slice(0, limit);
}
