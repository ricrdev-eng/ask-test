# Asksuite test (backend)

## Sobre o Projeto
Este é o projeto backend que possui duas rotas; Uma para fazer as buscas das vagas disponíveis (/search) e a outra que seria a responsável por executar o motor do bot (/chat)

## Tecnologias Utilizadas

- **Node.js** com Express
- **Prisma** como ORM
- **PostgreSQL** como banco de dados
- **Puppeteer** para web scraping
- **Railway** para deploy e gerenciamento do Backend e do banco de dados da aplicação.

## Pré-requisitos
- Node.js (versão 20.x ou superior)
- PostgreSQL
- NPM ou Yarn

## Configuração do Ambiente

1. Clone o repositório:
   bash git clone https://github.com/ricrdev-eng/ask-test cd ask-test

2. Instale as dependências:
   bash npm install

3. Configure as variáveis de ambiente:
   Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```
PORT=8080
DATABASE_URL="postgresql://postgres:ItEMOGQrajfvlTtoFqWAmpGsGCMGsRWJ@gondola.proxy.rlwy.net:14410/railway"
API_URL="https://ask-test-production.up.railway.app"
NODE_ENV=production
```
4. Execute as migrações do banco de dados para rodar em local:

bash npx prisma migrate dev
## Executando o Projeto

### Desenvolvimento
bash npm run dev

## API Endpoints

### Chat
- `POST /chat` - Processa mensagens do chat
- `PATCH /chat` - Atualiza informações da conversa

### Busca
- `POST /search` - Busca disponibilidade de quartos

## Scripts Disponíveis

- `npm start` - Inicia o servidor em produção
- `npm run dev` - Inicia o servidor em modo desenvolvimento
- `npm run build` - Gera os arquivos do Prisma Client