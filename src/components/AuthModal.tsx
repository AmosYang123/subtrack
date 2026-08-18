import React, { useState } from 'react';
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
  EyeOff
} from 'lucide-react';
import { useAppStore } from '../services/store';
import { cloudSync } from '../services/cloudSync';

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

  const [authTab, setAuthTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (authTab === 'signup') {
        const newUser = await cloudSync.signUp(email, password, name);
        setUser(newUser);
        setSuccessMsg(`Welcome, ${newUser.name || newUser.email}! Your data is now syncing to the cloud.`);
      } else {
        const signedInUser = await cloudSync.signIn(email, password);
        setUser(signedInUser);
        setSuccessMsg(`Welcome back, ${signedInUser.name || signedInUser.email}! Syncing your subscriptions...`);
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
    >
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center gap-2">
          <Cloud size={18} style={{ color: 'var(--primary)' }} />
          <span>{user ? 'Cloud Sync & Account' : 'Cloud Sync Account'}</span>
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
                  backgroundColor: 'var(--primary-subtle)',
                  color: 'var(--primary)',
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
              <div className="d-flex align-items-center gap-1.5 badge-tag badge-success-subtle">
                <CheckCircle2 size={12} />
                <span>Cloud Connected</span>
              </div>
            </div>

            <div className="section-panel p-3 mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span style={{ fontSize: 13, fontWeight: 600 }}>Multi-Device Cloud Sync</span>
                <span className={`badge-tag ${syncStatus === 'synced' ? 'badge-success-subtle' : 'badge-info-subtle'}`}>
                  {syncStatus === 'synced' ? 'Synced with Cloud' : syncStatus === 'syncing' ? 'Syncing...' : 'Local Cache'}
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
                  <span>Mobile Browser</span>
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
          /* Sign In / Sign Up Form */
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
                Sign in to sync your subscriptions seamlessly across all your devices with smart email suggestions and password tools.
              </p>
            </div>

            <Tab.Container activeKey={authTab} onSelect={(k) => { setAuthTab(k as any); setError(null); }}>
              <Nav variant="pills" className="nav-pills-subtle mb-3 justify-content-center">
                <Nav.Item>
                  <Nav.Link eventKey="signin" style={{ fontSize: 13 }}>Sign in</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="signup" style={{ fontSize: 13 }}>Create account</Nav.Link>
                </Nav.Item>
              </Nav>

              {error && <Alert variant="danger" style={{ fontSize: 12.5, padding: '8px 12px' }}>{error}</Alert>}
              {successMsg && <Alert variant="success" style={{ fontSize: 12.5, padding: '8px 12px' }}>{successMsg}</Alert>}

              <Form onSubmit={handleSubmit}>
                {authTab === 'signup' && (
                  <Form.Group className="mb-2.5">
                    <Form.Label style={{ fontSize: 12 }}>Your Name (optional)</Form.Label>
                    <div className="position-relative">
                      <Form.Control
                        type="text"
                        placeholder="e.g. Alex"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        style={{ paddingLeft: 34 }}
                      />
                      <User size={14} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-muted)' }} />
                    </div>
                  </Form.Group>
                )}

                <Form.Group className="mb-2.5">
                  <Form.Label style={{ fontSize: 12 }}>Email address</Form.Label>
                  <div className="position-relative">
                    <Form.Control
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      style={{ paddingLeft: 34 }}
                    />
                    <Mail size={14} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-muted)' }} />
                  </div>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label style={{ fontSize: 12 }}>Password</Form.Label>
                  <div className="position-relative">
                    <Form.Control
                      type={showPassword ? 'text' : 'password'}
                      placeholder={authTab === 'signup' ? 'At least 6 characters' : 'Enter password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      style={{ paddingLeft: 34, paddingRight: 36 }}
                    />
                    <Lock size={14} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-muted)' }} />
                    <button
                      type="button"
                      className="btn-ghost p-0"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: 10, top: 8, color: 'var(--text-muted)', height: 'auto' }}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
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
                    <span>{authTab === 'signup' ? 'Create Account & Sync' : 'Sign In & Sync'}</span>
                  )}
                </button>
              </Form>
            </Tab.Container>
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
};
