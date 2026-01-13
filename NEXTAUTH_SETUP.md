# Configuração do NextAuth

## Instalação

O NextAuth já foi instalado e configurado no projeto. As seguintes dependências foram adicionadas:

```bash
pnpm add next-auth @auth/prisma-adapter
```

## Configuração de Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```env
# NextAuth Configuration
NEXTAUTH_SECRET=your-secret-key-here-make-it-long-and-random
NEXTAUTH_URL=http://localhost:3000

# Database (já configurado)
DATABASE_URL="mysql://root:password@localhost:3306/crm_zeus"
```

### Gerando uma chave secreta

Para gerar uma chave secreta segura, você pode usar:

```bash
openssl rand -base64 32
```

Ou usar um gerador online de chaves seguras.

## O que foi implementado

### 1. Configuração do NextAuth

- Arquivo: `app/api/auth/[...nextauth]/route.ts`
- Configurado com CredentialsProvider
- Integração com o banco de dados existente (tabela Team)
- Suporte a senhas hasheadas com bcrypt e texto plano

### 2. Proteção de Rotas

- Middleware: `middleware.ts` - protege todas as rotas automaticamente
- Componente: `NextAuthProtectedRoute.tsx` - proteção adicional para componentes
- Layout do dashboard protegido

### 3. Componentes Atualizados

- `SessionProvider.tsx` - Provider do NextAuth
- `HeaderNav.tsx` - Usa NextAuth para logout e dados do usuário
- `AppSidebar.tsx` - Usa NextAuth para logout e permissões
- `login/page.tsx` - Página de login atualizada para NextAuth

### 4. Tipos TypeScript

- `types/next-auth.d.ts` - Extensão dos tipos do NextAuth

## Como funciona

1. **Autenticação**: O usuário faz login na página `/login`
2. **Sessão**: O NextAuth cria uma sessão JWT
3. **Proteção**: O middleware verifica se o usuário está autenticado
4. **Redirecionamento**: Usuários não autenticados são redirecionados para `/login`

## Estrutura de Dados

O NextAuth usa os dados da tabela `Team` existente:

- `id` - ID do usuário
- `name` - Nome do usuário
- `email` - Email (usado para login)
- `position` - Cargo/função (usado como role)
- `password` - Senha (suporte a bcrypt e texto plano)

## Comandos úteis

```bash
# Gerar tipos do Prisma
pnpm prisma generate

# Executar migrações
pnpm prisma migrate dev

# Iniciar servidor de desenvolvimento
pnpm dev
```

## Próximos passos

1. Configure as variáveis de ambiente
2. Teste o login com um usuário existente
3. Verifique se as permissões estão funcionando corretamente
4. Ajuste as configurações conforme necessário
