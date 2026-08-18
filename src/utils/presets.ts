import { PresetProfile, PaymentMethod } from '../types';
import { format, addDays } from 'date-fns';

const today = new Date();

const DEV_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'pm_corp',
    brand: 'Mastercard',
    lastFour: '8812',
    name: 'Company Expense Card',
    expiryMonth: 9,
    expiryYear: 2027,
    isDefault: true
  },
  {
    id: 'pm_personal',
    brand: 'Visa',
    lastFour: '4242',
    name: 'Personal Sapphire Reserve',
    expiryMonth: 12,
    expiryYear: 2028,
    isDefault: false
  },
  {
    id: 'pm_apple',
    brand: 'Apple Pay',
    lastFour: '1099',
    name: 'Apple Card Wallet',
    expiryMonth: 4,
    expiryYear: 2029,
    isDefault: false
  }
];

const CREATOR_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'pm_creator_biz',
    brand: 'Amex',
    lastFour: '3004',
    name: 'Amex Business Gold',
    expiryMonth: 11,
    expiryYear: 2027,
    isDefault: true
  },
  {
    id: 'pm_creator_pers',
    brand: 'Visa',
    lastFour: '7721',
    name: 'Chase Debit Card',
    expiryMonth: 6,
    expiryYear: 2028,
    isDefault: false
  }
];

const FAMILY_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'pm_joint',
    brand: 'Visa',
    lastFour: '9140',
    name: 'Joint Family Visa',
    expiryMonth: 10,
    expiryYear: 2027,
    isDefault: true
  },
  {
    id: 'pm_amazon',
    brand: 'Amex',
    lastFour: '5002',
    name: 'Prime Rewards Card',
    expiryMonth: 1,
    expiryYear: 2028,
    isDefault: false
  }
];

