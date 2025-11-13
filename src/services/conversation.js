import prisma from '../prismaClient.js'
import crypto from 'crypto'

const ConversationService = {
  async createConversation({ clientId }) {
    return prisma.conversation.create({
      data: {
        id: crypto.randomUUID(),
        clientId: clientId,
        isActive: true,
        userName: 'Viajante',
        createdAt: new Date().toISOString(),
        step: 'start'
      }
    })
  },
  async updateConversation({ conversationId, data }) {
    return prisma.conversation.update({ where: { id: conversationId }, data })
  },
  async findOpenConversation({ clientId }) {
    return prisma.conversation.findFirst({ where: { clientId: clientId, isActive: true } });
  },
  async conversationHistory({ conversationId }) {
    return await prisma.message.findMany({
      where: { conversationId: conversationId },
      orderBy: { createdAt: "asc" }
    });
  }
}

export default ConversationService;
// .chat-bubble {
//   max-width: 75%;
//
//   border-radius: 12px;
//   color: white;
//   animation: fadeIn 0.25s ease-out;
// }