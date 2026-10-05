// Hand-drawn creature avatars on a 64×64 grid. Flat fills only: gradients and clip paths need
// ids, which clash when the same avatar is on the page twice. The round crop comes from CSS.
import type { ReactNode } from "react";
import { AVATAR_IDS, isAvatarId, type AvatarId } from "@/lib/avatars";

const INK = "#1e293b";

function Eyes({ y = 36, left = 25, right = 39, r = 2.8 }) {
  return (
    <>
      <circle cx={left} cy={y} r={r} fill={INK} />
      <circle cx={right} cy={y} r={r} fill={INK} />
      <circle cx={left + r * 0.35} cy={y - r * 0.35} r={r * 0.32} fill="#fff" />
      <circle cx={right + r * 0.35} cy={y - r * 0.35} r={r * 0.32} fill="#fff" />
    </>
  );
}

function Cheeks({ y = 42, left = 20.5, right = 43.5, fill = "#fb7185", opacity = 0.45 }) {
  return (
    <>
      <ellipse cx={left} cy={y} rx={2.7} ry={1.6} fill={fill} opacity={opacity} />
      <ellipse cx={right} cy={y} rx={2.7} ry={1.6} fill={fill} opacity={opacity} />
    </>
  );
}

const DRAWINGS: Record<AvatarId, { bg: string; art: ReactNode }> = {
  monster: {
    bg: "#fee2e2",
    art: (
      <>
        <path d="M21 22Q15 11 21 5q1 9 7 14Z" fill="#fef3c7" />
        <path d="M43 22q6-11 0-17-1 9-7 14Z" fill="#fef3c7" />
        <path d="M10 64V38a22 22 0 0 1 44 0v26Z" fill="#ef4444" />
        <circle cx="17" cy="52" r="2.6" fill="#dc2626" />
        <circle cx="48" cy="55" r="2" fill="#dc2626" />
        <circle cx="46" cy="45" r="1.4" fill="#dc2626" />
        <circle cx="32" cy="33" r="9" fill="#fff" />
        <circle cx="32" cy="34" r="5" fill={INK} />
        <circle cx="34" cy="32" r="1.6" fill="#fff" />
        <path d="M23 45q9 9 18 0Z" fill="#7f1d1d" />
        <path d="M26 45l1.6 3.2 1.6-3.2ZM34.8 45l1.6 3.2 1.6-3.2Z" fill="#fff" />
      </>
    ),
  },
  cat: {
    bg: "#ffedd5",
    art: (
      <>
        <ellipse cx="32" cy="70" rx="24" ry="16" fill="#f97316" />
        <path d="M13 30l4-23 14 12ZM51 30l-4-23-14 12Z" fill="#fb923c" />
        <path d="M17.5 23l2-10 7 6ZM46.5 23l-2-10-7 6Z" fill="#fed7aa" />
        <ellipse cx="32" cy="37" rx="20.5" ry="17" fill="#fb923c" />
        <path d="M28 21v4M32 20v5M36 21v4" stroke="#ea580c" strokeWidth="1.8" strokeLinecap="round" />
        <Eyes y={35} />
        <Cheeks y={41} />
        <path d="M30.4 39.4h3.2L32 41.3Z" fill="#e11d48" />
        <path
          d="M29 42q1.5 1.6 3 0 1.5 1.6 3 0"
          stroke={INK}
          strokeWidth="1.2"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M10 38l7.5 1.5M10 43l7.5-.8M54 38l-7.5 1.5M54 43l-7.5-.8"
          stroke="#9a3412"
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.6"
        />
      </>
    ),
  },
  chick: {
    bg: "#fbbf24",
    art: (
      <>
        <path d="M32 19q-5-7-1-11 3 5 1 11ZM32 19q4-7 8-6-1 5-8 6Z" fill="#fef08a" />
        <ellipse cx="13.5" cy="47" rx="4.5" ry="8" transform="rotate(25 13.5 47)" fill="#fde047" />
        <ellipse cx="50.5" cy="47" rx="4.5" ry="8" transform="rotate(-25 50.5 47)" fill="#fde047" />
        <circle cx="32" cy="41" r="21" fill="#fef08a" />
        <Eyes y={36} />
        <Cheeks y={42} />
        <path d="M28.5 41.5 32 38.6l3.5 2.9L32 45Z" fill="#f97316" />
        <path d="M28.5 41.5h7" stroke="#c2410c" strokeWidth="0.8" />
      </>
    ),
  },
  alien: {
    bg: "#1e1b4b",
    art: (
      <>
        <g fill="#fff">
          <circle cx="11" cy="15" r="0.9" />
          <circle cx="52" cy="11" r="0.8" />
          <circle cx="56" cy="30" r="1" />
          <circle cx="8" cy="40" r="0.8" />
          <circle cx="15" cy="27" r="0.6" />
        </g>
        <ellipse cx="32" cy="70" rx="18" ry="15" fill="#65a30d" />
        <path d="M25 19 19 9M39 19l6-10" stroke="#a3e635" strokeWidth="2" strokeLinecap="round" />
        <circle cx="19" cy="8.5" r="2.8" fill="#f472b6" />
        <circle cx="45" cy="8.5" r="2.8" fill="#f472b6" />
        <path d="M32 16c14 0 18 12 16 22-2 10-10 16-16 16s-14-6-16-16c-2-10 2-22 16-22Z" fill="#a3e635" />
        <path d="M18.5 33c2.5-5 9.5-4 11 3-5.5 2-10 1-11-3ZM45.5 33c-2.5-5-9.5-4-11 3 5.5 2 10 1 11-3Z" fill="#1e1b4b" />
        <circle cx="24" cy="32.5" r="1.3" fill="#fff" />
        <circle cx="40" cy="32.5" r="1.3" fill="#fff" />
        <path d="M29.5 45q2.5 2 5 0" stroke="#365314" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      </>
    ),
  },
  frog: {
    bg: "#dcfce7",
    art: (
      <>
        <ellipse cx="32" cy="70" rx="26" ry="16" fill="#16a34a" />
        <ellipse cx="32" cy="68" rx="14" ry="10" fill="#bbf7d0" />
        <circle cx="21" cy="23" r="8" fill="#22c55e" />
        <circle cx="43" cy="23" r="8" fill="#22c55e" />
        <ellipse cx="32" cy="39" rx="24" ry="16" fill="#22c55e" />
        <circle cx="21" cy="22" r="5.5" fill="#fff" />
        <circle cx="43" cy="22" r="5.5" fill="#fff" />
        <Eyes y={23} left={21} right={43} r={3} />
        <Cheeks y={42} left={15.5} right={48.5} />
        <path d="M19 40q13 10 26 0" stroke="#14532d" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      </>
    ),
  },
  robot: {
    bg: "#ccfbf1",
    art: (
      <>
        <rect x="12" y="51" width="40" height="20" rx="6" fill="#14b8a6" />
        <circle cx="26" cy="57.5" r="2" fill="#fde047" />
        <circle cx="32" cy="57.5" r="2" fill="#f43f5e" />
        <circle cx="38" cy="57.5" r="2" fill="#fff" />
        <rect x="28" y="46" width="8" height="6" fill="#0f766e" />
        <path d="M32 17V10" stroke="#0f766e" strokeWidth="2" />
        <circle cx="32" cy="9" r="3" fill="#f43f5e" />
        <rect x="10" y="27" width="5" height="12" rx="2" fill="#0f766e" />
        <rect x="49" y="27" width="5" height="12" rx="2" fill="#0f766e" />
        <rect x="14" y="17" width="36" height="30" rx="8" fill="#2dd4bf" />
        <rect x="19" y="23" width="26" height="17" rx="5" fill="#134e4a" />
        <rect x="23.5" y="27" width="5" height="6" rx="1.5" fill="#5eead4" />
        <rect x="35.5" y="27" width="5" height="6" rx="1.5" fill="#5eead4" />
        <path d="M28 36.5q4 2 8 0" stroke="#5eead4" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </>
    ),
  },
  penguin: {
    bg: "#dbeafe",
    art: (
      <>
        <ellipse cx="12" cy="53" rx="4" ry="9" transform="rotate(20 12 53)" fill="#1d4ed8" />
        <ellipse cx="52" cy="53" rx="4" ry="9" transform="rotate(-20 52 53)" fill="#1d4ed8" />
        <ellipse cx="32" cy="41" rx="21" ry="25" fill="#2563eb" />
        <path d="M32 27c-6-5-17-1-15 10 1 7 7 11 15 11s14-4 15-11c2-11-9-15-15-10Z" fill="#fff" />
        <ellipse cx="32" cy="63" rx="13" ry="12" fill="#fff" />
        <Eyes y={36} left={26} right={38} />
        <Cheeks y={41} left={21.5} right={42.5} fill="#f472b6" opacity={0.5} />
        <path d="M29 41h6l-3 3.5Z" fill="#f59e0b" />
      </>
    ),
  },
  ghost: {
    bg: "#6366f1",
    art: (
      <>
        <path
          d="M51 10.5l1.2 3 3 1.2-3 1.2-1.2 3-1.2-3-3-1.2 3-1.2ZM12 20l.9 2.2 2.2.9-2.2.9-.9 2.2-.9-2.2-2.2-.9 2.2-.9Z"
          fill="#c7d2fe"
        />
        <path
          d="M14 56V32a18 18 0 0 1 36 0v24q-3 4-6 0-3 4-6 0-3 4-6 0-3 4-6 0-3 4-6 0-3 4-6 0Z"
          fill="#eef2ff"
        />
        <ellipse cx="26" cy="33" rx="2.6" ry="3.5" fill="#312e81" />
        <ellipse cx="38" cy="33" rx="2.6" ry="3.5" fill="#312e81" />
        <circle cx="26.9" cy="31.8" r="0.9" fill="#fff" />
        <circle cx="38.9" cy="31.8" r="0.9" fill="#fff" />
        <Cheeks y={39} left={21} right={43} fill="#f472b6" opacity={0.5} />
        <ellipse cx="32" cy="42" rx="2.2" ry="2.8" fill="#312e81" />
      </>
    ),
  },
  owl: {
    bg: "#f3e8ff",
    art: (
      <>
        <path d="M14 24l2-14 10 8ZM50 24l-2-14-10 8Z" fill="#9333ea" />
        <ellipse cx="13" cy="49" rx="4" ry="10" fill="#7e22ce" />
        <ellipse cx="51" cy="49" rx="4" ry="10" fill="#7e22ce" />
        <ellipse cx="32" cy="43" rx="20" ry="24" fill="#9333ea" />
        <circle cx="25" cy="33" r="8.5" fill="#e9d5ff" />
        <circle cx="39" cy="33" r="8.5" fill="#e9d5ff" />
        <Eyes y={33} r={3.6} />
        <path d="M30 39h4l-2 4Z" fill="#f59e0b" />
        <path
          d="M25 51q2 2 4 0M35 51q2 2 4 0M30 56q2 2 4 0"
          stroke="#d8b4fe"
          strokeWidth="1.4"
          fill="none"
          strokeLinecap="round"
        />
      </>
    ),
  },
  bunny: {
    bg: "#fce7f3",
    art: (
      <>
        <ellipse cx="32" cy="69" rx="20" ry="14" fill="#f472b6" />
        <ellipse cx="32" cy="67" rx="10" ry="8" fill="#fbcfe8" />
        <ellipse cx="24" cy="14" rx="5" ry="13" transform="rotate(-10 24 14)" fill="#f472b6" />
        <ellipse cx="40" cy="14" rx="5" ry="13" transform="rotate(10 40 14)" fill="#f472b6" />
        <ellipse cx="24" cy="15" rx="2.3" ry="9" transform="rotate(-10 24 15)" fill="#fbcfe8" />
        <ellipse cx="40" cy="15" rx="2.3" ry="9" transform="rotate(10 40 15)" fill="#fbcfe8" />
        <ellipse cx="32" cy="39" rx="18" ry="16" fill="#f472b6" />
        <Eyes y={36} left={26} right={38} r={2.6} />
        <Cheeks y={41.5} left={21.5} right={42.5} fill="#be185d" opacity={0.35} />
        <path d="M30.5 40h3L32 41.6Z" fill="#9d174d" />
        <rect x="30.9" y="43" width="2.2" height="2.4" rx="0.5" fill="#fff" />
        <path
          d="M29 42.8q1.5 1.2 3 0 1.5 1.2 3 0"
          stroke={INK}
          strokeWidth="1.1"
          fill="none"
          strokeLinecap="round"
        />
      </>
    ),
  },
};

/** A user's avatar, cropped to a circle. Unknown ids (e.g. a removed avatar) show the first one. */
export function Avatar({ id, size = 36 }: { id: string; size?: number }) {
  const { bg, art } = DRAWINGS[isAvatarId(id) ? id : AVATAR_IDS[0]];

  // Block, not inline-block: inline it sits on the text baseline, which adds a gap below
  // and makes a ring around its button oval.
  return (
    <span
      className="block shrink-0 overflow-hidden rounded-full"
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden className="block">
        <rect width="64" height="64" fill={bg} />
        {art}
      </svg>
    </span>
  );
}
