# Zarkdroid

Flashcards com repetição espaçada, feitos para estudar inglês (e qualquer outra matéria). Next.js 15, TypeScript, Tailwind e Supabase. Interface em preto e branco, com modo escuro automático.

## O que tem

**Estudo**
- Algoritmo **FSRS** (o mesmo do Anki moderno), com retenção desejada configurável.
- Limite diário de cards novos e de revisões, e "estudar mais" quando acabam.
- Modos: virar, **digitar a resposta**, **ouvir e digitar** (ditado) e **falar** (reconhecimento de voz), além de **inverter** frente e verso.
- Cards com **lacuna** (`{{c1::resposta}}`), Markdown, fórmulas (LaTeX), imagens e áudio.
- Pronúncia com a voz do aparelho (sem servidor, sem custo), desfazer, detecção de cards difíceis (leech).
- Estatísticas: sequência, retenção, calendário de constância e previsão de revisões.

**Conteúdo**
- **Biblioteca** de baralhos prontos (vocabulário, verbos irregulares, phrasal verbs, falsos cognatos, negócios, viagem).
- **Importar** do Anki (`.apkg`, formatos antigo e novo) e de CSV/TSV.

**Conta e plataformas**
- Login com e-mail e senha (Supabase), dados isolados por usuário (RLS) e sincronização na nuvem.
- Funciona offline depois da primeira visita (service worker).
- App Android (APK em `/download`) e servidor **MCP** para conectar a sua IA (veja [docs/mcp.md](docs/mcp.md)).

## Rodar localmente

```bash
npm install
npm run dev   # http://localhost:3004
```

Variáveis em `.env.local` (veja `.env.local.example`): `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` (chave pública, nunca a `service_role`).

## Banco de dados

Rode [docs/supabase-schema.sql](docs/supabase-schema.sql) inteiro no SQL Editor do Supabase. É seguro repetir. Ele cria as tabelas, as políticas de segurança, as colunas do FSRS, o histórico de revisões, a exclusão de conta e o bucket de imagens. Configuração do login e dos e-mails: [docs/auth-setup.md](docs/auth-setup.md).

## Publicação

- **Site:** importe o repositório na Vercel e defina as variáveis acima.
- **APK Android:** o workflow `android-apk.yml` compila e publica na Release. Veja [docs/store-checklist.md](docs/store-checklist.md) para as lojas.

## Atalhos de estudo

`Espaço`/`Enter` mostra a resposta ou confirma · `1` Errei · `2` Difícil · `3` Bom · `4` Fácil · `Z` desfaz
