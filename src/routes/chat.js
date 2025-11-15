// src/routes/chat.js
import express from "express";
import crypto from "crypto";
import prisma from "../prismaClient.js";
import { steps } from "../flow/bookingFlow.js";
import { getStep } from "../utils/getFlowStep.js";
import MessageService from "../services/message.js";
import ConversationService from "../services/conversation.js";
import ClientService from "../services/client.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    let { clientId, message, conversationId } = req.body;
    const client = await ClientService.ensureClient(clientId);
    let conversation;

    conversation = await ConversationService.findOpenConversation({ clientId: client.id });
    // Quando o cliente recarrega a página o histórico deve trazer toda a conversa.
    if (conversation && !message) {
      const history = await ConversationService.conversationHistory({conversationId: conversation.id});
      return res.json({
        clientId: client.id,
        conversationId: conversation.id,
        messages: history.map(m => ({
          type: m.type,
          text: m.text,
          data: m.data,
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
        sender: "USER",
        text: message.text,
        type: message.type
      });
    }

    let currentStep = getStep(conversation.step);
    if ((currentStep.type === "QUESTION" || currentStep.type === "DATE" || currentStep.type === "BUTTONS" || currentStep.type === "CAROUSEL" ) && message) {
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
        data: { step: nextStep }
      });

      currentStep = getStep(nextStep);
    }

    message = null;


    let messages = [];
    let step = currentStep;

    while (step) {
      let treatedText;

      if (step.script) {
        treatedText = await step.script({ conversation, message, prisma });
      } else if (typeof step.text === "function") {
        treatedText = step.text({ conversation });
      } else {
        treatedText = step.text;
      }

      if (step.type === "CAROUSEL") {
        messages.push({ type: "CAROUSEL", sender: "BOT", data: treatedText });
        await MessageService.saveMessage({
          conversationId: conversation.id,
          sender: "BOT",
          type: "CAROUSEL",
          text: "",
          data: treatedText
        });
      } else if (step.type === "BUTTONS") {
        messages.push({
          type: "BUTTONS",
          sender: "BOT",
          text: treatedText,
          data: step.buttons
        });
        await MessageService.saveMessage({
          conversationId: conversation.id,
          sender: "BOT",
          type: "BUTTONS",
          text: step.text,
          data: step.buttons
        });
      } else {
        messages.push({
          type: step.type,
          sender: "BOT",
          text: treatedText
        });
        await MessageService.saveMessage({
          conversationId: conversation.id,
          sender: "BOT",
          type: step.type,
          text: treatedText
        });
      }

      if (step.type === "QUESTION" || step.type === "DATE" || step.type === "FINISH" || step.type === "BUTTONS") break;
      if (!step.jump) break;

      await ConversationService.updateConversation({
        conversationId: conversation.id,
        data: { step: step.jump }
      });

      step = steps.find(s => s.step === step.jump);
    }

    res.json({
      clientId,
      conversationId: conversation.id,
      messages
    });
  } catch (err) {
    console.error("Chat error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});
router.patch("/" ,async (req, res) => {
  try {
    const { conversationId, data } = req.body;

    const updatedConversation = await ConversationService.updateConversation({
      conversationId: conversationId,
      data
    });

    res.json(updatedConversation);
  } catch (err) {
    console.error("Error updating conversation:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
})
export default router;
