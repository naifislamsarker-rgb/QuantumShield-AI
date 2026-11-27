import { useEffect, useState, type FormEvent } from 'react';
import { ArrowRight, CheckCircle2, Download, Mail, Loader2 } from 'lucide-react';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useFirebase } from '../contexts/FirebaseContext';
import {
  safeStorageGet,
  safeStorageRemove,
  safeStorageSet,
  validateAssessmentRequest,
  type RequestMode,
  type StoredSubmissionReceipt,
} from '../utils/quantumReadiness';
import { clampBlueprintString } from '../utils/securityScanner';
import { triggerBrowserDownload } from '../utils/browserExport';

const RECEIPT_STORAGE_KEY = 'qs_submission_receipt_v1';

interface LiveSubmissionReceipt extends StoredSubmissionReceipt {
  emailStatus?: 'sent' | 'not_configured' | 'failed';
  emailDetail?: string;
}

interface ContactAndFooterProps {
  selectedPlanLabel: string;
  initialMode: RequestMode;
  initialSector?: string;
  requestRevision?: number;
}

export function ContactAndFooter({
  selectedPlanLabel,
  initialMode,
  initialSector,
  requestRevision = 0,
}: ContactAndFooterProps) {
  const { user } = useFirebase();
  const [savedReceipt, setSavedReceipt] = useState<LiveSubmissionReceipt | null>(() =>
    safeStorageGet<LiveSubmissionReceipt | null>(RECEIPT_STORAGE_KEY, null)
  );
  const [mode, setMode] = useState<RequestMode>(savedReceipt?.mode ?? initialMode);
  const [fullName, setFullName] = useState(savedReceipt?.fullName ?? '');
  const [organization, setOrganization] = useState(savedReceipt?.organization ?? '');
  const [email, setEmail] = useState(savedReceipt?.email ?? '');
  const [sector, setSector] = useState(savedReceipt?.sector ?? initialSector ?? 'Healthcare');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (requestRevision > 0) {
      setMode(initialMode);
      if (initialSector) {
        setSector(initialSector);
      }
      setSavedReceipt(null);
      safeStorageRemove(RECEIPT_STORAGE_KEY);
    }
  }, [requestRevision, initialMode, initialSector]);

  const clearFieldError = (field: string) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const validation = validateAssessmentRequest({
      fullName,
      organization,
      email,
      sector,
      mode,
      selectedPlan: selectedPlanLabel,
      notes,
    });

    if (!validation.valid) {
      setErrors(validation.errors as Record<string, string>);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/contact/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          organization: organization.trim(),
          email: email.trim(),
          sector,
          mode,
          selectedPlan: selectedPlanLabel,
          notes: notes.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (data?.errors) {
          setErrors(data.errors as Record<string, string>);
        }
        throw new Error(data?.error || 'Could not submit request.');
      }

      const receipt: LiveSubmissionReceipt = {
        referenceId: String(data.referenceId),
        fullName: String(data.fullName),
        organization: String(data.organization),
        email: String(data.email),
        sector: String(data.sector),
        mode: data.mode === 'assessment' ? 'assessment' : 'demo',
        selectedPlan: String(data.selectedPlan),
        submittedAt: String(data.submittedAt || new Date().toISOString()),
        emailStatus: data.emailStatus,
        emailDetail: data.emailDetail,
      };

      if (user && user.emailVerified) {
        const docPath = `assessment_requests/${receipt.referenceId}`;
        try {
          await setDoc(doc(db, 'assessment_requests', receipt.referenceId), {
            referenceId: receipt.referenceId,
            ownerUid: user.uid,
            fullName: clampBlueprintString(receipt.fullName, 120),
            organization: clampBlueprintString(receipt.organization, 160),
            email: clampBlueprintString(receipt.email, 160),
            sector: clampBlueprintString(receipt.sector, 80),
            mode: receipt.mode,
            selectedPlan: clampBlueprintString(receipt.selectedPlan, 60),
            emailStatus:
              receipt.emailStatus === 'sent' || receipt.emailStatus === 'failed'
                ? receipt.emailStatus
                : 'not_configured',
            createdAt: serverTimestamp(),
          });
        } catch (fsErr) {
          handleFirestoreError(fsErr, OperationType.CREATE, docPath);
        }
      }

      safeStorageSet(RECEIPT_STORAGE_KEY, receipt);
      setSavedReceipt(receipt);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Submission failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadReceipt = () => {
    if (!savedReceipt) return;
    triggerBrowserDownload(
      `quantumshield-confirmation-${savedReceipt.referenceId}.json`,
      JSON.stringify(savedReceipt, null, 2),
      'application/json;charset=utf-8'
    );
  };

  const handleResetSubmission = () => {
    safeStorageRemove(RECEIPT_STORAGE_KEY);
    setSavedReceipt(null);
    setFullName('');
    setOrganization('');
    setEmail('');
    setNotes('');
    setErrors({});
    setSubmitError(null);
  };

  return (
    <>
      {/* Section 13: Contact */}
      <section
        id="contact"
        className="relative border-b border-slate-800/80 bg-[#05070E] py-20 lg:py-24"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-1/2 h-[380px] w-[620px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(0,255,255,0.1),transparent_70%)] blur-3xl"
        />

        <div className="relative z-10 mx-auto max-w-7xl px-6">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
            <div className="lg:col-span-5">
              <p className="text-xs font-semibold tracking-wider text-cyan-300 uppercase">
                Get Started
              </p>
              <h2 className="mt-2 font-display text-[clamp(2rem,3.4vw,3rem)] font-bold tracking-tight text-white">
                Protect Your Infrastructure Today
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-300">
                Schedule an executive briefing with our security architects or launch a guided
                Quantum Readiness Score™ assessment for your organization.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setMode('demo');
                    if (savedReceipt) handleResetSubmission();
                  }}
                  className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
                    mode === 'demo'
                      ? 'bg-gradient-to-r from-[#06B6D4] via-[#2D7FF9] to-[#7C3AED] text-white shadow-[0_0_24px_rgba(45,127,249,0.35)]'
                      : 'border border-slate-700 bg-slate-900/70 text-slate-200 hover:border-cyan-400/50'
                  }`}
                >
                  Book a Demo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('assessment');
                    if (savedReceipt) handleResetSubmission();
                  }}
                  className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
                    mode === 'assessment'
                      ? 'bg-gradient-to-r from-[#06B6D4] via-[#2D7FF9] to-[#7C3AED] text-white shadow-[0_0_24px_rgba(45,127,249,0.35)]'
                      : 'border border-slate-700 bg-slate-900/70 text-slate-200 hover:border-cyan-400/50'
                  }`}
                >
                  Start Free Assessment
                </button>
              </div>

              <div className="mt-8 border-t border-slate-800 pt-6 text-xs text-slate-400">
                <p className="font-medium text-slate-200">
                  Selected Deployment Tier: <span className="text-[#00FFFF]">{selectedPlanLabel}</span>
                </p>
                <p className="mt-1">
                  Dhaka Cybersecurity Operations Hub · Serving Healthcare, Microfinance, Education,
                  Industry &amp; Government
                </p>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="glass-surface-elevated rounded-2xl p-7 lg:p-8">
                {savedReceipt ? (
                  <div
                    data-testid="contact-confirmation"
                    className="space-y-4 py-6 text-left"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                      <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <h3 className="font-display text-2xl font-bold text-white">
                      {savedReceipt.mode === 'demo'
                        ? 'Executive Demo Request Confirmed'
                        : 'Free Quantum Readiness Assessment Initiated'}
                    </h3>
                    <p className="text-sm leading-relaxed text-slate-300">
                      Thank you, <strong className="text-white">{savedReceipt.fullName}</strong>. Our
                      architecture team has registered{' '}
                      <strong className="text-white">{savedReceipt.organization}</strong> (
                      {savedReceipt.sector}) under the{' '}
                      <strong className="text-[#00FFFF]">{savedReceipt.selectedPlan}</strong> track
                      for <span className="font-mono text-slate-200">{savedReceipt.email}</span>.
                    </p>
                    <p className="font-mono text-xs text-cyan-300">
                      Reference ID: {savedReceipt.referenceId}
                    </p>
                    {savedReceipt.emailDetail && (
                      <div
                        className={`flex items-start gap-2 rounded-xl border px-3.5 py-2.5 text-xs ${
                          savedReceipt.emailStatus === 'sent'
                            ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-200'
                            : savedReceipt.emailStatus === 'failed'
                            ? 'border-rose-500/35 bg-rose-500/10 text-rose-200'
                            : 'border-cyan-500/30 bg-cyan-500/8 text-cyan-100'
                        }`}
                      >
                        <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span>{savedReceipt.emailDetail}</span>
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleDownloadReceipt}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-400/50 bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-[#00FFFF] transition-colors hover:bg-cyan-500/20 cursor-pointer"
                      >
                        <Download className="h-3.5 w-3.5" aria-hidden="true" />
                        Download Confirmation Receipt
                      </button>
                      <button
                        type="button"
                        onClick={handleResetSubmission}
                        className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 hover:border-cyan-400/60 cursor-pointer"
                      >
                        Submit Another Request
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={(e) => void handleSubmit(e)} noValidate className="space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                      <h3 className="font-display text-lg font-semibold text-white">
                        {mode === 'demo'
                          ? 'Book a Live Platform Demo'
                          : 'Start Your Free Quantum Readiness Assessment'}
                      </h3>
                      <span className="font-mono text-xs text-cyan-300">{selectedPlanLabel}</span>
                    </div>

                    {submitError && (
                      <p role="alert" className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                        {submitError}
                      </p>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="contact-fullname"
                          className="block text-xs font-medium text-slate-300"
                        >
                          Full Name
                        </label>
                        <input
                          id="contact-fullname"
                          type="text"
                          value={fullName}
                          aria-invalid={Boolean(errors.fullName)}
                          aria-describedby={errors.fullName ? 'error-fullname' : undefined}
                          onChange={(e) => {
                            setFullName(e.target.value);
                            clearFieldError('fullName');
                          }}
                          placeholder="e.g., Dr. Farhana Kabir"
                          className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950/90 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-[#00FFFF] focus:outline-none"
                        />
                        {errors.fullName && (
                          <p id="error-fullname" className="mt-1 text-xs text-rose-400">
                            {errors.fullName}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="contact-org"
                          className="block text-xs font-medium text-slate-300"
                        >
                          Organization / Institution
                        </label>
                        <input
                          id="contact-org"
                          type="text"
                          value={organization}
                          aria-invalid={Boolean(errors.organization)}
                          aria-describedby={errors.organization ? 'error-org' : undefined}
                          onChange={(e) => {
                            setOrganization(e.target.value);
                            clearFieldError('organization');
                          }}
                          placeholder="e.g., Dhaka General Health Network"
                          className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950/90 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-[#00FFFF] focus:outline-none"
                        />
                        {errors.organization && (
                          <p id="error-org" className="mt-1 text-xs text-rose-400">
                            {errors.organization}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="contact-email"
                          className="block text-xs font-medium text-slate-300"
                        >
                          Work or Institutional Email
                        </label>
                        <input
                          id="contact-email"
                          type="email"
                          value={email}
                          aria-invalid={Boolean(errors.email)}
                          aria-describedby={errors.email ? 'error-email' : undefined}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            clearFieldError('email');
                          }}
                          placeholder="security@institution.org.bd"
                          className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950/90 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-[#00FFFF] focus:outline-none"
                        />
                        {errors.email && (
                          <p id="error-email" className="mt-1 text-xs text-rose-400">
                            {errors.email}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="contact-sector"
                          className="block text-xs font-medium text-slate-300"
                        >
                          Infrastructure Sector
                        </label>
                        <select
                          id="contact-sector"
                          value={sector}
                          aria-invalid={Boolean(errors.sector)}
                          aria-describedby={errors.sector ? 'error-sector' : undefined}
                          onChange={(e) => {
                            setSector(e.target.value);
                            clearFieldError('sector');
                          }}
                          className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950/90 px-3.5 py-2.5 text-sm text-white focus:border-[#00FFFF] focus:outline-none"
                        >
                          <option value="Healthcare">Healthcare</option>
                          <option value="Microfinance">Microfinance</option>
                          <option value="Education">Education</option>
                          <option value="Government">Government</option>
                          <option value="Industrial & Smart Agriculture">
                            Industrial &amp; Smart Agriculture
                          </option>
                        </select>
                        {errors.sector && (
                          <p id="error-sector" className="mt-1 text-xs text-rose-400">
                            {errors.sector}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="contact-notes"
                        className="block text-xs font-medium text-slate-300"
                      >
                        Infrastructure Scope (Optional)
                      </label>
                      <textarea
                        id="contact-notes"
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Share key portals, APIs, or compliance priorities you want assessed..."
                        className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950/90 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-[#00FFFF] focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#06B6D4] via-[#2D7FF9] to-[#7C3AED] px-6 py-3 text-sm font-semibold text-white shadow-[0_0_26px_rgba(45,127,249,0.35)] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                          <span>Dispatching Request...</span>
                        </>
                      ) : (
                        <>
                          <span>
                            {mode === 'demo' ? 'Book a Demo' : 'Start Free Assessment'}
                          </span>
                          <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 14: Footer */}
      <footer className="bg-[#04060C] py-14">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-10 border-b border-slate-800/80 pb-10 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <p className="font-display text-xl font-bold text-white">QuantumShield AI</p>
              <p className="mt-2 text-sm font-semibold text-[#00FFFF]">
                Securing Bangladesh&apos;s Digital Future.
              </p>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-300">
                QuantumShield AI protects critical public services, financial systems, healthcare
                infrastructure, educational platforms, and citizen data from future quantum-era
                cyber threats, helping create a safer, smarter, and more resilient digital
                Bangladesh.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:col-span-6">
              <div>
                <p className="text-xs font-semibold text-white uppercase">Platform</p>
                <ul className="mt-3 space-y-2 text-xs text-slate-400">
                  <li>
                    <a href="#solution" className="hover:text-[#00FFFF]">
                      How It Works
                    </a>
                  </li>
                  <li>
                    <a href="#features" className="hover:text-[#00FFFF]">
                      Core Features
                    </a>
                  </li>
                  <li>
                    <a href="#copilot" className="hover:text-[#00FFFF]">
                      AI Security Copilot
                    </a>
                  </li>
                  <li>
                    <a href="#readiness" className="hover:text-[#00FFFF]">
                      Readiness Score™
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <p className="text-xs font-semibold text-white uppercase">Modules</p>
                <ul className="mt-3 space-y-2 text-xs text-slate-400">
                  <li>
                    <a href="#modules" className="hover:text-[#00FFFF]">
                      HealthSecure
                    </a>
                  </li>
                  <li>
                    <a href="#modules" className="hover:text-[#00FFFF]">
                      MicroFinance
                    </a>
                  </li>
                  <li>
                    <a href="#modules" className="hover:text-[#00FFFF]">
                      EduSecure
                    </a>
                  </li>
                  <li>
                    <a href="#modules" className="hover:text-[#00FFFF]">
                      Industrial &amp; GovSecure
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <p className="text-xs font-semibold text-white uppercase">Impact &amp; Access</p>
                <ul className="mt-3 space-y-2 text-xs text-slate-400">
                  <li>
                    <a href="#threat-dashboard" className="hover:text-[#00FFFF]">
                      Threat Dashboard
                    </a>
                  </li>
                  <li>
                    <a href="#pricing" className="hover:text-[#00FFFF]">
                      Business Model
                    </a>
                  </li>
                  <li>
                    <a href="#sdg" className="hover:text-[#00FFFF]">
                      UN SDG Alignment
                    </a>
                  </li>
                  <li>
                    <a href="#contact" className="hover:text-[#00FFFF]">
                      Book a Demo
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-start justify-between gap-4 text-xs text-slate-500 sm:flex-row sm:items-center">
            <p>© 2026 QuantumShield AI. All rights reserved.</p>
            <p>Protect Today. Defend Tomorrow. Secure the Quantum Future.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