export const REAL_DATA_PRESETS: PresetProfile[] = [
  {
    id: 'tech_dev',
    title: 'Tech & AI Engineer',
    description: 'Modern developer stack: AI assistants, cloud infrastructure, team tools and code editor.',
    badge: 'Popular',
    currency: 'USD',
    paymentMethods: DEV_PAYMENT_METHODS,
    subscriptions: [
      {
        name: 'Cursor Pro',
        amount: 20.00,
        currency: 'USD',
        billingCycle: 'monthly',
        nextBillingDate: format(addDays(today, 3), 'yyyy-MM-dd'),
        category: 'Software',
        paymentMethodId: 'pm_corp',
        notes: 'AI Code Editor for team work',
        status: 'active',
        websiteUrl: 'https://cursor.com',
        remindDaysBefore: 2,
        color: '#000000'
      },
      {
        name: 'ChatGPT Plus',
        amount: 20.00,
        currency: 'USD',
        billingCycle: 'monthly',
        nextBillingDate: format(addDays(today, 5), 'yyyy-MM-dd'),
        category: 'Software',
        paymentMethodId: 'pm_personal',
        notes: 'GPT-4o & Canvas access for research',
        status: 'active',
        websiteUrl: 'https://chat.openai.com',
        remindDaysBefore: 3,
        color: '#10A37F'
      },
      {
        name: 'Claude Pro',
        amount: 20.00,
        currency: 'USD',
        billingCycle: 'monthly',
        nextBillingDate: format(addDays(today, 14), 'yyyy-MM-dd'),
        category: 'Software',
        paymentMethodId: 'pm_corp',
        notes: 'Claude 3.5 Sonnet coding assistance',
        status: 'active',
        websiteUrl: 'https://claude.ai',
        remindDaysBefore: 2,
        color: '#D97706'
      },
      {
        name: 'GitHub Copilot',
        amount: 10.00,
        currency: 'USD',
        billingCycle: 'monthly',
        nextBillingDate: format(addDays(today, 8), 'yyyy-MM-dd'),
        category: 'Software',
        paymentMethodId: 'pm_corp',
        notes: 'IDE auto-completion',
        status: 'active',
        websiteUrl: 'https://github.com',
        remindDaysBefore: 3,
        color: '#24292F'
      },
      {
        name: 'AWS Cloud Services',
        amount: 42.50,
        currency: 'USD',
        billingCycle: 'monthly',
        nextBillingDate: format(addDays(today, 1), 'yyyy-MM-dd'),
        category: 'Cloud',
        paymentMethodId: 'pm_corp',
        notes: 'EC2, S3, RDS database hosting',
        status: 'active',
        websiteUrl: 'https://aws.amazon.com',
        remindDaysBefore: 1,
        color: '#FF9900'
      },
      {
        name: 'Vercel Pro',
        amount: 20.00,
        currency: 'USD',
        billingCycle: 'monthly',
        nextBillingDate: format(addDays(today, 19), 'yyyy-MM-dd'),
        category: 'Cloud',
        paymentMethodId: 'pm_corp',
        notes: 'Frontend deployment & edge functions',
        status: 'active',
        websiteUrl: 'https://vercel.com',
        remindDaysBefore: 2,
        color: '#000000'
      },
      {
        name: 'Supabase Pro',
        amount: 25.00,
        currency: 'USD',
        billingCycle: 'monthly',
        nextBillingDate: format(addDays(today, 22), 'yyyy-MM-dd'),
        category: 'Cloud',
        paymentMethodId: 'pm_corp',
        notes: 'Production Postgres database instance',
        status: 'active',
        websiteUrl: 'https://supabase.com',
        remindDaysBefore: 3,
        color: '#3ECF8E'
      },
      {
        name: 'Figma Professional',
        amount: 15.00,
        currency: 'USD',
        billingCycle: 'monthly',
        nextBillingDate: format(addDays(today, 11), 'yyyy-MM-dd'),
        category: 'Software',
        paymentMethodId: 'pm_corp',
        notes: 'UI/UX design workspace',
        status: 'active',
        websiteUrl: 'https://figma.com',
        remindDaysBefore: 2,
        color: '#F24E1E'
      },
      {
        name: '1Password Individual',
        amount: 2.99,
        currency: 'USD',
        billingCycle: 'monthly',
        nextBillingDate: format(addDays(today, 26), 'yyyy-MM-dd'),
        category: 'Software',
        paymentMethodId: 'pm_personal',
        notes: 'Password & 2FA security vault',
        status: 'active',
        websiteUrl: 'https://1password.com',
        remindDaysBefore: 5,
        color: '#0A85EA'
      },
      {
        name: 'Spotify Individual',
        amount: 11.99,
        currency: 'USD',
        billingCycle: 'monthly',
        nextBillingDate: format(addDays(today, 6), 'yyyy-MM-dd'),
        category: 'Music',
        paymentMethodId: 'pm_personal',
        notes: 'Ad-free focus music & podcasts',
        status: 'active',
        websiteUrl: 'https://spotify.com',
        remindDaysBefore: 3,
        color: '#1DB954'
      },
      {
        name: 'Loom Business',
        amount: 12.50,
        currency: 'USD',
        billingCycle: 'monthly',
        nextBillingDate: format(addDays(today, 17), 'yyyy-MM-dd'),
        category: 'Software',
        paymentMethodId: 'pm_corp',
        notes: 'Async demo videos & bug repro recordings',
        status: 'active',
        websiteUrl: 'https://loom.com',
        remindDaysBefore: 2,
        color: '#625DF5'
      }
    ]
  },

  {
    id: 'creator',
    title: 'Content Creator & Nomad',
    description: 'Design suite, AI media tools, streaming, cloud storage and productivity apps.',
    badge: 'Creative',
    currency: 'USD',
    paymentMethods: CREATOR_PAYMENT_METHODS,
    subscriptions: [
      {
        name: 'Adobe Creative Cloud',
        amount: 59.99,
        currency: 'USD',
        billingCycle: 'monthly',
        nextBillingDate: format(addDays(today, 4), 'yyyy-MM-dd'),
        category: 'Software',
        paymentMethodId: 'pm_creator_biz',
        notes: 'Premiere Pro, After Effects, Photoshop',
        status: 'active',
        websiteUrl: 'https://adobe.com',
        remindDaysBefore: 3,
        color: '#FF0000'
      },
      {
        name: 'Midjourney Standard',
        amount: 30.00,
        currency: 'USD',
        billingCycle: 'monthly',
        nextBillingDate: format(addDays(today, 9), 'yyyy-MM-dd'),
        category: 'Software',
        paymentMethodId: 'pm_creator_biz',
        notes: 'AI image generation & thumbnail asset generator',
        status: 'active',
        websiteUrl: 'https://midjourney.com',
        remindDaysBefore: 2,
        color: '#2B2D42'
      },
      {
        name: 'YouTube Premium',
        amount: 13.99,
        currency: 'USD',
        billingCycle: 'monthly',
        nextBillingDate: format(addDays(today, 12), 'yyyy-MM-dd'),
        category: 'Streaming',
        paymentMethodId: 'pm_creator_pers',
        notes: 'Ad-free YouTube & background audio',
        status: 'active',
        websiteUrl: 'https://youtube.com/premium',
        remindDaysBefore: 3,
        color: '#FF0000'
      },
      {
        name: 'Apple One Individual',
        amount: 19.95,
        currency: 'USD',
        billingCycle: 'monthly',
        nextBillingDate: format(addDays(today, 18), 'yyyy-MM-dd'),
        category: 'Cloud',
        paymentMethodId: 'pm_creator_pers',
        notes: 'Apple Music, TV+, Arcade & iCloud+',
        status: 'active',
        websiteUrl: 'https://apple.com/apple-one',
        remindDaysBefore: 4,
        color: '#555555'
      },
      {
        name: 'Notion Plus',
        amount: 10.00,
        currency: 'USD',
        billingCycle: 'monthly',
        nextBillingDate: format(addDays(today, 15), 'yyyy-MM-dd'),
        category: 'Software',
        paymentMethodId: 'pm_creator_biz',
        notes: 'Content calendar, sponsor tracker & notes',
        status: 'active',
        websiteUrl: 'https://notion.so',
        remindDaysBefore: 2,
        color: '#000000'
      },
      {
        name: 'Google Workspace Business',
        amount: 14.00,
        currency: 'USD',
        billingCycle: 'monthly',
        nextBillingDate: format(addDays(today, 21), 'yyyy-MM-dd'),
        category: 'Cloud',
        paymentMethodId: 'pm_creator_biz',
        notes: 'Custom business email & 2TB Drive',
        status: 'active',
        websiteUrl: 'https://workspace.google.com',
        remindDaysBefore: 3,
        color: '#4285F4'
      },
      {
        name: 'Canva Pro',
        amount: 14.99,
        currency: 'USD',
        billingCycle: 'monthly',
        nextBillingDate: format(addDays(today, 24), 'yyyy-MM-dd'),
        category: 'Software',
        paymentMethodId: 'pm_creator_biz',
        notes: 'Social media templates & quick graphics',
        status: 'active',
        websiteUrl: 'https://canva.com',
        remindDaysBefore: 2,
        color: '#00C4CC'
      },
      {
        name: 'Strava Subscription',
        amount: 11.99,
        currency: 'USD',
        billingCycle: 'monthly',
        nextBillingDate: format(addDays(today, 7), 'yyyy-MM-dd'),
        category: 'Fitness',
        paymentMethodId: 'pm_creator_pers',
        notes: 'Running and cycling GPS analytics',
        status: 'active',
        websiteUrl: 'https://strava.com',
        remindDaysBefore: 2,
        color: '#FC4C02'
      }
    ]
  },

  {
    id: 'family',
    title: 'Household & Family',
    description: 'Shared streaming platforms, family music bundle, gym and news subscriptions.',
    badge: 'Household',
    currency: 'USD',
    paymentMethods: FAMILY_PAYMENT_METHODS,
    subscriptions: [
      {
        name: 'Netflix Premium 4K',
        amount: 22.99,
        currency: 'USD',
        billingCycle: 'monthly',
        nextBillingDate: format(addDays(today, 2), 'yyyy-MM-dd'),
        category: 'Streaming',
        paymentMethodId: 'pm_joint',
        notes: '4K family plan for living room and bedrooms',
        status: 'active',
        websiteUrl: 'https://netflix.com',
        remindDaysBefore: 3,
        color: '#E50914'
      },
      {
        name: 'Disney+ Standard',
        amount: 13.99,
        currency: 'USD',
        billingCycle: 'monthly',
        nextBillingDate: format(addDays(today, 8), 'yyyy-MM-dd'),
        category: 'Streaming',
        paymentMethodId: 'pm_joint',
        notes: 'Disney & Pixar movies for kids',
        status: 'active',
        websiteUrl: 'https://disneyplus.com',
        remindDaysBefore: 3,
        color: '#113CCF'
      },
      {
        name: 'Amazon Prime',
        amount: 139.00,
        currency: 'USD',
        billingCycle: 'yearly',
        nextBillingDate: format(addDays(today, 68), 'yyyy-MM-dd'),
        category: 'Streaming',
        paymentMethodId: 'pm_amazon',
        notes: 'Free fast delivery + Prime Video',
        status: 'active',
        websiteUrl: 'https://amazon.com/prime',
        remindDaysBefore: 7,
        color: '#FF9900'
      },
      {
        name: 'Spotify Family',
        amount: 19.99,
        currency: 'USD',
        billingCycle: 'monthly',
        nextBillingDate: format(addDays(today, 13), 'yyyy-MM-dd'),
        category: 'Music',
        paymentMethodId: 'pm_joint',
        notes: '6 individual accounts for household',
        status: 'active',
        websiteUrl: 'https://spotify.com/family',
        remindDaysBefore: 3,
        color: '#1DB954'
      },
      {
        name: 'Apple One Family',
        amount: 25.95,
        currency: 'USD',
        billingCycle: 'monthly',
        nextBillingDate: format(addDays(today, 20), 'yyyy-MM-dd'),
        category: 'Cloud',
        paymentMethodId: 'pm_joint',
        notes: 'Family iCloud 200GB photo backup + Arcade',
        status: 'active',
        websiteUrl: 'https://apple.com/apple-one',
        remindDaysBefore: 3,
        color: '#555555'
      },
      {
        name: 'Gym Membership',
        amount: 65.00,
        currency: 'USD',
        billingCycle: 'monthly',
        nextBillingDate: format(addDays(today, 1), 'yyyy-MM-dd'),
        category: 'Fitness',
        paymentMethodId: 'pm_joint',
        notes: 'Local fitness club with pool and sauna',
        status: 'active',
        websiteUrl: '',
        remindDaysBefore: 1,
        color: '#E63946'
      },
      {
        name: 'The New York Times',
        amount: 4.00,
        currency: 'USD',
        billingCycle: 'monthly',
        nextBillingDate: format(addDays(today, 27), 'yyyy-MM-dd'),
        category: 'News',
        paymentMethodId: 'pm_joint',
        notes: 'Digital news & Sunday crosswords',
        status: 'active',
        websiteUrl: 'https://nytimes.com',
        remindDaysBefore: 4,
        color: '#1A1A1A'
      },
      {
        name: 'Xbox Game Pass Ultimate',
        amount: 19.99,
        currency: 'USD',
        billingCycle: 'monthly',
        nextBillingDate: format(addDays(today, 16), 'yyyy-MM-dd'),
        category: 'Gaming',
        paymentMethodId: 'pm_joint',
        notes: 'Console & PC gaming pass',
        status: 'active',
        websiteUrl: 'https://xbox.com/gamepass',
        remindDaysBefore: 2,
        color: '#107C10'
      }
    ]
  },

  {
    id: 'minimalist',
    title: 'Modern Minimalist',
    description: 'Lean essential services: daily music, secure cloud storage and core AI tool.',
    badge: 'Essential',
    currency: 'USD',
    paymentMethods: [
      {
        id: 'pm_apple_card',
        brand: 'Apple Pay',
        lastFour: '9012',
        name: 'Apple Card',
        expiryMonth: 8,
        expiryYear: 2028,
        isDefault: true
      }
    ],
    subscriptions: [
      {
        name: 'Spotify Individual',
        amount: 11.99,
        currency: 'USD',
        billingCycle: 'monthly',
        nextBillingDate: format(addDays(today, 7), 'yyyy-MM-dd'),
        category: 'Music',
        paymentMethodId: 'pm_apple_card',
        notes: 'Daily music',
        status: 'active',
        websiteUrl: 'https://spotify.com',
        remindDaysBefore: 3,
        color: '#1DB954'
      },
      {
        name: 'iCloud+ 200GB',
        amount: 2.99,
        currency: 'USD',
        billingCycle: 'monthly',
        nextBillingDate: format(addDays(today, 14), 'yyyy-MM-dd'),
        category: 'Cloud',
        paymentMethodId: 'pm_apple_card',
        notes: 'iPhone backup & iCloud photos',
        status: 'active',
        websiteUrl: 'https://apple.com/icloud',
        remindDaysBefore: 2,
        color: '#3B82F6'
      },
      {
        name: 'ChatGPT Plus',
        amount: 20.00,
        currency: 'USD',
        billingCycle: 'monthly',
        nextBillingDate: format(addDays(today, 21), 'yyyy-MM-dd'),
        category: 'Software',
        paymentMethodId: 'pm_apple_card',
        notes: 'Writing and coding assistant',
        status: 'active',
        websiteUrl: 'https://chat.openai.com',
        remindDaysBefore: 2,
        color: '#10A37F'
      }
    ]
  },

  {
    id: 'empty',
    title: 'Clean Slate',
    description: 'Start fresh with 0 subscriptions. Ready to add your own real subscriptions.',
    badge: 'Fresh',
    currency: 'USD',
    paymentMethods: [
      {
        id: 'pm_primary',
        brand: 'Visa',
        lastFour: '0000',
        name: 'Primary Card',
        expiryMonth: 12,
        expiryYear: 2028,
        isDefault: true
      }
    ],
    subscriptions: []
  }
];
