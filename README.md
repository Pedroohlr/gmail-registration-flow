# auth4

Sistema de login e cadastro de usuários com fluxo em etapas (no estilo do cadastro do Google), página "Minha conta" e painel de administração de usuários.

- **Node.js 24 + Express 5**, sem dependências nativas
- **SQLite** embutido do Node (`node:sqlite`): o banco é um arquivo em `DATA_DIR/auth4.db`
- Senhas com **scrypt**, sessões em cookie `httpOnly` com o token guardado como hash no banco
- Frontend em HTML/CSS/JS puro, com tema claro e escuro e layout responsivo

## Rodando localmente

```bash
npm install
npm run dev        # http://localhost:3000
```

O **primeiro usuário cadastrado vira administrador** e pode gerenciar os outros em *Minha conta → Usuários*.

## Variáveis de ambiente

| Variável       | Padrão       | Descrição                                          |
|----------------|--------------|----------------------------------------------------|
| `PORT`         | `3000`       | Porta HTTP                                         |
| `DATA_DIR`     | `./data`     | Pasta do banco SQLite (`/app/data` no Docker)      |
| `EMAIL_DOMAIN` | `auth4.app`  | Domínio mostrado nos endereços (`usuario@auth4.app`) |

## Deploy no Easypanel

1. Crie um serviço **App** apontando para este repositório (build por **Dockerfile**).
2. Em **Mounts**, adicione um **Volume** com *Mount Path* `/app/data`. **Sem esse volume o banco é apagado a cada deploy.**
3. Em **Domains**, aponte o domínio para a porta `3000` e ative HTTPS.
4. Faça o deploy e crie sua conta logo em seguida: a primeira conta vira a de administrador.

## Rotas

| Página      | Descrição                                  |
|-------------|--------------------------------------------|
| `/login`    | Login em 2 etapas (usuário → senha)        |
| `/cadastro` | Criação de conta em 8 etapas               |
| `/conta`    | Minha conta (dados, segurança, usuários)   |

API em `/api` (`/auth/*`, `/signup/*`, `/me/*`, `/admin/users/*`), healthcheck em `/api/health`.
