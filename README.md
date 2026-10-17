# 🚀 Zarkdroid — SaaS de Flashcards & Repetição Espaçada (SRS)

Inspirado no **Anki / AnkiDroid**, o **Zarkdroid** é uma plataforma SaaS moderna desenvolvida em **Next.js (App Router)**, **TypeScript** e **Tailwind CSS**, projetada com algoritmo de repetição espaçada (SM-2) para maximizar a retenção e retenção de memória a longo prazo.

---

## 📌 Porta Fixa: `localhost:3004`

O projeto já está configurado no `package.json` para rodar obrigatoriamente na porta **3004**:

```bash
# Iniciar em modo de desenvolvimento (sempre na porta 3004)
npm run dev

# Compilar para produção
npm run build

# Rodar servidor de produção (porta 3004)
npm start
```

Acesse no seu navegador: **[http://localhost:3004](http://localhost:3004)**

---

## ✨ Funcionalidades Principais

- 🧠 **Algoritmo SM-2 / Anki SRS**:
  - **Errei** (1 min): Reinicia o ciclo e reapresenta o card na mesma sessão.
  - **Difícil** (12h / multiplicador 1.2x): Ajusta o fator de facilidade e agenda a revisão.
  - **Bom** (1 dia / 3 dias / cálculo SRS): Progressão equilibrada.
  - **Fácil** (4 dias / cálculo acelerado): Aumenta o fator de facilidade para longo prazo.
- ⌨️ **Atalhos de Teclado**:
  - `Espaço` ou `Enter`: Mostra a resposta do card ou seleciona "Bom".
  - `1`: Errei | `2`: Difícil | `3`: Bom | `4`: Fácil.
- 🗂️ **Gestão Completa de Baralhos & Cards**:
  - Criação rápida de baralhos coloridos.
  - Adição de novos flashcards com frente, verso, notas extras e tags.
  - Filtros em tempo real por título e conteúdo.
- 📊 **Contadores Visuais Padrão AnkiDroid**:
  - 🔵 **Azul**: Cards novos
  - 🟠 **Laranja**: Cards em aprendizado
  - 🟢 **Verde**: Cards agendados para revisar hoje
- 💾 **Persistência Híbrida**:
  - Funciona 100% offline imediatamente com armazenamento local.
  - Suporte completo para sincronização em nuvem via **Supabase**.
- 📦 **Backup & Restauração**:
  - Exportação e importação de baralhos em formato JSON.

---

## 🗄️ Integração com Supabase

No arquivo `.env.local` (ou na página `/settings`), configure suas credenciais:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-publica
```

### Schema SQL Recomendado

Execute no **SQL Editor** do Supabase:

```sql
create table decks (
  id text primary key,
  title text not null,
  description text,
  color text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table flashcards (
  id text primary key,
  deck_id text references decks(id) on delete cascade,
  front text not null,
  back text not null,
  extra text,
  tags text[],
  state text default 'new',
  repetitions integer default 0,
  interval integer default 0,
  ease_factor numeric default 2.5,
  due_date timestamp with time zone default timezone('utc'::text, now()),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

---

## ☁️ Deploy na Vercel

1. Suba este repositório para o seu GitHub.
2. No painel da [Vercel](https://vercel.com), clique em **Add New Project** e selecione o repositório.
3. Adicione as variáveis de ambiente `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Clique em **Deploy**!
