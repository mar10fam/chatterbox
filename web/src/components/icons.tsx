// UI icons come from lucide-react (shadcn's icon set). This file only holds
// the Chatterbox logo, which is custom artwork.

/** tone="inverse" is the white bubble used on the purple landing hero. */
export function LogoMark({ size = 34, tone = "default" }: { size?: number; tone?: "default" | "inverse" }) {
  const inverse = tone === "inverse";
  return (
    <svg width={size} height={size} viewBox="0 0 34 34" fill="none" aria-hidden="true">
      <path
        d="M8 5h18a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H16l-6.5 5v-5H8a5 5 0 0 1-5-5V10a5 5 0 0 1 5-5z"
        fill={inverse ? "#FFFFFF" : "#7C83FD"}
        stroke="#303650"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path
        d="M11 13v4M15 10.5v9M19 12v6M23 14v2"
        stroke={inverse ? "#5B62E8" : "#303650"}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
