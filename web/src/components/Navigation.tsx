'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { buildAuditHref } from '@/lib/audit-routing';
import { shouldHideChrome } from '@/lib/no-chrome-routes';

const navLinks = [
  { href: '/services', label: 'Services' },
  { href: '/systems', label: 'Systems' },
  { href: '/process', label: 'Process' },
  { href: '/capabilities', label: 'Capabilities' },
  { href: '/proof', label: 'Proof' },
  { href: '/security', label: 'Security' },
];

export function Navigation() {
  const pathname = usePathname();
  const [openForPath, setOpenForPath] = useState<string | null>(null);

  // Dedicated conversion pages opt out of chrome to keep the buyer on-page.
  if (shouldHideChrome(pathname)) {
    return null;
  }

  const mobileOpen = openForPath === pathname;
  const isAuditPage = pathname === '/audit';
  const mobileMenuId = 'main-mobile-menu';

  const closeMobileMenu = () => {
    setOpenForPath(null);
  };

  const toggleMobileMenu = () => {
    setOpenForPath((current) => (current === pathname ? null : pathname));
  };

  return (
    <nav aria-label="Main navigation" className="fixed top-0 left-0 right-0 z-50 glass border-b-0 border-border">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2" onClick={closeMobileMenu}>
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          <span className="font-mono text-sm tracking-wider uppercase text-foreground/80">
            Juan Canfield <span className="hidden sm:inline"><span className="text-foreground/30">|</span> Architect</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? 'page' : undefined}
              className={`text-sm transition-colors ${
                pathname === link.href
                  ? 'text-primary'
                  : 'text-foreground/60 hover:text-foreground'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href={buildAuditHref({ source: 'navigation' })}
            aria-current={isAuditPage ? 'page' : undefined}
            className={`text-sm font-medium px-4 py-2 rounded-md transition-colors ${
              isAuditPage
                ? 'bg-primary text-black'
                : 'bg-surface hover:bg-surface-hover border border-border text-white'
            }`}
          >
            Start Systems Audit
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <div className="flex lg:hidden items-center gap-3">
          <Link
            href={buildAuditHref({ source: 'navigation' })}
            aria-current={isAuditPage ? 'page' : undefined}
            className="hidden sm:inline-flex text-xs font-medium px-3 py-1.5 bg-surface hover:bg-surface-hover border border-border rounded-md transition-colors text-white"
            onClick={closeMobileMenu}
          >
            Audit
          </Link>
          <button
            onClick={toggleMobileMenu}
            className="p-2 text-foreground/60 hover:text-foreground transition-colors"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            aria-controls={mobileMenuId}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id={mobileMenuId}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden overflow-hidden border-t border-border"
          >
            <div className="px-6 py-4 space-y-1 bg-surface shadow-[var(--card-shadow)]">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMobileMenu}
                  aria-current={pathname === link.href ? 'page' : undefined}
                  className={`block py-3 text-sm transition-colors ${
                    pathname === link.href
                      ? 'text-primary'
                      : 'text-foreground/60 hover:text-foreground'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href={buildAuditHref({ source: 'navigation' })}
                onClick={closeMobileMenu}
                aria-current={isAuditPage ? 'page' : undefined}
                className="block py-3 text-sm text-primary font-medium"
              >
                Start Systems Audit →
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
