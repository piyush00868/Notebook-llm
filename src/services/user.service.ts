import { db } from "../prisma/db";

type CreateUserInput = {
  email: string;
  username: string;
  name: string;
};

export async function createUser(input: CreateUserInput) {
  const user = await db.orm.public.User.create({
    email: input.email,
    username: input.username,
    name: input.name,
  });

  return user;
}