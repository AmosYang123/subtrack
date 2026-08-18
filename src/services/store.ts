import { create } from 'zustand';
import {
  Subscription,
  PaymentMethod,
  FilterState,
  ThemeMode,
  ActiveTab,
  SubscriptionStatus
} from '../types';
import { fetchLiveExchangeRates, FALLBACK_RATES } from './currencyApi';
import { REAL_DATA_PRESETS } from '../utils/presets';

interface AppStore {
  // State
  subscriptions: Subscription[];
  paymentMethods: PaymentMethod[];
  theme: ThemeMode;
  currency: string;
  exchangeRates: Record<string, number>;
  ratesLastUpdated: string | null;
  isRatesLoading: boolean;
  activeTab: ActiveTab;
  filters: FilterState;
  editingSubscription: Subscription | null;
  isAddEditModalOpen: boolean;
  isEmailScanModalOpen: boolean;
  isImportExportModalOpen: boolean;
  isPaymentMethodsModalOpen: boolean;

  // Actions
  addSubscription: (sub: Omit<Subscription, 'id' | 'createdAt'>) => void;
  updateSubscription: (id: string, updates: Partial<Subscription>) => void;
  deleteSubscription: (id: string) => void;
  toggleSubscriptionStatus: (id: string, status?: SubscriptionStatus) => void;
  importSubscriptions: (subs: Subscription[]) => void;
  clearAllSubscriptions: () => void;
  loadPreset: (presetId: string) => void;
  
  addPaymentMethod: (method: Omit<PaymentMethod, 'id'>) => void;
  deletePaymentMethod: (id: string) => void;
  setDefaultPaymentMethod: (id: string) => void;

  setTheme: (theme: ThemeMode) => void;
  setCurrency: (currency: string) => void;
  fetchRates: () => Promise<void>;
  setActiveTab: (tab: ActiveTab) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;

  openAddModal: () => void;
  openEditModal: (sub: Subscription) => void;
  closeAddEditModal: () => void;
  setEmailScanModalOpen: (open: boolean) => void;
  setImportExportModalOpen: (open: boolean) => void;
  setPaymentMethodsModalOpen: (open: boolean) => void;
}

const STORAGE_SUBS_KEY = 'subtrack_subscriptions_v3';
const STORAGE_PAYMENTS_KEY = 'subtrack_payment_methods_v3';
const STORAGE_THEME_KEY = 'subtrack_theme';
const STORAGE_CURRENCY_KEY = 'subtrack_currency';

// Default to Tech & AI Engineer preset if first time opening
const DEFAULT_PRESET = REAL_DATA_PRESETS[0];

const INITIAL_SUBSCRIPTIONS: Subscription[] = DEFAULT_PRESET.subscriptions.map((s, i) => ({
  ...s,
  id: `sub_${Date.now()}_${i}`,
  createdAt: new Date().toISOString()
}));

const INITIAL_PAYMENT_METHODS: PaymentMethod[] = DEFAULT_PRESET.paymentMethods;

const DEFAULT_FILTERS: FilterState = {
  searchTerm: '',
  category: 'all',
  status: 'all',
  billingCycle: 'all',
  paymentMethodId: 'all',
  sortBy: 'nextBilling',
  sortOrder: 'asc',
  viewMode: 'table'
};

