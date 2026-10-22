# Zarkdroid MCP (conectar o Claude)

Servidor MCP remoto em `https://zarkdroid.zarkio.com.br/api/mcp`. A pessoa entra com a conta Zarkdroid (OAuth) e o Claude passa a agir **como ela**: o Supabase aplica o RLS, então cada uma só alcança os próprios baralhos.

## O que o Claude pode fazer

| Ferramenta | O que faz |
|---|---|
| `list_decks` | Lista baralhos com contagem de novos, em aprendizado e a revisar |
| `list_cards` | Lista cards de um baralho (busca por texto, filtro por estado, paginação) |
| `get_due_cards` | Cards para estudar agora, na mesma ordem do app |
| `create_deck` | Cria um baralho |
| `create_cards` | Adiciona até 100 cards de uma vez |
| `update_deck` / `update_card` | Edita título, descrição, frente, verso, dica, tags |
| `review_card` | Registra a revisão (errei, difícil, bom, fácil) com o mesmo SM-2 do app |

**Não existe ferramenta de excluir**, e o banco também recusa: um token de app conectado traz o claim `client_id`, e as políticas `no delete via oauth` bloqueiam `DELETE` e a exclusão de conta para esses tokens.

## Configuração (uma vez)

1. **SQL:** rode [`supabase-schema.sql`](supabase-schema.sql) inteiro no SQL Editor (seguro repetir). Ele cria as políticas que impedem apps OAuth de excluir.
2. **Supabase → Authentication → OAuth Server:**
   - ligue **Enable OAuth Server**;
   - **Authorization Path:** `/oauth/consent` (a URL final é a *Site URL* + esse caminho);
   - ligue o **registro dinâmico de clientes** (Dynamic client registration). O Claude se registra sozinho, sem você criar um cliente à mão.
3. **Conferir:** abra `https://<ref>.supabase.co/.well-known/oauth-authorization-server/auth/v1`. Se aparecer um JSON (e não `OAuth server is disabled`), está ligado.
4. **Deploy** do app. Variável opcional `NEXT_PUBLIC_APP_URL` (padrão `https://zarkdroid.zarkio.com.br`), usada como identificador do recurso.

## Como a pessoa conecta

Claude → Configurações → Conectores → Adicionar conector personalizado → URL acima → entrar com a conta → **Permitir**.
A URL e a lista de apps conectados (com **Revogar**) também ficam em Configurações dentro do Zarkdroid.

## Segurança

- Só aceita tokens emitidos pelo servidor OAuth do Supabase (com `client_id`). Um token de login do navegador é recusado.
- O registro dinâmico deixa **qualquer app** pedir acesso, então a tela de consentimento mostra o nome do app e o domínio de retorno, e a pessoa decide caso a caso.
- Os escopos OAuth do Supabase (`openid`, `email`, `profile`) não limitam o banco. Quem limita é o RLS e as políticas `no delete via oauth`.
- Cada login por OAuth conta como usuário ativo mensal (MAU) no Supabase.

## Testar localmente

`npm run dev`, depois `npx @modelcontextprotocol/inspector@latest`, transporte **Streamable HTTP**, URL `http://localhost:3004/api/mcp`. Para o fluxo OAuth completo funcionar local, defina `NEXT_PUBLIC_APP_URL=http://localhost:3004` e adicione `http://localhost:3004/**` aos Redirect URLs do Supabase.

## Limitações conhecidas

- O app web só puxa a nuvem ao abrir ou recarregar a página. Cards criados pelo Claude aparecem depois de recarregar.
- Quem cria a conta pelo fluxo do Claude e precisa confirmar o e-mail volta ao login sem o pedido de autorização: é só conectar de novo no Claude.
