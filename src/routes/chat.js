// src/routes/chat.js
import express from "express";
import crypto from "crypto";
import prisma from "../prismaClient.js";
import { processMessage } from "../services/nlpService.js";
import { steps } from "../flow/bookingFlow.js";
import { getStep } from "../utils/getFlowStep.js";
import MessageService from "../services/message.js";
import ConversationService from "../services/conversation.js";
import ClientService from "../services/client.js";

const router = express.Router();

async function processConversationLogic({ clientId, conversation, message }) {
  let currentStep = getStep(conversation.step);

  // Se o step atual é question/date → significa que devemos PROCESSAR A RESPOSTA
  if (currentStep.type === "question" || currentStep.type === "date") {

    // Se existir callback de receber resposta, executa
    if (currentStep.onReceive) {
      await currentStep.onReceive({ conversation, message });
    }

    // Agora avança para o próximo step
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { step: currentStep.jump }
    });

    // Novo step
    currentStep = getStep(currentStep.jump);
  }

  // Agora envia a mensagem do step atual
  const reply = [{ type: currentStep.type, text: currentStep.text }];

  // Salvar mensagem do bot
  await saveMessage({
    conversationId: conversation.id,
    sender: "bot",
    type: currentStep.type === "question" ? "text" : currentStep.type,
    text: currentStep.text
  });

  return { reply };
}

