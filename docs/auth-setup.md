# Configuração do login (Supabase Auth)

O login usa e-mail e senha do Supabase. Sem estas configurações, o cadastro e a recuperação de senha não funcionam.

1. **Tabelas e segurança:** se já criou as tabelas antigas, rode antes, uma única vez, `drop table if exists flashcards; drop table if exists decks;`. Depois rode [`supabase-schema.sql`](supabase-schema.sql) no SQL Editor (esse pode ser repetido sem perder dados).
2. **Variáveis** (Vercel e `.env.local`): `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` (chave pública, nunca a `service_role`).
3. **Authentication → URL Configuration:**
   - *Site URL:* a URL da Vercel (ex: `https://zarkdroid.vercel.app`)
   - *Redirect URLs:* `https://SEU-DOMINIO/reset-password`, `https://SEU-DOMINIO/login` e `http://localhost:3004/**`
4. **Authentication → Providers → Email:** mantenha "Confirm email" ligado. Em "Password", defina o mínimo de 8 caracteres.
5. **E-mails com Resend:** o envio padrão do Supabase é limitado a poucos e-mails por hora.
   - No Resend: **Domains → Add Domain**, adicione os registros DNS (SPF/DKIM) e espere ficar *Verified*. Depois crie uma **API Key** (permissão de envio).
   - No Supabase: **Authentication → Emails → SMTP Settings → Enable custom SMTP**:
     host `smtp.resend.com` · porta `465` · usuário `resend` · senha = a API Key · remetente = um endereço do domínio verificado (ex: `no-reply@seudominio.com`).
   - Traduza os templates em **Authentication → Email Templates** (Confirm signup e Reset password).
6. **Login obrigatório:** o app inteiro exige conta (exceto login, cadastro, recuperação de senha, `/privacy` e `/download`). Ao entrar, os baralhos da nuvem substituem os locais; se a conta for nova, os baralhos de exemplo são enviados. Ao sair, os dados locais do aparelho são apagados.
