import { getChatMessages, saveChatMessage } from "./services/chat.service";


await saveChatMessage(4, "user", "Hello from Postman test");

const messages = await getChatMessages(4);

console.log("CHAT MESSAGES:", messages);