router.post("/", async (req, res) => {
  try {
    let { clientId, message, conversationId } = req.body;
    let conversation;
    let client = await ClientService.ensureClient(clientId);

    if (client) {
      conversation = await ConversationService.findOpenConversation({ clientId: client.id });
      // Quando o cliente recarrega a página o histórico deve trazer toda a conversa.
      if (conversation && !message) {
        const history = await ConversationService.conversationHistory(conversation.id);
        return res.json({
          clientId: client.id,
          conversationId: conversation.id,
          reply: history.map(m => ({
            type: m.type,
            text: m.text,
            sender: m.sender
          }))
        });
      }

      if (!conversation) {
        conversation = await ConversationService.createConversation({ clientId: client.id })
      }

      if (message) {
        await MessageService.saveMessage({
          conversationId: conversation.id,
          sender: "user",
          text: message.text,
          type: message.type
        });
      }

      let currentStep = getStep(conversation.step);

      if ((currentStep.type === "question" || currentStep.type === "date") && message) {
        if (currentStep.onReceive) {
          await currentStep.onReceive({ conversation, message, prisma });
        }

        let nextStep = currentStep.jump;

        if (currentStep.condition) {
          const dynamicJump = currentStep.condition({ message });
          if (dynamicJump) {
            nextStep = dynamicJump;
          }
        }

        conversation = await ConversationService.updateConversation({
          conversationId: conversation.id,
          data: { step: currentStep.jump }
        });

        currentStep = getStep(currentStep.jump);
      }

      let reply = [];
      let step = currentStep;

      while (step) {
        let treatedText;

        if (step.script) {
          treatedText = await step.script({ conversation });
        }
        else if (typeof step.text === "function") {
          treatedText = step.text({ conversation });
        }
        else {
          treatedText = step.text;
        }

        reply.push({ type: step.type, text: treatedText });

        await MessageService.saveMessage({
          conversationId: conversation.id,
          sender: "bot",
          type: step.type,
          text: treatedText
        });

        if (step.type === "question" || step.type === "date") break;
        if (!step.jump) break;

        await ConversationService.updateConversation({
          conversationId: conversation.id,
          data: { step: currentStep.jump }
        });

        step = steps.find(s => s.step === step.jump);
      }


      // await MessageService.saveMessage({
      //   conversationId: conversation.id,
      //   sender: "bot",
      //   type: currentStep.type,
      //   text: currentStep.text
      // });

      res.json({
        clientId,
        conversationId: conversation.id,
        reply
      });

      // Iniciando fluxo mockado. Com start -> name -> destino -> checkin -> checkout
      // switch (conversation.step) {
      //   case "start": {
      //     reply = [
      //       { type: "text", text: `Olá! Sou a Clarinha do Clara Resorts.`},
      //       { type: "text", text: "Qual o seu nome?" },
      //     ]
      //     updateConversationStep({ conversationId: conversation.id, step: "name"})
      //     break;
      //   }
      //   case "name": {
      //     let name = null;
      //     if (processMessage && typeof processMessage === "function" && message) {
      //       try {
      //         const nlpRes = await processMessage(message);
      //         name = nlpRes?.name || "Viajante";
      //       } catch (err) {
      //         console.log("Não foi possível processar nome. Considerando 'Viajante'", err)
      //       }
      //     }
      //     // if (!name && message) {
      //     //   const m = message.match(/(?:meu nome é|me chamo|sou|i'm|my name is)\s+([A-Za-zÀ-ÿ'\- ]+)/i);
      //     //   if (m) name = m[1].trim().split(" ")[0];
      //     // }
      //     console.log('message', message)
      //     const usedName = name
      //     await updateClient({ clientId, data: { name: usedName } })
      //     reply = [
      //       { type: "text", text: `Perfeito ${usedName}! Para qual data seria o checkin?` },
      //     ];
      //     updateConversationStep({ conversationId: conversation.id, step: "checkin"})
      //
      //     for (const msg of reply) {
      //       await saveMessage({
      //         conversationId: conversation.id,
      //         text: msg.text,
      //         messageType: msg.type,
      //         sender: "bot" });
      //     }
      //   }
      //     break;
      //   case "checkin": {
      //     conversation.city = message;
      //     // atualiza cidade no client
      //     await prisma.client.update({
      //       where: { id: clientId },
      //       data: { city: message },
      //     });
      //
      //     conversation.step = "destination";
      //     reply = [
      //       { type: "text", text: `Legal! Você está em ${message}.` },
      //       { type: "text", text: "Qual hotel ou destino você gostaria de visitar?" },
      //     ];
      //
      //     for (const r of reply) {
      //       await saveMessage({ clientId, text: r.text, messageType: r.type, direction: "bot" });
      //     }
      //     break;
      //   }
      //   case "checkin": {
      //     conversation.checkin = message;
      //     conversation.step = "checkout";
      //     reply = [
      //       { type: "text", text: "Ótimo! Agora informe a data de check-out (YYYY-MM-DD):" },
      //       { type: "date", text: "Selecione a data de check-out" },
      //     ];
      //     for (const r of reply) {
      //       await saveMessage({ clientId, text: r.text, messageType: r.type, direction: "bot" });
      //     }
      //     break;
      //   }
      //   case "checkout": {
      //     conversation.checkout = message;
      //     conversation.step = "done";
      //
      //     reply = [
      //       { type: "text", text: `Perfeito, ${state.name}!` },
      //       { type: "text", text: `Você está em ${state.city} e quer visitar ${state.destination} entre ${state.checkin} e ${state.checkout}.` },
      //       { type: "text", text: "Vou buscar as opções disponíveis para você. Aguarde um momento..." },
      //     ];
      //
      //     // salva replies do bot
      //     for (const r of reply) {
      //       await saveMessage({ clientId, text: r.text, messageType: r.type, direction: "bot" });
      //     }
      //
      //     // aqui você pode chamar sua rota /search (crawler) e retornar o resultado depois
      //     break;
      //   }
      //
      //   default: {
      //     reply = [{ type: "text", text: "Posso te ajudar com mais alguma coisa?" }];
      //     for (const r of reply) {
      //       await saveMessage({ clientId, text: r.text, messageType: r.type, direction: "bot" });
      //     }
      //     break;
      //   }
      // }
    }

    // if (!clientId) {
    //   console.log('entrou no carai do if')
    //   clientId = crypto.randomUUID();
    //   await ensureClient(clientId);
    //   // Salvar mensagens do bot no DB
    //   for (const r of initialReplies) {
    //     await saveMessage({ clientId, text: r.text, messageType: r.type, direction: "bot" });
    //   }
    //
    //   return res.json({ clientId, reply: initialReplies });
    // }
    //
    // return res.json({ clientId, reply });
  } catch (err) {
    console.error("Chat error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
