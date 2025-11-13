import prisma from "../prismaClient.js";

const MessageService = {
  async saveMessage({ conversationId, text, type = "text", sender = "user" }) {
    return prisma.message.create({
      data: {
        conversationId,
        sender,
        type,
        text
      }
    });
  }
}

export default MessageService;