import type { Response } from "express";
import type { Request } from "express";
import { z } from "zod";
import { createUser } from "../services/user.service";

const createUserSchema = z.object({
  email: z.email(),
  username: z.string().min(3),
  name: z.string().min(1),
});

export async function createUserController(
  req: Request,
  res: Response
) {
  try {
    const result = createUserSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: "Invalid request data",
        details: result.error,
      });
    }

    const user = await createUser(result.data);

    return res.status(201).json(user);
  } catch (error) {
    console.error(error);

    if (
      typeof error === "object" &&
      error !== null &&
      "sqlState" in error &&
      error.sqlState === "23505"
    ) {
      return res.status(409).json({
        error: "Email already exists",
      });
    }

    return res.status(500).json({
      error: "Failed to create user",
    });
  }
}