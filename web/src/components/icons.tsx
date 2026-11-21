import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Stroke({ size = 20, strokeWidth = 2, children, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function LogoMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 34 34" fill="none" aria-hidden="true">
      <path
        d="M8 5h18a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H16l-6.5 5v-5H8a5 5 0 0 1-5-5V10a5 5 0 0 1 5-5z"
        fill="#7C83FD"
        stroke="#303650"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path d="M11 13v4M15 10.5v9M19 12v6M23 14v2" stroke="#303650" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export const MicIcon = (p: IconProps) => (
  <Stroke {...p}>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
  </Stroke>
);

export const BarChartIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </Stroke>
);

export const SlidersIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12" />
    <circle cx="16" cy="6" r="2" />
    <circle cx="10" cy="12" r="2" />
    <circle cx="18" cy="18" r="2" />
  </Stroke>
);

export const SignOutIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
  </Stroke>
);

export const MenuIcon = (p: IconProps) => (
  <Stroke size={24} strokeWidth={2.2} {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Stroke>
);

export const CloseIcon = (p: IconProps) => (
  <Stroke size={22} strokeWidth={2.2} {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Stroke>
);

export const LineChartIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M3 3v18h18" />
    <path d="M7 15l4-4 3 3 5-6" />
  </Stroke>
);

export const ListIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M4 5h16M4 10h16M4 15h10M4 20h6" />
  </Stroke>
);
