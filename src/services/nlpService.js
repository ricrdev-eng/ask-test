import { NlpManager } from "node-nlp";

const manager = new NlpManager({ languages: ["pt"], forceNER: true });

manager.addDocument("pt", "meu nome é %name%", "introducao.nome");
manager.addDocument("pt", "eu sou o %name%", "introducao.nome");
manager.addDocument("pt", "olá, eu me chamo %name%", "introducao.nome");
manager.addDocument("pt", "oi, sou %name%", "introducao.nome");
manager.addDocument("pt", "ricardo", "introducao.nome");

manager.addNamedEntityText(
  "name",
  "Ricardo",
  ["pt"],
  ["ricardo", "Ricardo"]
);

await manager.train();
manager.save();

export const processMessage = async (text) => {
  const response = await manager.process("pt", text);
  const nameEntity = response.entities.find((e) => e.entity === "name");
  return {
    intent: response.intent,
    name: nameEntity ? nameEntity.option : null,
  };
};