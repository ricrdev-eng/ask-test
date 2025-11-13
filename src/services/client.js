import prisma from '../prismaClient.js'

const ClientService = {
  async ensureClient(clientId) {
    let client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) {
      client = await prisma.client.create({ data: { id: clientId, name: 'Viajante', city: 'Não informada' } });
    }
    return client;
  },
  async findClient(clientId) {
    let client = await prisma.client.findUnique({ where: { id: clientId } });
  },
  async updateClient(clientId, data) {
    console.log('update cliente', data)
    return prisma.client.update({ where: {id: clientId} , data: data });
  },
}

export default ClientService;