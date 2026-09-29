import { db } from "../prisma/db";

type CreateNotebookInput = {
  name: string;
  workspaceId: number;
};

export async function createNotebook(input: CreateNotebookInput) {
  const notebook = await db.orm.public.Notebook.create({
    name: input.name,
    workspaceId: input.workspaceId,
  });

  return notebook;
}

export async function getNotebookById(id: number) {
  const notebook = await db.orm.public.Notebook
    .where({
      id,
    })
    .include("documents")
    .first();

  return notebook;
}