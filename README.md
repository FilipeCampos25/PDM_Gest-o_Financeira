# Gestao Financeira

Aplicativo de gestao financeira pessoal com frontend mobile em Expo, API Node.js/Express, Prisma ORM e PostgreSQL.

O projeto permite cadastro/login de usuarios, categorias padrao e customizadas, lancamentos financeiros, filtros por periodo e resumo financeiro.

## Sumario

- [Tecnologias](#tecnologias)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Configuracao rapida](#configuracao-rapida)
- [Banco de dados](#banco-de-dados)
- [Executando o backend](#executando-o-backend)
- [Executando o frontend](#executando-o-frontend)
- [Endpoints da API](#endpoints-da-api)
- [Tabelas do banco](#tabelas-do-banco)
- [Postman](#postman)
- [Observacoes importantes](#observacoes-importantes)

## Tecnologias

| Camada | Tecnologias |
| --- | --- |
| Mobile | Expo, React Native |
| API | Node.js, Express |
| Banco | PostgreSQL |
| ORM | Prisma |
| Autenticacao | JWT, bcrypt |

## Estrutura do projeto

```text
PDM_Gest-o_Financeira/
  backend/
    prisma/
      schema.prisma
      seed.js
    src/
      app.js
      server.js
      routes/
      middlewares/
  frontend/
    App.js
    src/
      api/
      components/
      constants/
      contexts/
      screens/
```

## Configuracao rapida

Na raiz do projeto, voce pode instalar tudo com:

```bash
npm run install:all
```

No Windows, se o PowerShell bloquear `npm`, use `npm.cmd`:

```bash
npm.cmd run install:all
```

Depois configure o banco, rode as migrations, execute o seed e inicie backend/frontend conforme as secoes abaixo.

## Banco de dados

### Criar o banco no pgAdmin 4

1. Abra o PostgreSQL/pgAdmin 4.
2. Conecte no servidor local. Normalmente:
   - Host: `localhost`
   - Porta: `5432`
   - Usuario: `postgres`
3. Clique com o botao direito em `Databases`.
4. Clique em `Create` > `Database...`.
5. Em `Database`, use:

```text
gestao_financeira
```

6. Em `Owner`, selecione `postgres`.
7. Clique em `Save`.

### Endpoint/URL do banco

O backend acessa o PostgreSQL pela variavel `DATABASE_URL`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/gestao_financeira?schema=public"
```

Formato:

```text
postgresql://USUARIO:SENHA@HOST:PORTA/NOME_DO_BANCO?schema=public
```

Dados de conexao local:

| Item | Valor |
| --- | --- |
| Host | `localhost` |
| Porta | `5432` |
| Banco | `gestao_financeira` |
| Schema | `public` |
| Usuario comum no desenvolvimento | `postgres` |

Exemplo com senha diferente:

```env
DATABASE_URL="postgresql://postgres:123456@localhost:5432/gestao_financeira?schema=public"
```

### Visualizar dados pelo Prisma Studio

Depois de configurar o `.env` e aplicar as migrations, voce pode abrir uma interface visual do banco:

```bash
cd backend
npx prisma studio
```

URL padrao:

```text
http://localhost:5555
```

O Prisma Studio mostra as tabelas `User`, `Category` e `Transaction`.

## Variaveis de ambiente

Crie `backend/.env` a partir de `backend/.env.example`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/gestao_financeira?schema=public"
PORT=3000
JWT_SECRET="troque-por-uma-chave-segura"
JWT_EXPIRES_IN="1d"
```

O servidor e o seed tambem tentam ler um `.env` na raiz do projeto como fallback. Para comandos do Prisma CLI, mantenha o arquivo em `backend/.env`.

## Executando o backend

Entre na pasta do backend:

```bash
cd backend
```

Instale as dependencias, caso ainda nao tenha instalado:

```bash
npm install
```

Aplique as migrations:

```bash
npx prisma migrate dev --name init
```

Rode o seed para criar/atualizar categorias padrao:

```bash
npm run prisma:seed
```

Inicie a API:

```bash
npm run dev
```

A API ficara disponivel em:

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

## Executando o frontend

Em outro terminal:

```bash
cd frontend
npm install
npm start
```

Depois escolha um emulador/simulador ou escaneie o QR Code com o Expo Go.

### Configurar baseURL do app

Edite `frontend/src/api/client.js` e ajuste a `baseURL` conforme o ambiente:

```js
const api = axios.create({
  baseURL: "http://10.0.2.2:3000"
});
```

| Ambiente | URL recomendada |
| --- | --- |
| Android Emulator | `http://10.0.2.2:3000` |
| iOS Simulator | `http://localhost:3000` |
| Celular fisico | `http://SEU_IP_LOCAL:3000` |

No celular fisico, computador e celular precisam estar na mesma rede.

## Endpoints da API

Base URL local:

```text
http://localhost:3000
```

Rotas com cadeado exigem header:

```http
Authorization: Bearer SEU_TOKEN
```

### Health

| Metodo | Endpoint | Auth | Descricao |
| --- | --- | --- | --- |
| GET | `/` | Nao | Verifica se a API esta online |

### Autenticacao

| Metodo | Endpoint | Auth | Descricao |
| --- | --- | --- | --- |
| POST | `/auth/register` | Nao | Cria um usuario |
| POST | `/auth/login` | Nao | Autentica e retorna token JWT |

Exemplo de cadastro:

```json
{
  "name": "Joao Silva",
  "email": "joao@email.com",
  "password": "123456"
}
```

Exemplo de login:

```json
{
  "email": "joao@email.com",
  "password": "123456"
}
```

### Categorias

| Metodo | Endpoint | Auth | Descricao |
| --- | --- | --- | --- |
| GET | `/categories` | Sim | Lista categorias padrao e categorias do usuario |
| POST | `/categories` | Sim | Cria categoria customizada |
| PUT | `/categories/:id` | Sim | Atualiza categoria customizada |
| DELETE | `/categories/:id` | Sim | Exclui categoria customizada |

Exemplo de categoria:

```json
{
  "name": "health",
  "displayName": "Saude",
  "icon": "favorite",
  "background": "#b3261e",
  "isIncome": false
}
```

Categorias padrao sao compartilhadas entre usuarios e nao podem ser editadas/excluidas pelo app.

### Transacoes

| Metodo | Endpoint | Auth | Descricao |
| --- | --- | --- | --- |
| GET | `/transactions` | Sim | Lista transacoes do usuario |
| GET | `/transactions?month=5&year=2026` | Sim | Lista transacoes por mes/ano |
| POST | `/transactions` | Sim | Cria transacao |
| PUT | `/transactions/:id` | Sim | Atualiza transacao |
| DELETE | `/transactions/:id` | Sim | Exclui transacao |

Exemplo de transacao:

```json
{
  "description": "Salario de maio",
  "value": 3500.5,
  "date": "2026-05-29",
  "categoryId": "ID_DA_CATEGORIA"
}
```

## Tabelas do banco

O schema fica em `backend/prisma/schema.prisma`.

### User

| Campo | Tipo | Observacao |
| --- | --- | --- |
| `id` | `String` | UUID |
| `name` | `String` | Nome do usuario |
| `email` | `String` | Unico |
| `passwordHash` | `String` | Senha criptografada |
| `createdAt` | `DateTime` | Criado em |
| `updatedAt` | `DateTime` | Atualizado em |

### Category

| Campo | Tipo | Observacao |
| --- | --- | --- |
| `id` | `String` | UUID |
| `name` | `String` | Nome interno |
| `displayName` | `String` | Nome exibido |
| `icon` | `String` | Nome do icone Material Icons |
| `background` | `String` | Cor usada no app |
| `isIncome` | `Boolean` | Receita ou despesa |
| `isDefault` | `Boolean` | Categoria padrao do sistema |
| `userId` | `String?` | Dono da categoria customizada |

### Transaction

| Campo | Tipo | Observacao |
| --- | --- | --- |
| `id` | `String` | UUID |
| `description` | `String` | Descricao do lancamento |
| `value` | `Decimal(12,2)` | Valor financeiro |
| `date` | `DateTime` | Data do lancamento |
| `userId` | `String` | Dono da transacao |
| `categoryId` | `String` | Categoria vinculada |

## Postman

A collection esta em:

```text
backend/postman/collection.json
```

Para importar:

1. Abra o Postman.
2. Clique em `Import`.
3. Selecione `backend/postman/collection.json`.
4. Confirme a importacao.

Fluxo sugerido:

1. Inicie a API com `npm run dev`.
2. Rode `Health Check`.
3. Rode `Auth - Register`.
4. Rode `Auth - Login`.
5. Copie o `token` retornado.
6. Atualize a variavel `token` da collection.
7. Rode `Categories - List`.
8. Copie um `categoryId`.
9. Teste as rotas de transacoes.
10. Teste as rotas de categorias customizadas.

Referencia: https://learning.postman.com/docs/getting-started/importing-and-exporting/importing-data/

## Observacoes importantes

- O sistema suporta multiplos usuarios no mesmo banco.
- Transacoes pertencem apenas ao usuario autenticado.
- Categorias customizadas pertencem apenas ao usuario autenticado.
- Categorias padrao aparecem para todos os usuarios.
- Categorias padrao nao podem ser excluidas.
- Categorias customizadas com transacoes vinculadas nao podem ser excluidas.
- Erros de validacao retornam no formato:

```json
{
  "error": "Dados invalidos",
  "details": []
}
```

## Comandos uteis

Na raiz do projeto:

| Comando | Descricao |
| --- | --- |
| `npm run install:all` | Instala backend e frontend |
| `npm run dev` | Inicia o backend |
| `npm run start` | Inicia o frontend Expo |
| `npm run prisma:migrate` | Executa migration Prisma |
| `npm run prisma:seed` | Executa seed de categorias padrao |
