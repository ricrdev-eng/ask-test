import prisma from "../prismaClient.js";

const MessageService = {
  async saveMessage({ conversationId, text, type = "TEXT", sender = "USER" , data = null}) {
    return prisma.message.create({
      data: {
        conversationId,
        sender,
        type,
        text,
        data
      }
    });
  }
}

export default MessageService;