import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-white/5 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-primary rounded-full" />
              <span className="font-mono text-sm tracking-wider uppercase text-foreground/80">
                Juan Canfield
              </span>
            </div>
            <p className="text-sm text-foreground/50 leading-relaxed max-w-xs">
              AI Solutions Architect. I build autonomous data pipelines, agentic workflows, and enterprise intelligence systems at a fixed price.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-xs font-mono text-foreground/30 tracking-widest mb-4">NAVIGATE</h3>
            <div className="space-y-2">
              {[
                { href: '/about', label: 'About' },
                { href: '/capabilities', label: 'Capabilities' },
                { href: '/proof', label: 'Proof' },
                { href: '/resources', label: 'Resources' },
                { href: '/ai-automation-consultant', label: 'AI Automation Consultant' },
                { href: '/services', label: 'Services & Pricing' },
                { href: '/process', label: 'Process' },
                { href: '/security', label: 'Security' },
                { href: '/privacy', label: 'Privacy' },
                { href: '/architecture', label: 'Architecture' },
                { href: '/demo', label: 'Demo' },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-sm text-foreground/50 hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div>
            <h3 className="text-xs font-mono text-foreground/30 tracking-widest mb-4">GET STARTED</h3>
            <p className="text-sm text-foreground/50 mb-4">
              Every engagement starts with a Systems Audit. I review each submission personally and respond within 48 hours.
            </p>
            <Link
              href="/audit"
              className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
            >
              Start Systems Audit
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>

        <div className="border-t border-white/5 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-foreground/30">
            © {new Date().getFullYear()} Juan Canfield. All rights reserved.
          </p>
          <p className="text-xs text-foreground/30">
            Deterministic Infrastructure for Non-Deterministic Intelligence.
          </p>
        </div>
      </div>
    </footer>
  );
}
