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
   ```
   git clone https://github.com/ricrdev-eng/ask-test cd ask-test
   ```

2. Instale as dependências:
   ```
   npm install
   ```

3. Configure as variáveis de ambiente:
   Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```
PORT=8080
API_URL="https://ask-test-production.up.railway.app"
NODE_ENV=production
```

4. Execute as migrações do banco de dados para rodar em local:
 ```
 npx prisma migrate dev
 ```
## Executando o Projeto

### Desenvolvimento
```
npm run dev
```

## API Endpoints

### Chat
- `POST /chat` - Processa mensagens do chat
    - **Corpo da Requisição:**
      ```json
      {
        "clientId": "string",
        "message": {
          "text": "string",
          "type": "string"
        }
      }
      ```
    - **Resposta:**
      ```json
      {
        "clientId": "string",
        "conversationId": "string",
        "messages": [
          {
            "type": "string",
            "text": "string",
            "data": "object",
            "sender": "string"
          }
        ]
      }
      ```

- `PATCH /chat` - Atualiza informações da conversa
    - **Corpo da Requisição:**
      ```json
      {
        "conversationId": "string",
        "data": "object"
      }
      ```

### Busca
- `POST /search` - Busca disponibilidade de quartos
    - **Corpo da Requisição:**
      ```json
      {
        "checkin": "YYYY-MM-DD",
        "checkout": "YYYY-MM-DD"
      }
      ```
    - **Resposta:**
      ```json
      {
        "rooms": [
          {
            "name": "string",
            "description": "string",
            "price": [
               {
                 "title": "string",
                 "description": "string",
                 "value": "string"
               }
             ],
            "image": "string"
          }
        ]
      }
      ```


## Scripts Disponíveis

- `npm run dev` - Inicia o servidor em modo desenvolvimento
