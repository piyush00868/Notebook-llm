import { clerkClient } from "@clerk/express";
import { db } from "../prisma/db";

export async function getCurrentUser(clerkUserId: string) {
  return db.orm.public.User
    .where({ clerkUserId })
    .first();
}

export async function syncCurrentUser(clerkUserId: string) {
  // 1. Check whether this Clerk user is already linked.
  const existingUser = await getCurrentUser(clerkUserId);

  if (existingUser) {
    return existingUser;
  }

  // 2. Get the user from Clerk.
  const clerkUser = await clerkClient.users.getUser(clerkUserId);

  const primaryEmail = clerkUser.emailAddresses.find(
    (email) => email.id === clerkUser.primaryEmailAddressId,
  );

  if (!primaryEmail) {
    throw new Error("Clerk user has no primary email");
  }

  // 3. Check whether we already have a database user
  // with this email.
  const existingEmailUser = await db.orm.public.User
    .where({
      email: primaryEmail.emailAddress,
    })
    .first();

  // 4. Link the existing database user to Clerk.
  if (existingEmailUser) {
    return db.orm.public.User
      .where({
        id: existingEmailUser.id,
      })
      .update({
        clerkUserId,
      });
  }

  // 5. No existing user -> create a new one.
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