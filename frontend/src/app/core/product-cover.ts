// The catalog has no product photography, so every product gets a generated
// cover instead: a brand-colored tile with a game-themed icon, picked
// deterministically from the product id so the same item always looks the same.
const COVER_COLORS = ['#c3001e', '#058d69', '#000430', '#3e4ec6', '#8f0016', '#d99a2b'];
const COVER_ICONS = [
  'shield', 'auto_awesome', 'military_tech', 'diamond',
  'flash_on', 'casino', 'local_fire_department', 'sports_esports',
];

export function coverColorFor(productId: number): string {
  return COVER_COLORS[productId % COVER_COLORS.length];
}

export function coverIconFor(productId: number): string {
  // The *7 just decorrelates icon from color so consecutive ids don't repeat the same pairing.
  return COVER_ICONS[(productId * 7) % COVER_ICONS.length];
}
