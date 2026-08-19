import React, { useState, useEffect } from 'react';
import { Modal, Form, ProgressBar, Spinner, Badge } from 'react-bootstrap';
import {
  Camera,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle2,
  Upload,
  AlertCircle,
  Plus,
  Layers,
  HelpCircle,
  X,
  ExternalLink
} from 'lucide-react';
import { useAppStore } from '../services/store';
import { Subscription, BillingCycle } from '../types';
import { POPULAR_SERVICES, CatalogService } from '../utils/catalog';
import {
  parseScreenshotOCRText,
  scanScreenshotImageFile,
  SAMPLE_SCREENSHOT_DATA,
  ScreenshotDetectedItem
} from '../utils/screenshotParser';
import { formatCurrency } from '../utils/calculator';
import { format, addMonths } from 'date-fns';

type OnboardingStep = 'select_method' | 'screenshot_scan' | 'preset_wizard' | 'completed';

export const OnboardingModal: React.FC = () => {
  const {
    isOnboardingModalOpen,
    setOnboardingModalOpen,
    subscriptions,
    importSubscriptions,
    currency,
    detectedLocation
  } = useAppStore();

  const [currentStep, setCurrentStep] = useState<OnboardingStep>('select_method');
  const [completedFromMethod, setCompletedFromMethod] = useState<'screenshot' | 'preset' | null>(null);
  const [importedCount, setImportedCount] = useState(0);

  // --- Screenshot Scan States ---
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [detectedScreenshotItems, setDetectedScreenshotItems] = useState<ScreenshotDetectedItem[]>([]);
  const [screenshotRawText, setScreenshotRawText] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  // --- Smart Preset Wizard States ---
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPresetIds, setSelectedPresetIds] = useState<Record<string, { selected: boolean; amount: number; cycle: BillingCycle }>>({});

  // Initialize preset selections when wizard opens
  useEffect(() => {
    if (isOnboardingModalOpen) {
      const initialMap: Record<string, { selected: boolean; amount: number; cycle: BillingCycle }> = {};
      POPULAR_SERVICES.forEach(s => {
        const isTracked = subscriptions.some(sub => sub.name.toLowerCase() === s.name.toLowerCase());
        initialMap[s.name] = {
          selected: false,
          amount: s.defaultAmount,
          cycle: s.billingCycle
        };
      });
      setSelectedPresetIds(initialMap);
    }
  }, [isOnboardingModalOpen, subscriptions]);

  const handleClose = () => {
    setOnboardingModalOpen(false);
    setTimeout(() => {
      setCurrentStep('select_method');
      setDetectedScreenshotItems([]);
      setScreenshotRawText('');
    }, 300);
  };

  // --- Screenshot Flow Handlers ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processScreenshotFile(file);
  };

  const processScreenshotFile = async (file: File) => {
    setIsScanning(true);
    setScanProgress(20);

    setTimeout(() => setScanProgress(55), 300);
    setTimeout(() => setScanProgress(85), 600);

    setTimeout(async () => {
      const result = await scanScreenshotImageFile(file, subscriptions);
      setScreenshotRawText(result.text);
      setDetectedScreenshotItems(result.items);
      setScanProgress(100);
      setIsScanning(false);
    }, 900);
  };

  const handleSelectSampleScreenshot = (sampleId: string) => {
    const sample = SAMPLE_SCREENSHOT_DATA.find(s => s.id === sampleId);
    if (!sample) return;

    setIsScanning(true);
    setScanProgress(30);

    setTimeout(() => setScanProgress(75), 250);
    setTimeout(() => {
      const items = parseScreenshotOCRText(sample.mockText, subscriptions);
      setScreenshotRawText(sample.mockText);
      setDetectedScreenshotItems(items);
      setScanProgress(100);
      setIsScanning(false);
    }, 550);
  };

  const toggleScreenshotItem = (id: string) => {
    setDetectedScreenshotItems(prev =>
      prev.map(item => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  const updateScreenshotItemAmount = (id: string, newAmount: number) => {
    setDetectedScreenshotItems(prev =>
      prev.map(item => (item.id === id ? { ...item, amount: newAmount } : item))
    );
  };

  const updateScreenshotItemCycle = (id: string, newCycle: BillingCycle) => {
    setDetectedScreenshotItems(prev =>
      prev.map(item => (item.id === id ? { ...item, billingCycle: newCycle } : item))
    );
  };

  const handleCommitScreenshotImport = () => {
    const toImport = detectedScreenshotItems.filter(item => item.selected);
    if (toImport.length === 0) return;

    const newSubs: Subscription[] = toImport.map((item, idx) => ({
      id: `sub_${Date.now()}_${idx}`,
      name: item.detectedName,
      amount: item.amount,
      currency: item.currency || currency,
      billingCycle: item.billingCycle,
      nextBillingDate: item.nextBillingDate || format(addMonths(new Date(), 1), 'yyyy-MM-dd'),
      category: item.category,
      color: item.color,
      websiteUrl: item.websiteUrl,
      cancelUrl: item.cancelUrl,
      status: 'active',
      notes: 'Imported via Screenshot Scan OCR',
      createdAt: new Date().toISOString()
    }));

    importSubscriptions(newSubs);
    setImportedCount(newSubs.length);
    setCompletedFromMethod('screenshot');
    setCurrentStep('completed');
  };

  // --- Smart Preset Wizard Handlers ---
  const togglePresetService = (serviceName: string) => {
    setSelectedPresetIds(prev => {
      const current = prev[serviceName] || {
        selected: false,
        amount: 9.99,
        cycle: 'monthly'
      };
      return {
        ...prev,
        [serviceName]: {
          ...current,
          selected: !current.selected
        }
      };
    });
  };

  const selectedPresetList = Object.entries(selectedPresetIds)
    .filter(([_, val]) => val.selected)
    .map(([name, val]) => {
      const catalog = POPULAR_SERVICES.find(s => s.name === name);
      return {
        name,
        catalog,
        amount: val.amount,
        cycle: val.cycle
      };
    });

  const totalMonthlyPresetEstimated = selectedPresetList.reduce((acc, curr) => {
    const monthlyRate = curr.cycle === 'yearly' ? curr.amount / 12 : curr.amount;
    return acc + monthlyRate;
  }, 0);

  const handleCommitPresetImport = () => {
    if (selectedPresetList.length === 0) return;

    const newSubs: Subscription[] = selectedPresetList.map((item, idx) => ({
      id: `sub_${Date.now()}_${idx}`,
      name: item.name,
      amount: item.amount,
      currency: item.catalog?.currency || currency,
      billingCycle: item.cycle,
      nextBillingDate: format(addMonths(new Date(), 1), 'yyyy-MM-dd'),
      category: item.catalog?.category || 'Software',
      color: item.catalog?.color,
      websiteUrl: item.catalog?.websiteUrl,
      cancelUrl: item.catalog?.cancelUrl,
      status: 'active',
      notes: 'Imported via Smart Preset Wizard',
      createdAt: new Date().toISOString()
    }));

    importSubscriptions(newSubs);
    setImportedCount(newSubs.length);
    setCompletedFromMethod('preset');
    setCurrentStep('completed');
  };

  const categories = ['all', 'Software', 'Streaming', 'Music', 'Gaming', 'Utilities', 'News'];

  const filteredCatalog = POPULAR_SERVICES.filter(service => {
    if (selectedCategory === 'all') return true;
    return service.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  return (
    <Modal
      show={isOnboardingModalOpen}
      onHide={handleClose}
      centered
      size="lg"
      backdrop="static"
      className="onboarding-modal"
    >
      <Modal.Body style={{ padding: 0, overflow: 'hidden', borderRadius: 'var(--radius-lg)' }}>
        
        {/* ================= STEP 1: CHOICE SCREEN ================= */}
        {currentStep === 'select_method' && (
          <div style={{ padding: '36px 32px' }}>
            {/* Close Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
              <button
                type="button"
                className="btn-icon"
                onClick={handleClose}
                title="Close setup"
                style={{ color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Main Header */}
            <div style={{ textAlign: 'center', maxWidth: 620, margin: '0 auto 28px' }}>
              <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.02em' }}>
                How would you like to set up your subscriptions?
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14.5, lineHeight: 1.5, margin: 0 }}>
                Get started in seconds. Choose the fastest way to bring your subscriptions into SubTrack.
              </p>
            </div>

            {/* Options Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
              
              {/* Option A: Screenshot Scan (Recommended) */}
              <div
                onClick={() => setCurrentStep('screenshot_scan')}
                style={{
                  border: '2px solid var(--primary)',
                  borderRadius: 'var(--radius-md)',
                  padding: '24px 20px',
                  backgroundColor: 'var(--card-bg)',
                  cursor: 'pointer',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 8px 24px rgba(99, 102, 241, 0.08)'
                }}
                className="onboarding-option-card"
              >
                <div style={{ position: 'absolute', top: -11, right: 18 }}>
                  <span
                    style={{
                      backgroundColor: 'var(--primary)',
                      color: '#ffffff',
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: 100,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      boxShadow: '0 2px 8px rgba(99, 102, 241, 0.4)'
                    }}
                  >
                    Recommended
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      backgroundColor: 'var(--primary-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--primary)'
                    }}
                  >
                    <Camera size={22} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Screenshot Scan</h3>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>⚡ ~5 seconds</span>
                  </div>
                </div>

                <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.5, flex: 1, marginBottom: 18 }}>
                  Upload a screenshot of your phone’s active subscriptions (e.g., iPhone Settings → Subscriptions) or your bank app’s recurring charges. SubTrack automatically extracts the service names, renewal dates, and billing amounts for you.
                </p>

                <button className="btn-primary-action" style={{ width: '100%', justifyContent: 'center' }}>
                  <span>Scan a Screenshot</span>
                  <ArrowRight size={15} />
                </button>
              </div>

              {/* Option B: Smart Preset Wizard */}
              <div
                onClick={() => setCurrentStep('preset_wizard')}
                style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '24px 20px',
                  backgroundColor: 'var(--card-bg)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.2s ease'
                }}
                className="onboarding-option-card"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      backgroundColor: 'rgba(234, 179, 8, 0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#eab308'
                    }}
                  >
                    <Sparkles size={22} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Smart Preset Wizard</h3>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>⏱️ ~30 seconds</span>
                  </div>
                </div>

                <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.5, flex: 1, marginBottom: 18 }}>
                  Browse a curated catalog of popular streaming, AI, music, and productivity services. Simply tap the logos of the services you use, and we will automatically fill in standard pricing tiers, billing cycles, and logos.
                </p>

                <button className="btn-subtle" style={{ width: '100%', justifyContent: 'center', border: '1px solid var(--border-color)' }}>
                  <span>Choose from Popular Services</span>
                  <ArrowRight size={15} />
                </button>
              </div>

            </div>

            {/* Reassurance & Security Banner */}
            <div
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                marginBottom: 16
              }}
            >
              <ShieldCheck size={20} style={{ color: '#10b981', flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                <strong style={{ color: 'var(--text-primary)' }}>100% Private & Secure:</strong> Both methods run locally on your device with zero credential access. We never ask for your passwords, bank logins, or sensitive account info. Both options take under a minute and require zero tedious typing.
              </div>
            </div>

            {/* Flexibility & Non-Lock-in Copy */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                💡 <strong>You are not locked into one choice:</strong> Start with whichever option feels easiest right now. You can run the other method at any time from your settings or combine both to make sure no hidden subscription is missed.
              </p>
            </div>

            {/* Skip Option */}
            <div style={{ textAlign: 'center' }}>
              <button
                type="button"
                className="btn-ghost"
                onClick={handleClose}
                style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'underline' }}
              >
                Skip for now & enter manually
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 2A: SCREENSHOT SCAN FLOW ================= */}
        {currentStep === 'screenshot_scan' && (
          <div style={{ padding: '28px 30px' }}>
            {/* Sub-Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <button
                type="button"
                className="btn-ghost d-flex align-items-center gap-1"
                onClick={() => setCurrentStep('select_method')}
                style={{ fontSize: 13, padding: '4px 8px' }}
              >
                <ArrowLeft size={15} />
                <span>Back to options</span>
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Badge bg="primary" style={{ fontWeight: 600 }}>Screenshot OCR</Badge>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
                Upload or Drop Screenshot
              </h3>
              <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', margin: 0 }}>
                Upload a screenshot from iPhone (<em>Settings → Apple ID → Subscriptions</em>), Google Play, or your bank app.
              </p>
            </div>

            {/* Dropzone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={async (e) => {
                e.preventDefault();
                setIsDragOver(false);
                const file = e.dataTransfer.files?.[0];
                if (file) await processScreenshotFile(file);
              }}
              style={{
                border: isDragOver ? '2px dashed var(--primary)' : '2px dashed var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '28px 20px',
                textAlign: 'center',
                backgroundColor: isDragOver ? 'var(--primary-subtle)' : 'var(--bg-secondary)',
                marginBottom: 20,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => document.getElementById('screenshot-file-input')?.click()}
            >
              <input
                id="screenshot-file-input"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  backgroundColor: 'var(--card-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                  color: 'var(--primary)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}
              >
                <Upload size={22} />
              </div>
              <div style={{ fontWeight: 600, fontSize: 14.5, marginBottom: 4 }}>
                Click to browse or drag & drop screenshot
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Supports PNG, JPG, JPEG, or WEBP (Processed 100% locally)
              </div>
            </div>

            {/* Quick Test Samples */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.04em' }}>
                Or test with sample screenshot data:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {SAMPLE_SCREENSHOT_DATA.map(sample => (
                  <button
                    key={sample.id}
                    type="button"
                    className="btn-subtle d-flex align-items-center gap-1.5"
                    style={{ fontSize: 12.5, padding: '6px 12px', borderRadius: 'var(--radius-sm)' }}
                    onClick={() => handleSelectSampleScreenshot(sample.id)}
                  >
                    <Camera size={13} style={{ color: 'var(--primary)' }} />
                    <span>{sample.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Scanning Progress */}
            {isScanning && (
              <div style={{ padding: '20px 0', textAlign: 'center' }}>
                <Spinner animation="border" size="sm" variant="primary" style={{ marginBottom: 10 }} />
                <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 8 }}>
                  Analyzing screenshot text & matching catalog...
                </div>
                <ProgressBar now={scanProgress} animated style={{ height: 6, maxWidth: 300, margin: '0 auto' }} />
              </div>
            )}

            {/* Detected Items Review Table */}
            {!isScanning && detectedScreenshotItems.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>
                    Detected Subscriptions ({detectedScreenshotItems.filter(i => i.selected).length} selected)
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Review, adjust price or uncheck items before saving
                  </div>
                </div>

                <div
                  style={{
                    maxHeight: 240,
                    overflowY: 'auto',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--card-bg)',
                    marginBottom: 20
                  }}
                >
                  {detectedScreenshotItems.map(item => (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderBottom: '1px solid var(--border-color)',
                        opacity: item.alreadyTracked ? 0.6 : 1
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                        <Form.Check
                          type="checkbox"
                          checked={item.selected}
                          disabled={item.alreadyTracked}
                          onChange={() => toggleScreenshotItem(item.id)}
                        />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>{item.detectedName}</span>
                            {item.alreadyTracked && (
                              <Badge bg="secondary" style={{ fontSize: 10 }}>Already Tracked</Badge>
                            )}
                          </div>
                          <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                            {item.category} · Renews: {item.nextBillingDate}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Form.Control
                          type="number"
                          step="0.01"
                          size="sm"
                          value={item.amount}
                          onChange={(e) => updateScreenshotItemAmount(item.id, parseFloat(e.target.value) || 0)}
                          style={{ width: 85, textAlign: 'right', fontSize: 13 }}
                        />
                        <Form.Select
                          size="sm"
                          value={item.billingCycle}
                          onChange={(e) => updateScreenshotItemCycle(item.id, e.target.value as BillingCycle)}
                          style={{ width: 95, fontSize: 12 }}
                        >
                          <option value="monthly">/mo</option>
                          <option value="yearly">/yr</option>
                          <option value="weekly">/wk</option>
                        </Form.Select>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => {
                      setDetectedScreenshotItems([]);
                      setScreenshotRawText('');
                    }}
                    style={{ fontSize: 13 }}
                  >
                    Clear & Rescan
                  </button>
                  <button
                    type="button"
                    className="btn-primary-action"
                    disabled={detectedScreenshotItems.filter(i => i.selected).length === 0}
                    onClick={handleCommitScreenshotImport}
                  >
                    <Check size={16} />
                    <span>Import {detectedScreenshotItems.filter(i => i.selected).length} Subscriptions</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ================= STEP 2B: SMART PRESET WIZARD ================= */}
        {currentStep === 'preset_wizard' && (
          <div style={{ padding: '28px 30px' }}>
            {/* Sub-Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <button
                type="button"
                className="btn-ghost d-flex align-items-center gap-1"
                onClick={() => setCurrentStep('select_method')}
                style={{ fontSize: 13, padding: '4px 8px' }}
              >
                <ArrowLeft size={15} />
                <span>Back to options</span>
              </button>
              <div className="d-flex align-items-center gap-2">
                {detectedLocation && (
                  <span
                    style={{
                      fontSize: 11.5,
                      padding: '2px 8px',
                      borderRadius: 100,
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    📍 {detectedLocation.flag} {detectedLocation.countryName} ({currency})
                  </span>
                )}
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)' }}>
                  {selectedPresetList.length} selected ({formatCurrency(totalMonthlyPresetEstimated, currency)}/mo)
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
                Select Your Subscriptions
              </h3>
              <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', margin: 0 }}>
                Tap the services you use. Standard pricing and billing cycles are automatically tailored for {detectedLocation?.countryName || 'your region'}.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, marginBottom: 14 }}>
              {categories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    fontSize: 12,
                    padding: '4px 12px',
                    borderRadius: 100,
                    border: selectedCategory === cat ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                    backgroundColor: selectedCategory === cat ? 'var(--primary-subtle)' : 'var(--bg-secondary)',
                    color: selectedCategory === cat ? 'var(--primary)' : 'var(--text-secondary)',
                    fontWeight: selectedCategory === cat ? 600 : 400,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {cat === 'all' ? 'All Services' : cat}
                </button>
              ))}
            </div>

            {/* Services Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: 10,
                maxHeight: 290,
                overflowY: 'auto',
                padding: '2px',
                marginBottom: 20
              }}
            >
              {filteredCatalog.map(service => {
                const isSelected = selectedPresetIds[service.name]?.selected || false;
                const isTracked = subscriptions.some(sub => sub.name.toLowerCase() === service.name.toLowerCase());

                return (
                  <div
                    key={service.name}
                    onClick={() => {
                      if (!isTracked) togglePresetService(service.name);
                    }}
                    style={{
                      border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px 14px',
                      backgroundColor: isSelected ? 'var(--primary-subtle)' : 'var(--card-bg)',
                      cursor: isTracked ? 'default' : 'pointer',
                      opacity: isTracked ? 0.6 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: service.color || 'var(--primary)',
                          flexShrink: 0
                        }}
                      />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>
                          {service.name}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          ${service.defaultAmount.toFixed(2)}/{service.billingCycle === 'yearly' ? 'yr' : 'mo'}
                        </div>
                      </div>
                    </div>

                    <div>
                      {isTracked ? (
                        <Badge bg="secondary" style={{ fontSize: 9 }}>Added</Badge>
                      ) : isSelected ? (
                        <div
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            backgroundColor: 'var(--primary)',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Check size={12} />
                        </div>
                      ) : (
                        <div
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            border: '1px solid var(--border-color)',
                            backgroundColor: 'var(--bg-secondary)'
                          }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Commit Action */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
                Estimated Total: <strong>{formatCurrency(totalMonthlyPresetEstimated, currency)}/mo</strong>
              </div>
              <button
                type="button"
                className="btn-primary-action"
                disabled={selectedPresetList.length === 0}
                onClick={handleCommitPresetImport}
              >
                <Check size={16} />
                <span>Add {selectedPresetList.length} Subscriptions</span>
              </button>
            </div>

          </div>
        )}

        {/* ================= STEP 3: COMPLETION & CATCH-ALL ================= */}
        {currentStep === 'completed' && (
          <div style={{ padding: '40px 32px', textAlign: 'center' }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}
            >
              <CheckCircle2 size={32} />
            </div>

            <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
              Successfully Added {importedCount} Subscriptions!
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, maxWidth: 480, margin: '0 auto 24px', lineHeight: 1.5 }}>
              Your subscriptions are now tracked with renewal alarms, monthly spending calculations, and cancellation portals.
            </p>

            {/* Cross-Method Offer Card */}
            <div
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '16px 20px',
                maxWidth: 520,
                margin: '0 auto 28px',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 14
              }}
            >
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 2 }}>
                  {completedFromMethod === 'screenshot'
                    ? 'Want to add other services quickly?'
                    : 'Have an iPhone or bank screenshot?'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {completedFromMethod === 'screenshot'
                    ? 'Tap logos in the Smart Preset Wizard to catch any missing apps.'
                    : 'Scan your Apple ID or bank screenshot to auto-extract the rest.'}
                </div>
              </div>
              <button
                type="button"
                className="btn-subtle"
                style={{ flexShrink: 0, fontSize: 12.5, border: '1px solid var(--border-color)' }}
                onClick={() => {
                  if (completedFromMethod === 'screenshot') {
                    setCurrentStep('preset_wizard');
                  } else {
                    setCurrentStep('screenshot_scan');
                  }
                }}
              >
                {completedFromMethod === 'screenshot' ? 'Open Preset Wizard' : 'Scan Screenshot'}
              </button>
            </div>

            {/* Done CTA */}
            <div>
              <button
                type="button"
                className="btn-primary-action"
                style={{ minWidth: 180, justifyContent: 'center' }}
                onClick={handleClose}
              >
                <span>Go to Dashboard</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

      </Modal.Body>
    </Modal>
  );
};
