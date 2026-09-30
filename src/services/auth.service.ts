import { clerkClient } from "@clerk/express";
import { db } from "../prisma/db";

export async function getCurrentUser(clerkUserId: string) {
  return db.orm.public.User
    .where({ clerkUserId })
    .first();
}

export async function syncCurrentUser(clerkUserId: string) {
  const existingUser = await getCurrentUser(clerkUserId);

  if (existingUser) {
    return existingUser;
  }

  const clerkUser = await clerkClient.users.getUser(clerkUserId);

  const primaryEmail = clerkUser.emailAddresses.find(
    (email) => email.id === clerkUser.primaryEmailAddressId,
  );

  if (!primaryEmail) {
    throw new Error("Clerk user has no primary email");
  }

  return db.orm.public.User.create({
    clerkUserId,
    email: primaryEmail.emailAddress,
    ...(clerkUser.username !== null &&
    clerkUser.username !== undefined
      ? { username: clerkUser.username }
      : {}),
    ...(clerkUser.firstName || clerkUser.lastName
      ? {
          name: [clerkUser.firstName, clerkUser.lastName]
            .filter(Boolean)
            .join(" "),
        }
      : {}),
  });
}