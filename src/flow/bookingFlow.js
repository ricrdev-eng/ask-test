import { formatDate } from "../utils/formatDate.js"

export const steps = [
  {
    step: "start",
    type: "text",
    text: "Olá! Sou a Ricardo do RccD Resorts.",
    jump: "name"
  },
  {
    step: "name",
    type: "question",
    text: "Perfeito! Qual o seu nome? 😊",
    jump: "checkin",
    onReceive: async ({ conversation, message, prisma }) => {
      const name = message.text.split(" ")[0];
      await prisma.client.update({
        where: { id: conversation.clientId },
        data: { name }
      });
    }
  },
  {
    step: "checkin",
    type: "date",
    text: "Ótimo! Qual será a data do check-in?",
    jump: "checkout",
    onReceive: async ({ conversation, message, prisma }) => {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { checkin: message.text }
      });
    }
  },
  {
    step: "checkout",
    type: "date",
    text: "Perfeito! Agora informe a data de check-out:",
    jump: "orderSummary",
    onReceive: async ({ conversation, message, prisma }) => {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { checkout: message.text }
      });
    }
  },
  {
    step: "orderSummary",
    type: "text",
    text: "orderSummary-output",
    script: ({ conversation }) => {
      const checkinFormatted = formatDate(conversation.checkin);
      const checkoutFormatted = formatDate(conversation.checkout);

      return (
        `Perfeito, ${conversation.userName}! 🎉\n` +
        `Sua reserva está entre **${checkinFormatted} e ${checkoutFormatted}**`
      );
    },
    jump: "confirmation"
  },
  {
    step: "confirmation",
    type: "question",
    text: "Deseja que eu procure as melhores opções agora? (Sim / Não)",
    jump: "searching",
    condition: ({ message }) => {
      const answer = (message?.text || "").trim().toLowerCase();

      if (["sim", "yes", "claro"].includes(answer)) {
        return "searching";
      }
      if (["não", "nao", "no"].includes(answer)) {
        return "checkin";
      }

      return "confirmation";
    },
  },
  {
    step: "searching",
    type: "text",
    text: "Só um momento… estou buscando as melhores opções. 🔍",
    jump: "results",
    script: async ({ conversation }) => {
      const payload = {
        checkin: conversation.checkin,
        checkout: conversation.checkout,
      }
      const response = await fetch("http://localhost:8080/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const rooms = await response.json();

      if (!rooms.length) {
        return "Nenhuma acomodação foi encontrada para essas datas";
      }

      let text = `Encontramos **${rooms.length} opções** para as suas datas! 🏨✨\n\n`;

      rooms.forEach((room, index) => {
        text += `${index + 1}) **${room.name}**\n`;
        text += `Descrição: ${room.description}\n`;
        text += `Acesse o link para visualizar as imagens do local: ${room.image}\n`;
        text += `💰 *Opções de preço:*\n`;

        room.prices?.forEach(price => {
          text += `• **${price.title}** — ${price.value}\n`;
          text += `• Descrição: ${price.description}`
        });

        if (index < rooms.length - 1) {
          text += `\n---\n\n`;
        }
      });

      return text;
    }
  },
  {
    step: "results",
    type: "text",
    text: "results-output",
    jump: "done",
    script: ({ conversation }) => {
      const rooms = conversation._searchResults;

      if (!rooms || rooms.length === 0) {
        return "Infelizmente não encontrei opções disponíveis para essas datas.";
      }

      let msg = "Aqui estão as opções disponíveis:\n\n";

      for (const room of rooms) {
        msg += `• **${room.name}**\n`;
        msg += `${room.description}\n`;
        msg += `Preço por diária: ${room.price}\n\n`;
      }

      return msg;
    }
  }
];
