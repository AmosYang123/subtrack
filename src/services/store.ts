import { create } from 'zustand';
import {
  Subscription,
  PaymentMethod,
  FilterState,
  ThemeMode,
  ActiveTab,
  SubscriptionStatus,
  UserAccount,
  CloudSyncStatus
} from '../types';
import { fetchLiveExchangeRates, FALLBACK_RATES } from './currencyApi';
import { REAL_DATA_PRESETS } from '../utils/presets';
import { cloudSync, getSuggestedAccountEmails } from './cloudSync';

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
  isAuthModalOpen: boolean;

  // Cloud Auth & Sync
  user: UserAccount | null;
  syncStatus: CloudSyncStatus;
  suggestedAccountEmails: string[];

  // Actions
  setUser: (user: UserAccount | null) => void;
  setSyncStatus: (status: CloudSyncStatus) => void;
  syncWithCloud: () => Promise<void>;
  signOut: () => Promise<void>;
  setAuthModalOpen: (open: boolean) => void;

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

const STORAGE_SUBS_KEY = 'subtrax_subscriptions_v3';
const STORAGE_PAYMENTS_KEY = 'subtrax_payment_methods_v3';
const STORAGE_THEME_KEY = 'subtrax_theme';
const STORAGE_CURRENCY_KEY = 'subtrax_currency';

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

