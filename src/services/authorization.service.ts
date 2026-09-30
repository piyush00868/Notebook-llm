export function assertOwner(
  ownerClerkUserId: string | null,
  currentClerkUserId: string,
) {
  if (ownerClerkUserId !== currentClerkUserId) {
    throw new Error("FORBIDDEN");
  }
}