import { db } from "../prisma/db";

export async function createChat(notebookId: number) {
  const chat = await db.orm.public.Chat.create({
    notebookId,
  });

  return chat;
}

export async function getChatsByNotebookId(notebookId: number) {
  const chats = await db.orm.public.Chat
    .where({
      notebookId,
    })
    .all();

  return chats; 
}
