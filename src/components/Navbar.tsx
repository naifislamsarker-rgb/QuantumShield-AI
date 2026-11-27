import { useEffect, useState } from 'react';
import { LogIn, LogOut, Menu, X } from 'lucide-react';
import { useFirebase } from '../contexts/FirebaseContext';

interface NavbarProps {
  onBookDemo: () => void;
}

const NAV_LINKS = [
  { href: '#problem', label: 'Threats' },
  { href: '#copilot', label: 'AI Copilot' },
  { href: '#readiness', label: 'Readiness Score' },
  { href: '#modules', label: 'Modules' },
  { href: '#threat-dashboard', label: 'Threat Index' },
];

export function Navbar({ onBookDemo }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, authReady, authBusy, isAdmin, signInWithGoogle, signOutUser } = useFirebase();

  useEffect(() => {
    if (!mobileOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#05070E]/92 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
        {/* Zone 1: Single clean wordmark */}
        <a
          href="#top"
          className="font-display text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#00FFFF]"
        >
          QuantumShield AI
        </a>

        {/* Zone 2: 5 concise single-line navigation links */}
        <nav
          aria-label="Primary navigation"
          className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-300"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="relative py-1 transition-colors hover:text-[#00FFFF] whitespace-nowrap shrink-0 after:absolute after:right-0 after:bottom-0 after:left-0 after:h-[1.5px] after:origin-left after:scale-x-0 after:bg-[#00FFFF] after:transition-transform after:duration-200 hover:after:scale-x-100"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Zone 3: Auth & Primary CTA */}
        <div className="flex items-center gap-2.5 shrink-0">
          {authReady && (
            user ? (
              <div className="hidden sm:flex items-center gap-2">
                <span className="max-w-[140px] truncate text-xs font-medium text-slate-300">
                  {user.displayName || user.email}
                  {isAdmin ? ' · Admin' : ''}
                </span>
                <button
                  type="button"
                  disabled={authBusy}
                  onClick={signOutUser}
                  aria-label="Sign out of Firebase session"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/75 px-3 py-2 text-xs font-medium text-slate-200 transition-colors hover:border-cyan-400/50 hover:text-[#00FFFF] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={authBusy}
                onClick={signInWithGoogle}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/75 px-3 py-2 text-xs font-medium text-slate-200 transition-colors hover:border-cyan-400/50 hover:text-[#00FFFF] whitespace-nowrap shrink-0 cursor-pointer"
              >
                <LogIn className="h-3.5 w-3.5 text-[#00FFFF]" aria-hidden="true" />
                <span>Sign In</span>
              </button>
            )
          )}

          <button
            type="button"
            onClick={onBookDemo}
            className="hidden sm:inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[#06B6D4] via-[#2D7FF9] to-[#7C3AED] px-4 py-2 text-xs font-semibold text-white shadow-[0_0_24px_rgba(45,127,249,0.35)] transition-all duration-200 hover:brightness-110 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00FFFF]"
          >
            Book a Demo
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-800 text-slate-200 hover:border-cyan-500/50 hover:text-white lg:hidden cursor-pointer"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav
          aria-label="Mobile navigation"
          className="border-t border-slate-800/80 bg-[#070B16] px-6 py-4 lg:hidden"
        >
          <div className="flex flex-col gap-3">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="py-2 text-sm font-medium text-slate-200 hover:text-[#00FFFF]"
              >
                {link.label}
              </a>
            ))}
            {authReady && (
              user ? (
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    void signOutUser();
                  }}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200"
                >
                  <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                  Sign Out ({user.displayName || user.email})
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    void signInWithGoogle();
                  }}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200"
                >
                  <LogIn className="h-3.5 w-3.5 text-[#00FFFF]" aria-hidden="true" />
                  Sign In with Google
                </button>
              )
            )}
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                onBookDemo();
              }}
              className="mt-1 inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[#06B6D4] via-[#2D7FF9] to-[#7C3AED] px-4 py-2.5 text-sm font-semibold text-white"
            >
              Book a Demo
            </button>
          </div>
        </nav>
      )}
    </header>
  );
}
