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

/**
 * Every workspace belonging to one owner.
 *
 * Newest first, so a client that needs to pick one on first run lands on the
 * most recent. Notebooks are included so a list is directly renderable and the
 * client does not have to fetch each workspace individually to find its data.
 */
export async function getWorkspacesByOwnerId(ownerId: number) {
  const workspaces = await db.orm.public.Workspace
    .where({
      ownerId,
    })
    .include("notebooks")
    .all();

  return workspaces.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function deleteWorkspace(id: number) {
  const workspace = await db.orm.public.Workspace
    .where({
      id,
    })
    .first();

  if (!workspace) {
    return null;
  }

  await db.orm.public.Workspace
    .where({
      id,
    })
    .delete();

  return workspace;
}