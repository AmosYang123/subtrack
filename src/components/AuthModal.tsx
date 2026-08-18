import React, { useState, useEffect } from 'react';
import { Modal, Form, Alert, Tab, Nav } from 'react-bootstrap';
import {
  Cloud,
  Lock,
  Mail,
  User,
  CheckCircle2,
  RefreshCw,
  LogOut,
  Smartphone,
  Laptop,
  Eye,
  EyeOff,
  Settings,
  Database,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { useAppStore } from '../services/store';
import { cloudSync } from '../services/cloudSync';
import {
  getSupabaseConfig,
  setSupabaseConfig,
  clearSupabaseConfig,
  isSupabaseConfigured
} from '../services/supabase';

const SUPABASE_SCHEMA_SQL = `-- SubTrax Supabase Database Schema (Run in Supabase Dashboard -> SQL Editor)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  billing_cycle TEXT NOT NULL DEFAULT 'monthly',
  next_billing_date TEXT NOT NULL,
  first_billing_date TEXT,
  category TEXT NOT NULL DEFAULT 'Other',
  payment_method_id TEXT,
  account_email TEXT,
  account_password TEXT,
  password_hint TEXT,
  cancel_url TEXT,
  is_trial BOOLEAN DEFAULT FALSE,
  trial_end_date TEXT,
  last_used_date TEXT,
  usage_frequency TEXT,
  annual_price NUMERIC,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  website_url TEXT,
  remind_days_before INTEGER DEFAULT 3,
  color TEXT DEFAULT '#64748b',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payment_methods (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  brand TEXT NOT NULL DEFAULT 'Visa',
  last_four TEXT NOT NULL DEFAULT '0000',
  expiry_month INTEGER,
  expiry_year INTEGER,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own subscriptions" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own subscriptions" ON public.subscriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own subscriptions" ON public.subscriptions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own payment methods" ON public.payment_methods FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own payment methods" ON public.payment_methods FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own payment methods" ON public.payment_methods FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own payment methods" ON public.payment_methods FOR DELETE USING (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.subscriptions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_methods;`;

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setAuthModalOpen,
    user,
    setUser,
    syncStatus,
    syncWithCloud,
    signOut,
    subscriptions,
    paymentMethods
  } = useAppStore();

  const [authTab, setAuthTab] = useState<'signin' | 'signup' | 'supabase'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Supabase Config States
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
  const [copiedSql, setCopiedSql] = useState(false);
  const [supabaseConnected, setSupabaseConnected] = useState(false);

  useEffect(() => {
    const config = getSupabaseConfig();
    if (config) {
      setSupabaseUrl(config.url);
      setSupabaseAnonKey(config.anonKey);
      setSupabaseConnected(true);
    } else {
      setSupabaseConnected(false);
    }
  }, [isAuthModalOpen]);

  const handleSaveSupabaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!supabaseUrl.trim() || !supabaseAnonKey.trim()) {
      setError('Please provide both your Supabase Project URL and Anon Public Key.');
      return;
    }

    if (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
      setError('Supabase URL must begin with https://');
      return;
    }

    try {
      setSupabaseConfig(supabaseUrl, supabaseAnonKey);
      setSupabaseConnected(true);
      setSuccessMsg('✓ Supabase connection settings saved! You can now sign in or create an account with cloud sync.');
      setTimeout(() => setAuthTab('signin'), 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to save configuration.');
    }
  };

  const handleClearSupabaseConfig = () => {
    clearSupabaseConfig();
    setSupabaseUrl('');
    setSupabaseAnonKey('');
    setSupabaseConnected(false);
    setSuccessMsg('Supabase credentials cleared. SubTrax will use local-first vault storage.');
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (authTab === 'signup') {
        const newUser = await cloudSync.signUp(email, password, name);
        setUser(newUser);
        setSuccessMsg(
          supabaseConnected
            ? `Welcome, ${newUser.name || newUser.email}! Account created on Supabase Cloud.`
            : `Welcome, ${newUser.name || newUser.email}! Your data is now syncing to the local vault.`
        );
      } else {
        const signedInUser = await cloudSync.signIn(email, password);
        setUser(signedInUser);
        setSuccessMsg(
          supabaseConnected
            ? `Welcome back, ${signedInUser.name || signedInUser.email}! Syncing from Supabase Cloud...`
            : `Welcome back, ${signedInUser.name || signedInUser.email}! Syncing your subscriptions...`
        );
      }
      setTimeout(() => {
        setAuthModalOpen(false);
        setSuccessMsg(null);
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setAuthModalOpen(false);
  };

  return (
    <Modal
      show={isAuthModalOpen}
      onHide={() => setAuthModalOpen(false)}
      centered
      size="lg"
    >
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center gap-2">
          <Cloud size={18} style={{ color: 'var(--primary)' }} />
          <span>{user ? 'Multi-Device Cloud Sync & Account' : 'Cloud Sync Account'}</span>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ padding: '20px 24px' }}>
        {user ? (
          /* Logged In View */
          <div>
            <div className="d-flex align-items-center gap-3 p-3 mb-3" style={{ background: 'var(--bg)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary-bg)',
                  color: 'var(--primary-text)',
                  border: '1px solid var(--primary-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 18
                }}
              >
                {(user.name || user.email).charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 650, fontSize: 14.5 }}>{user.name || 'SubTrax Member'}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12.5 }}>{user.email}</div>
              </div>
              <div className={`d-flex align-items-center gap-1.5 badge-tag ${supabaseConnected ? 'badge-success-subtle' : 'badge-info-subtle'}`}>
                <CheckCircle2 size={12} />
                <span>{supabaseConnected ? 'Supabase PostgreSQL' : 'Local Vault Active'}</span>
              </div>
            </div>

            <div className="section-panel p-3 mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span style={{ fontSize: 13, fontWeight: 600 }}>Multi-Device Cloud Sync</span>
                <span className={`badge-tag ${syncStatus === 'synced' ? 'badge-success-subtle' : syncStatus === 'syncing' ? 'badge-warning-subtle' : 'badge-info-subtle'}`}>
                  {syncStatus === 'synced' ? (supabaseConnected ? 'Live Cloud Synced' : 'Local Vault Synced') : syncStatus === 'syncing' ? 'Syncing...' : 'Local Cache'}
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Your {subscriptions.length} subscriptions and {paymentMethods.length} payment cards are saved and synchronized across your laptops and mobile devices.
              </div>

              <div className="d-flex align-items-center gap-4 mt-3 pt-2 border-top border-border">
                <div className="d-flex align-items-center gap-1.5" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  <Laptop size={14} />
                  <span>Desktop Web</span>
                </div>
                <div className="d-flex align-items-center gap-1.5" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  <Smartphone size={14} />
                  <span>Mobile Phone</span>
                </div>
                <div className="d-flex align-items-center gap-1.5 ms-auto" style={{ fontSize: 12, color: 'var(--primary)' }}>
                  <Database size={13} />
                  <span>{supabaseConnected ? 'PostgreSQL Database' : 'Web Crypto Vault'}</span>
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-between align-items-center pt-2">
              <button
                type="button"
                className="btn-danger-ghost d-flex align-items-center gap-1.5"
                onClick={handleSignOut}
              >
                <LogOut size={14} />
                <span>Sign out</span>
              </button>

              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn-subtle d-flex align-items-center gap-1.5"
                  onClick={() => syncWithCloud()}
                  disabled={syncStatus === 'syncing'}
                >
                  <RefreshCw size={13} className={syncStatus === 'syncing' ? 'spin' : ''} />
                  <span>Sync now</span>
                </button>
                <button
                  type="button"
                  className="btn-primary-action"
                  onClick={() => setAuthModalOpen(false)}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Sign In / Sign Up / Supabase Settings Form */
          <div>
            <div className="mb-3 text-center">
              <div className="d-flex justify-content-center align-items-center gap-3 mb-2">
                <div className="d-flex align-items-center gap-1" style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>
                  <Laptop size={14} /> <span>Laptop</span>
                </div>
                <span style={{ color: 'var(--border)' }}>⇄</span>
                <div className="d-flex align-items-center gap-1" style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>
                  <Smartphone size={14} /> <span>Phone</span>
                </div>
              </div>
              <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: 0 }}>
                Sign in to sync your subscriptions seamlessly across all your devices in real time.
              </p>
            </div>

            <Tab.Container activeKey={authTab} onSelect={(k) => { setAuthTab(k as any); setError(null); setSuccessMsg(null); }}>
              <div className="d-flex justify-content-center mb-3">
                <Nav variant="pills" className="nav-pills-subtle">
                  <Nav.Item>
                    <Nav.Link eventKey="signin" style={{ fontSize: 13 }}>Sign in</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="signup" style={{ fontSize: 13 }}>Create account</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="supabase" style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Database size={13} style={{ color: supabaseConnected ? 'var(--primary)' : 'var(--text-muted)' }} />
                      <span>Supabase Settings</span>
                      {supabaseConnected && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)' }} />}
                    </Nav.Link>
                  </Nav.Item>
                </Nav>
              </div>

              {error && <Alert variant="danger" style={{ fontSize: 12.5, padding: '8px 12px' }}>{error}</Alert>}
              {successMsg && <Alert variant="success" style={{ fontSize: 12.5, padding: '8px 12px' }}>{successMsg}</Alert>}

              {/* TAB 1 & 2: SIGN IN / SIGN UP */}
              {(authTab === 'signin' || authTab === 'signup') && (
                <Form onSubmit={handleSubmit}>
                  {authTab === 'signup' && (
                    <Form.Group className="mb-2.5">
                      <Form.Label style={{ fontSize: 12 }}>Your Name (optional)</Form.Label>
                      <div className="input-with-icon">
                        <span className="input-icon-lead">
                          <User size={15} />
                        </span>
                        <Form.Control
                          type="text"
                          placeholder="e.g. Alex"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                      </div>
                    </Form.Group>
                  )}

                  <Form.Group className="mb-2.5">
                    <Form.Label style={{ fontSize: 12 }}>Email address</Form.Label>
                    <div className="input-with-icon">
                      <span className="input-icon-lead">
                        <Mail size={15} />
                      </span>
                      <Form.Control
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label style={{ fontSize: 12 }}>Password</Form.Label>
                    <div className="input-with-icon">
                      <span className="input-icon-lead">
                        <Lock size={15} />
                      </span>
                      <Form.Control
                        type={showPassword ? 'text' : 'password'}
                        placeholder={authTab === 'signup' ? 'At least 6 characters' : 'Enter password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{ paddingRight: 40 }}
                      />
                      <span className="input-icon-trail">
                        <button
                          type="button"
                          className="btn-ghost p-1"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{ color: 'var(--text-muted)', height: 'auto', display: 'flex', alignItems: 'center' }}
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </span>
                    </div>
                  </Form.Group>

                  <button
                    type="submit"
                    className="btn-primary-action w-100 py-2"
                    disabled={loading}
                    style={{ justifyContent: 'center' }}
                  >
                    {loading ? (
                      <>
                        <RefreshCw size={14} className="spin" />
                        <span>{authTab === 'signup' ? 'Creating account...' : 'Signing in...'}</span>
                      </>
                    ) : (
                      <span>{authTab === 'signup' ? (supabaseConnected ? 'Create Supabase Account & Sync' : 'Create Account & Sync') : (supabaseConnected ? 'Sign In via Supabase Cloud' : 'Sign In & Sync')}</span>
                    )}
                  </button>
                </Form>
              )}

              {/* TAB 3: SUPABASE CONFIGURATION */}
              {authTab === 'supabase' && (
                <div className="section-panel p-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <Database size={16} style={{ color: 'var(--primary)' }} />
                      <span style={{ fontWeight: 650, fontSize: 13.5 }}>Connect Supabase Cloud Backend</span>
                    </div>
                    <span className={`badge-tag ${supabaseConnected ? 'badge-success-subtle' : 'badge-warning-subtle'}`}>
                      {supabaseConnected ? '● Connected' : '○ Not Connected'}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 12px' }}>
                    Connect your free Supabase project to enable real-time cloud sync and access your subscriptions from any phone, laptop, or browser.
                  </p>

                  <Form onSubmit={handleSaveSupabaseConfig}>
                    <Form.Group className="mb-2.5">
                      <Form.Label style={{ fontSize: 12 }}>Supabase Project URL</Form.Label>
                      <Form.Control
                        type="url"
                        placeholder="https://your-project-id.supabase.co"
                        value={supabaseUrl}
                        onChange={(e) => setSupabaseUrl(e.target.value)}
                        required
                        style={{ fontSize: 12.5 }}
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label style={{ fontSize: 12 }}>Supabase Anon Public API Key</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                        value={supabaseAnonKey}
                        onChange={(e) => setSupabaseAnonKey(e.target.value)}
                        required
                        style={{ fontSize: 12.5, fontFamily: 'monospace' }}
                      />
                    </Form.Group>

                    <div className="d-flex justify-content-between align-items-center pt-2 border-top border-border">
                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          className="btn-subtle"
                          style={{ fontSize: 12 }}
                          onClick={handleCopySql}
                          title="Copy database tables & Row Level Security policies SQL"
                        >
                          {copiedSql ? <Check size={13} style={{ color: '#10b981' }} /> : <Copy size={13} />}
                          <span>{copiedSql ? 'Copied SQL Script!' : 'Copy SQL Setup Script'}</span>
                        </button>
                        {supabaseConnected && (
                          <button
                            type="button"
                            className="btn-danger-ghost"
                            style={{ fontSize: 12 }}
                            onClick={handleClearSupabaseConfig}
                          >
                            Reset
                          </button>
                        )}
                      </div>

                      <button type="submit" className="btn-primary-action" style={{ fontSize: 12 }}>
                        <Check size={14} />
                        <span>Save & Connect</span>
                      </button>
                    </div>
                  </Form>
                </div>
              )}
            </Tab.Container>
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
};
