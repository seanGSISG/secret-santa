export function isWishlistEnabled(): boolean {
  return process.env.ENABLE_WISHLIST?.trim().toLowerCase() !== 'false';
}
