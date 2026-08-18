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
const LEGACY_STORAGE_SUBS_KEY = 'subtrack_subscriptions_v3';

const STORAGE_PAYMENTS_KEY = 'subtrax_payment_methods_v3';
const LEGACY_STORAGE_PAYMENTS_KEY = 'subtrack_payment_methods_v3';

const STORAGE_THEME_KEY = 'subtrax_theme';
const LEGACY_STORAGE_THEME_KEY = 'subtrack_theme';

const STORAGE_CURRENCY_KEY = 'subtrax_currency';
const LEGACY_STORAGE_CURRENCY_KEY = 'subtrack_currency';

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

// Safe loader with automatic migration from legacy subtrack keys
function loadStoredWithMigration<T>(newKey: string, oldKey: string, fallback: T): T {
  try {
    const item = localStorage.getItem(newKey);
    if (item) return JSON.parse(item);

    const legacyItem = localStorage.getItem(oldKey);
    if (legacyItem) {
      const parsed = JSON.parse(legacyItem);
      // Migrate forward
      localStorage.setItem(newKey, legacyItem);
      return parsed;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

function loadStringWithMigration(newKey: string, oldKey: string, fallback: string): string {
  try {
    const val = localStorage.getItem(newKey);
    if (val) return val;
    const oldVal = localStorage.getItem(oldKey);
    if (oldVal) {
      localStorage.setItem(newKey, oldVal);
      return oldVal;
    }
    return fallback;
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
  const initialSubs = loadStoredWithMigration<Subscription[]>(
    STORAGE_SUBS_KEY,
    LEGACY_STORAGE_SUBS_KEY,
    INITIAL_SUBSCRIPTIONS
  );
  const initialPayments = loadStoredWithMigration<PaymentMethod[]>(
    STORAGE_PAYMENTS_KEY,
    LEGACY_STORAGE_PAYMENTS_KEY,
    INITIAL_PAYMENT_METHODS
  );
  const initialUser = cloudSync.getStoredUser();

  return {
    subscriptions: initialSubs,
    paymentMethods: initialPayments,
    theme: (loadStringWithMigration(STORAGE_THEME_KEY, LEGACY_STORAGE_THEME_KEY, 'light') as ThemeMode),
    currency: loadStringWithMigration(STORAGE_CURRENCY_KEY, LEGACY_STORAGE_CURRENCY_KEY, 'USD'),
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
        syncStatus: user ? 'synced' : 'local'
      });
      if (user) {
        get().syncWithCloud();
      }
    },

    setSyncStatus: (syncStatus) => set({ syncStatus }),

    setAuthModalOpen: (isAuthModalOpen) => set({ isAuthModalOpen }),

    signOut: async () => {
      await cloudSync.signOut();
      // Clean local workspace state on sign-out to prevent credential leakage
      const resetSubs = [...INITIAL_SUBSCRIPTIONS];
      const resetPayments = [...INITIAL_PAYMENT_METHODS];
      persist(STORAGE_SUBS_KEY, resetSubs);
      persist(STORAGE_PAYMENTS_KEY, resetPayments);

      set({
        user: null,
        syncStatus: 'local',
        subscriptions: resetSubs,
        paymentMethods: resetPayments,
        suggestedAccountEmails: getSuggestedAccountEmails(resetSubs, null)
      });
    },

    syncWithCloud: async () => {
      const user = get().user;
      if (!user) return;

      set({ syncStatus: 'syncing' });
      try {
        const vault = cloudSync.getCloudVault(user.id);
        const localSubs = get().subscriptions;
        const localPayments = get().paymentMethods;

        let activeSubs: Subscription[];
        let activePayments: PaymentMethod[];

        if (vault.subscriptions && vault.subscriptions.length > 0) {
          // User has existing cloud vault: load their vault
          activeSubs = vault.subscriptions;
          activePayments = vault.paymentMethods && vault.paymentMethods.length > 0
            ? vault.paymentMethods
            : localPayments;
        } else {
          // New cloud vault: initialize with current local data
          activeSubs = localSubs;
          activePayments = localPayments;
        }

        persist(STORAGE_SUBS_KEY, activeSubs);
        persist(STORAGE_PAYMENTS_KEY, activePayments);

        set({
          subscriptions: activeSubs,
          paymentMethods: activePayments,
          syncStatus: 'synced',
          suggestedAccountEmails: getSuggestedAccountEmails(activeSubs, user)
        });

        // Ensure cloud vault is updated
        await cloudSync.pushToCloud(user, activeSubs, activePayments, get().currency);
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