function loadStored<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function persist<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Failed to persist to ${key}:`, err);
  }
}

export const useAppStore = create<AppStore>((set, get) => ({
  subscriptions: loadStored<Subscription[]>(STORAGE_SUBS_KEY, INITIAL_SUBSCRIPTIONS),
  paymentMethods: loadStored<PaymentMethod[]>(STORAGE_PAYMENTS_KEY, INITIAL_PAYMENT_METHODS),
  theme: (localStorage.getItem(STORAGE_THEME_KEY) as ThemeMode) || 'light',
  currency: localStorage.getItem(STORAGE_CURRENCY_KEY) || 'USD',
  exchangeRates: FALLBACK_RATES,
  ratesLastUpdated: null,
  isRatesLoading: false,
  activeTab: 'subscriptions',
  filters: DEFAULT_FILTERS,
  editingSubscription: null,
  isAddEditModalOpen: false,
  isEmailScanModalOpen: false,
  isImportExportModalOpen: false,
  isPaymentMethodsModalOpen: false,

  fetchRates: async () => {
    set({ isRatesLoading: true });
    try {
      const data = await fetchLiveExchangeRates(get().currency);
      set({
        exchangeRates: data.rates,
        ratesLastUpdated: data.lastUpdated,
        isRatesLoading: false
      });
    } catch {
      set({ isRatesLoading: false });
    }
  },

  addSubscription: (subData) => {
    const newSub: Subscription = {
      ...subData,
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString()
    };
    const updated = [newSub, ...get().subscriptions];
    persist(STORAGE_SUBS_KEY, updated);
    set({ subscriptions: updated, isAddEditModalOpen: false });
  },

  updateSubscription: (id, updates) => {
    const updated = get().subscriptions.map(s => (s.id === id ? { ...s, ...updates } : s));
    persist(STORAGE_SUBS_KEY, updated);
    set({ subscriptions: updated, isAddEditModalOpen: false, editingSubscription: null });
  },

  deleteSubscription: (id) => {
    const updated = get().subscriptions.filter(s => s.id !== id);
    persist(STORAGE_SUBS_KEY, updated);
    set({ subscriptions: updated });
  },

  toggleSubscriptionStatus: (id, newStatus) => {
    const updated = get().subscriptions.map(s => {
      if (s.id === id) {
        const nextStatus = newStatus || (s.status === 'active' ? 'paused' : 'active');
        return { ...s, status: nextStatus };
      }
      return s;
    });
    persist(STORAGE_SUBS_KEY, updated);
    set({ subscriptions: updated });
  },

  importSubscriptions: (newSubs) => {
    const existing = get().subscriptions;
    // Deduplicate by name if identical name already exists
    const toAdd = newSubs.filter(
      ns => !existing.some(es => es.name.toLowerCase() === ns.name.toLowerCase())
    );
    const merged = [...toAdd, ...existing];
    persist(STORAGE_SUBS_KEY, merged);
    set({ subscriptions: merged });
  },

  clearAllSubscriptions: () => {
    persist(STORAGE_SUBS_KEY, []);
    set({ subscriptions: [] });
  },

  loadPreset: (presetId: string) => {
    const preset = REAL_DATA_PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    const newSubs: Subscription[] = preset.subscriptions.map((s, i) => ({
      ...s,
      id: `sub_${Date.now()}_${i}`,
      createdAt: new Date().toISOString()
    }));

    persist(STORAGE_SUBS_KEY, newSubs);
    persist(STORAGE_PAYMENTS_KEY, preset.paymentMethods);
    set({
      subscriptions: newSubs,
      paymentMethods: preset.paymentMethods,
      currency: preset.currency
    });
  },

  addPaymentMethod: (methodData) => {
    const newMethod: PaymentMethod = {
      ...methodData,
      id: `pm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
    };
    let updated = [...get().paymentMethods, newMethod];
    if (newMethod.isDefault) {
      updated = updated.map(m => (m.id === newMethod.id ? m : { ...m, isDefault: false }));
    }
    persist(STORAGE_PAYMENTS_KEY, updated);
    set({ paymentMethods: updated });
  },

  deletePaymentMethod: (id) => {
    const updated = get().paymentMethods.filter(m => m.id !== id);
    persist(STORAGE_PAYMENTS_KEY, updated);
    set({ paymentMethods: updated });
  },

  setDefaultPaymentMethod: (id) => {
    const updated = get().paymentMethods.map(m => ({
      ...m,
      isDefault: m.id === id
    }));
    persist(STORAGE_PAYMENTS_KEY, updated);
    set({ paymentMethods: updated });
  },

  setTheme: (theme) => {
    localStorage.setItem(STORAGE_THEME_KEY, theme);
    document.documentElement.setAttribute('data-bs-theme', theme === 'dark' ? 'dark' : 'light');
    document.body.className = theme === 'dark' ? 'theme-dark' : 'theme-light';
    set({ theme });
  },

  setCurrency: (currency) => {
    localStorage.setItem(STORAGE_CURRENCY_KEY, currency);
    set({ currency });
    get().fetchRates();
  },

  setActiveTab: (activeTab) => set({ activeTab }),

  setFilters: (filterUpdates) =>
    set({ filters: { ...get().filters, ...filterUpdates } }),

  resetFilters: () => set({ filters: DEFAULT_FILTERS }),

  openAddModal: () => set({ editingSubscription: null, isAddEditModalOpen: true }),

  openEditModal: (sub) => set({ editingSubscription: sub, isAddEditModalOpen: true }),

  closeAddEditModal: () => set({ editingSubscription: null, isAddEditModalOpen: false }),

  setEmailScanModalOpen: (isEmailScanModalOpen) => set({ isEmailScanModalOpen }),

  setImportExportModalOpen: (isImportExportModalOpen) => set({ isImportExportModalOpen }),

  setPaymentMethodsModalOpen: (isPaymentMethodsModalOpen) => set({ isPaymentMethodsModalOpen })
}));

// Backwards compatibility stub for older imports
export const useStore = useAppStore;

// Initial rate fetch
if (typeof window !== 'undefined') {
  setTimeout(() => {
    useAppStore.getState().fetchRates();
  }, 100);
}