export const useAppStore = create<AppStore>((set, get) => {
  const initialSubs = loadStored<Subscription[]>(STORAGE_SUBS_KEY, INITIAL_SUBSCRIPTIONS);
  const initialUser = cloudSync.getStoredUser();

  return {
    subscriptions: initialSubs,
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
    isAuthModalOpen: false,

    user: initialUser,
    syncStatus: initialUser ? 'synced' : 'local',
    suggestedAccountEmails: getSuggestedAccountEmails(initialSubs, initialUser),

    setUser: (user) => {
      set({
        user,
        syncStatus: user ? 'synced' : 'local',
        suggestedAccountEmails: getSuggestedAccountEmails(get().subscriptions, user)
      });
      if (user) {
        get().syncWithCloud();
      }
    },

    setSyncStatus: (syncStatus) => set({ syncStatus }),

    setAuthModalOpen: (isAuthModalOpen) => set({ isAuthModalOpen }),

    signOut: async () => {
      await cloudSync.signOut();
      set({ user: null, syncStatus: 'local' });
    },

    syncWithCloud: async () => {
      const user = get().user;
      if (!user) return;

      set({ syncStatus: 'syncing' });
      try {
        const vault = cloudSync.getCloudVault(user.id);
        const localSubs = get().subscriptions;
        const localPayments = get().paymentMethods;

        // Merge cloud & local (preferring whichever has items or merging unique IDs)
        const mergedSubs = [...localSubs];
        vault.subscriptions.forEach((cs) => {
          const idx = mergedSubs.findIndex((s) => s.id === cs.id);
          if (idx >= 0) {
            mergedSubs[idx] = cs;
          } else {
            mergedSubs.push(cs);
          }
        });

        const mergedPayments = [...localPayments];
        vault.paymentMethods.forEach((cp) => {
          const idx = mergedPayments.findIndex((p) => p.id === cp.id);
          if (idx >= 0) {
            mergedPayments[idx] = cp;
          } else {
            mergedPayments.push(cp);
          }
        });

        persist(STORAGE_SUBS_KEY, mergedSubs);
        persist(STORAGE_PAYMENTS_KEY, mergedPayments);

        set({
          subscriptions: mergedSubs,
          paymentMethods: mergedPayments,
          syncStatus: 'synced',
          suggestedAccountEmails: getSuggestedAccountEmails(mergedSubs, user)
        });

        // Push combined back to vault
        await cloudSync.pushToCloud(user, mergedSubs, mergedPayments, get().currency);
      } catch (e) {
        console.error('Sync failed:', e);
        set({ syncStatus: 'offline' });
      }
    },

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
      
      const user = get().user;
      set({
        subscriptions: updated,
        isAddEditModalOpen: false,
        suggestedAccountEmails: getSuggestedAccountEmails(updated, user)
      });

      if (user) {
        cloudSync.pushToCloud(user, updated, get().paymentMethods, get().currency);
      }
    },

    updateSubscription: (id, updates) => {
      const updated = get().subscriptions.map(s => (s.id === id ? { ...s, ...updates } : s));
      persist(STORAGE_SUBS_KEY, updated);

      const user = get().user;
      set({
        subscriptions: updated,
        isAddEditModalOpen: false,
        editingSubscription: null,
        suggestedAccountEmails: getSuggestedAccountEmails(updated, user)
      });

      if (user) {
        cloudSync.pushToCloud(user, updated, get().paymentMethods, get().currency);
      }
    },

    deleteSubscription: (id) => {
      const updated = get().subscriptions.filter(s => s.id !== id);
      persist(STORAGE_SUBS_KEY, updated);

      const user = get().user;
      set({
        subscriptions: updated,
        suggestedAccountEmails: getSuggestedAccountEmails(updated, user)
      });

      if (user) {
        cloudSync.pushToCloud(user, updated, get().paymentMethods, get().currency);
      }
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

      const user = get().user;
      if (user) {
        cloudSync.pushToCloud(user, updated, get().paymentMethods, get().currency);
      }
    },

    importSubscriptions: (newSubs) => {
      const existing = get().subscriptions;
      // Deduplicate by name if identical name already exists
      const toAdd = newSubs.filter(
        ns => !existing.some(es => es.name.toLowerCase() === ns.name.toLowerCase())
      );
      const merged = [...toAdd, ...existing];
      persist(STORAGE_SUBS_KEY, merged);

      const user = get().user;
      set({
        subscriptions: merged,
        suggestedAccountEmails: getSuggestedAccountEmails(merged, user)
      });

      if (user) {
        cloudSync.pushToCloud(user, merged, get().paymentMethods, get().currency);
      }
    },

    clearAllSubscriptions: () => {
      persist(STORAGE_SUBS_KEY, []);
      const user = get().user;
      set({
        subscriptions: [],
        suggestedAccountEmails: getSuggestedAccountEmails([], user)
      });

      if (user) {
        cloudSync.pushToCloud(user, [], get().paymentMethods, get().currency);
      }
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

      const user = get().user;
      set({
        subscriptions: newSubs,
        paymentMethods: preset.paymentMethods,
        currency: preset.currency,
        suggestedAccountEmails: getSuggestedAccountEmails(newSubs, user)
      });

      if (user) {
        cloudSync.pushToCloud(user, newSubs, preset.paymentMethods, preset.currency);
      }
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

      const user = get().user;
      if (user) {
        cloudSync.pushToCloud(user, get().subscriptions, updated, get().currency);
      }
    },

    deletePaymentMethod: (id) => {
      const updated = get().paymentMethods.filter(m => m.id !== id);
      persist(STORAGE_PAYMENTS_KEY, updated);
      set({ paymentMethods: updated });

      const user = get().user;
      if (user) {
        cloudSync.pushToCloud(user, get().subscriptions, updated, get().currency);
      }
    },

    setDefaultPaymentMethod: (id) => {
      const updated = get().paymentMethods.map(m => ({
        ...m,
        isDefault: m.id === id
      }));
      persist(STORAGE_PAYMENTS_KEY, updated);
      set({ paymentMethods: updated });

      const user = get().user;
      if (user) {
        cloudSync.pushToCloud(user, get().subscriptions, updated, get().currency);
      }
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

      const user = get().user;
      if (user) {
        cloudSync.pushToCloud(user, get().subscriptions, get().paymentMethods, currency);
      }
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
  };
});

// Backwards compatibility stub for older imports
export const useStore = useAppStore;

// Initial rate fetch & cloud sync listener
if (typeof window !== 'undefined') {
  setTimeout(() => {
    useAppStore.getState().fetchRates();
  }, 100);

  cloudSync.onDataSync((payload) => {
    const store = useAppStore.getState();
    if (store.user && payload.userId === store.user.id) {
      persist(STORAGE_SUBS_KEY, payload.subscriptions);
      persist(STORAGE_PAYMENTS_KEY, payload.paymentMethods);
      useAppStore.setState({
        subscriptions: payload.subscriptions,
        paymentMethods: payload.paymentMethods,
        syncStatus: 'synced',
        suggestedAccountEmails: getSuggestedAccountEmails(payload.subscriptions, store.user)
      });
    }
  });

  cloudSync.onStatusChange((status) => {
    useAppStore.setState({ syncStatus: status });
  });
}
