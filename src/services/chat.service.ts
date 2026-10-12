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


export async function saveChatMessage(
  chatId: number,
  role: "user" | "assistant",
  content: string,
) {
  const message = await db.orm.public.ChatMessage.create({
    chatId,
    role,
    content,
  });

  return message;
}


export async function getChatMessages(chatId: number) {
  const messages = await db.orm.public.ChatMessage
    .where({
      chatId,
    })
    .all();

  return messages;
}
