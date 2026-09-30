import type { Request, Response } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { syncCurrentUser } from "../services/auth.service";

export async function getCurrentUserController(
  req: Request,
  res: Response,
) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const clerkUser = await clerkClient.users.getUser(userId);

    const primaryEmail = clerkUser.emailAddresses.find(
      (email) => email.id === clerkUser.primaryEmailAddressId,
    );

    if (!primaryEmail) {
      return res.status(400).json({
        error: "Clerk user has no primary email",
      });
    }

    const user = await syncCurrentUser(userId);

    return res.status(200).json(user);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Failed to sync user",
    });
  }
}