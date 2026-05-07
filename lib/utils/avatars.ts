/**
 * Get avatar image URL from player ID
 * Uses 20 individual character images (character_01.png to character_20.png)
 */
export function getAvatarUrl(playerId: string): string {
  // Generate consistent avatar index from playerId
  const hash = playerId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const avatarIndex = (hash % 20) + 1; // 20 avatars, 1-indexed

  return `/avaters/character_${avatarIndex.toString().padStart(2, '0')}.png`;
}
