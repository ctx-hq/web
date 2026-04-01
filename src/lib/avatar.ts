const AVATAR_COLORS = "264653,2a9d8f,e9c46a,f4a261,e76f51";

export function avatarUrl(slug: string, size: number = 20): string {
  return `https://source.boringavatars.com/beam/${size}/${encodeURIComponent(slug)}?colors=${AVATAR_COLORS}`;
}
