'use client';

import Link from 'next/link';
import { useState } from 'react';
import ScrambleText from '@/components/motion/ScrambleText';

/** Split-header link: mono uppercase, decodes on hover (the ledger recomputing). */
export function NavLink({ href, label }: { href: string; label: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="tnum text-caption font-medium uppercase tracking-[0.12em] text-slate transition-colors hover:text-ink"
    >
      <ScrambleText text={label} isHovered={hovered} />
    </Link>
  );
}
