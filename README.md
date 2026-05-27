# Gestao Financeira

Aplicativo mobile em Expo com API Node.js/Express, Prisma e PostgreSQL no Neon.

## 1. Criar banco Neon

1. Acesse https://console.neon.tech e crie uma conta ou entre na sua conta.
2. Crie um novo projeto.
3. No dashboard do projeto, clique em `Connect`.
4. Selecione a branch, o banco e o role desejados.
5. Copie a connection string PostgreSQL. Ela deve ser parecida com:

```env
postgresql://usuario:senha@host.neon.tech/nome_do_banco?sslmode=require
```

Use essa URL no `DATABASE_URL` do backend.

Referencia: https://neon.com/docs/get-started/connect-neon

## 2. Configurar .env

Crie o arquivo `backend/.env` a partir de `backend/.env.example`:

```env
DATABASE_URL="postgresql://usuario:senha@host.neon.tech/nome_do_banco?sslmode=require"
PORT=3000
JWT_SECRET="troque-por-uma-chave-segura"
JWT_EXPIRES_IN="1d"
```

O servidor e o seed tambem tentam ler um `.env` na raiz do projeto como fallback. Para os comandos do Prisma CLI, prefira manter o arquivo em `backend/.env`.

## 3. Instalar dependencias do backend

```bash
cd backend
npm install
```

No Windows, se o PowerShell bloquear `npm`, use:

```bash
npm.cmd install
```

## 4. Rodar Prisma migrate

Com o `backend/.env` configurado:

```bash
npx prisma migrate dev --name init
```

Esse comando cria/aplica as tabelas no Neon e gera o Prisma Client.

## 5. Rodar seed

```bash
npm run prisma:seed
```

O seed cadastra as categorias padrao usadas por todos os usuarios.

## 6. Iniciar API

```bash
npm run dev
```

A API fica disponivel em:

```text
http://localhost:3000
```

Teste rapido:

```bash
curl http://localhost:3000/
```

Resposta esperada:

```json
{
  "ok": true,
  "name": "gestao-financeira-api"
}
```

## 7. Instalar dependencias do frontend

Em outro terminal:

```bash
cd frontend
npm install
```

No Windows, se necessario:

```bash
npm.cmd install
```

## 8. Iniciar Expo

```bash
npm start
```

Depois, escolha o emulador/simulador ou escaneie o QR Code pelo Expo Go.

## 9. Configurar baseURL no Expo

Edite `frontend/src/api/client.js` e ajuste o `baseURL` conforme onde o app esta rodando:

```js
const api = axios.create({
  baseURL: "http://10.0.2.2:3000"
});
```

Use uma destas URLs:

- Android Emulator: `http://10.0.2.2:3000`
- iOS Simulator: `http://localhost:3000`
- Celular fisico: IP local da maquina, por exemplo `http://192.168.0.10:3000`

No celular fisico, o computador e o celular precisam estar na mesma rede.

## 10. Importar e testar collection do Postman

A collection esta em:

```text
backend/postman/collection.json
```

Para importar:

1. Abra o Postman.
2. Clique em `Import`.
3. Selecione o arquivo `backend/postman/collection.json`.
4. Confirme a importacao.

Referencia: https://learning.postman.com/docs/getting-started/importing-and-exporting/importing-data/

Para testar:

1. Inicie a API com `npm run dev`.
2. Rode `Health Check` e confirme status `200`.
3. Rode `Auth - Register`.
4. Rode `Auth - Login`.
5. Copie o `token` retornado no login.
6. Na collection, atualize a variavel `token` com esse valor.
7. Rode `Categories - List` para obter as categorias padrao.
8. Para testar transacoes, copie um `id` de categoria para a variavel `categoryId`.
9. Rode `Transactions - Create`, `Transactions - List`, `Transactions - List By Month`, `Transactions - Update` e `Transactions - Delete`.
10. Para testar categorias customizadas, use `Categories - Create`, copie o `id` retornado para `categoryId`, depois rode `Categories - Update` e `Categories - Delete`.

Observacoes:

- Rotas de categorias e transacoes exigem token JWT.
- Categorias padrao aparecem para todos os usuarios e nao podem ser excluidas.
- Categorias customizadas pertencem apenas ao usuario autenticado.
- Transacoes pertencem apenas ao usuario autenticado.
- Erros de validacao retornam no formato `{ "error": "Dados inválidos", "details": [...] }`.
