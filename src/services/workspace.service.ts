import { db } from "../prisma/db";

type CreateWorkspaceInput = {
  name: string;
  ownerId: number;
};

export async function createWorkspace(input: CreateWorkspaceInput) {
  const workspace = await db.orm.public.Workspace.create({
    name: input.name,
    ownerId: input.ownerId,
  });

  return workspace;
}

export async function getWorkspaceById(id: number) {
  const workspace = await db.orm.public.Workspace
    .where({
      id,
    })
    .include("owner")
    .include("notebooks")
    .first();

  return workspace;
}