// The avatars a user can pick from. The drawings are in src/components/avatar.tsx.
// Ids are stored in users.avatar, so rename or remove one only with a migration.
export const AVATARS = [
  { id: "monster", label: "Red monster" },
  { id: "cat", label: "Orange cat" },
  { id: "chick", label: "Yellow chick" },
  { id: "alien", label: "Green alien" },
  { id: "frog", label: "Green frog" },
  { id: "robot", label: "Teal robot" },
  { id: "penguin", label: "Blue penguin" },
  { id: "ghost", label: "Friendly ghost" },
  { id: "owl", label: "Purple owl" },
  { id: "bunny", label: "Pink bunny" },
] as const;

export type AvatarId = (typeof AVATARS)[number]["id"];

export const AVATAR_IDS = AVATARS.map((a) => a.id) as [AvatarId, ...AvatarId[]];

export function isAvatarId(value: unknown): value is AvatarId {
  return AVATAR_IDS.includes(value as AvatarId);
}

/** A random avatar for a new account. */
export function randomAvatar(): AvatarId {
  return AVATAR_IDS[Math.floor(Math.random() * AVATAR_IDS.length)];
}
