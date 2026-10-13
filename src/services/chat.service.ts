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

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };


export async function saveChatMessage(
  chatId: number,
  role: "user" | "assistant",
  content: string,
  sources?: JsonValue,
) {
  const message = await db.orm.public.ChatMessage.create({
    chatId,
    role,
    content,
    ...(sources !== undefined ? { sources } : {}),
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

/**
 * Deletes a conversation.
 *
 * `ChatMessage` rows go with it: the schema declares the relation with
 * `onDelete: Cascade`, so the database removes them.
 *
 * Returns the deleted chat, or `null` when there was nothing to delete.
 */
export async function deleteChat(chatId: number) {
  const chat = await db.orm.public.Chat
    .where({
      id: chatId,
    })
    .first();

  if (!chat) {
    return null;
  }

  await db.orm.public.Chat
    .where({
      id: chatId,
    })
    .delete();

  return chat;
}
