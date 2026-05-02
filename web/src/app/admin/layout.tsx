import type { ReactNode } from 'react';

export const metadata = {
  title: 'Admin Intake',
  description: 'Private intake queue for portfolio audit requests.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return children;
}
