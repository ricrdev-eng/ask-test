import { formatDate } from "../utils/formatDate.js"
import { extractName } from "../services/nameRegex.js";
import { getRooms } from "../services/crawler.js";

export const steps = [
  {
    step: "start",
    type: "TEXT",
    text: "Olá! Sou a Ricardo do RccD Resorts.",
    jump: "name"
  },
  {
    step: "name",
    type: "QUESTION",
    text: "Qual o seu nome? 😊",
    jump: "checkin",
    onReceive: async ({ conversation, message, prisma }) => {
      const name = extractName(message.text) || message.text.split(" ")[0] || "Viajante";
      conversation.userName = name;

      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { userName: name }
      });
    }
  },
  {
    step: "checkin",
    type: "DATE",
    text: "checkin-output",
    jump: "checkout",
    onReceive: async ({ conversation, message, prisma }) => {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { checkin: message.text }
      });
    },
    script: async () => {
      return "Ótimo! Qual será a data do check-in?";
    }
  },
  {
    step: "checkout",
    type: "DATE",
    text: "checkout-output",
    jump: "orderSummary",
    onReceive: async ({ conversation, message, prisma }) => {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { checkout: message.text }
      });
    },
    script: async ({ conversation, message, prisma }) => {
      return "Perfeito! Agora informe a data de check-out:";
    }
  },
  {
    step: "orderSummary",
    type: "TEXT",
    text: "orderSummary-output",
    script: ({ conversation }) => {
      const checkinFormatted = formatDate(conversation.checkin);
      const checkoutFormatted = formatDate(conversation.checkout);

      return (
        `Perfeito, ${conversation.userName}! 🎉<br>` +
        `Você selecionou os dias <br><br>` +
        `<b>${checkinFormatted} e ${checkoutFormatted}</b>`
      );
    },
    jump: "confirmation"
  },
  {
    step: "confirmation",
    type: "QUESTION",
    text: "Deseja que eu procure as melhores opções agora? (Sim / Não)",
    jump: "searching",
    condition: ({ message }) => {
      const answer = (message?.text || "").trim().toLowerCase();

      if (["sim", "yes", "claro", "Sim", "s", "ss"].includes(answer)) {
        return "searching";
      }
      if (["não", "nao", "no", "Nao", "Não", "naum", "nan", "nada", "n", "nn"].includes(answer)) {
        return "checkin";
      }

      return "confirmation";
    },
  },
  {
    step: "searching",
    type: "CAROUSEL",
    text: "Só um momento… estou buscando as melhores opções. 🔍",
    jump: "select",
    script: async ({ conversation }) => {
      const payload = {
        checkin: conversation.checkin,
        checkout: conversation.checkout,
      }
      const rooms = await getRooms(payload.checkin, payload.checkout);

      if (!rooms || rooms.length === 0) {
        return "Infelizmente não encontrei opções disponíveis para essas datas";
      }

      const items = rooms.map(room => ({
        title: room.name,
        description: room.description,
        image: room.image,
        prices: room.prices?.map(p => ({
          title: p.title,
          value: p.value,
          description: p.description
        })) || []
      }));

      return {
        items
      };
    }
  },
  {
    step: "select",
    type: "QUESTION",
    text: "Gostou de alguma opção? Qual deseja selecionar?",
    jump: "finish"
  },
  {
    step: "finish",
    type: "FINISH",
    text: "Perfeito! Irei agora encerrar nossa conversa. Mas não se preocupe, caso queira uma nova cotação estamos disponíveis.",
    jump: "done"
  }
];
