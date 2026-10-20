# Zarkdroid

Flashcards com repetição espaçada (SM-2), inspirado no AnkiDroid. Next.js 15, TypeScript e Tailwind. Interface minimalista em preto e branco, com modo escuro automático.

Os dados ficam no `localStorage` (funciona offline). Sincronização opcional com Supabase.

## Rodar localmente

```bash
npm install
npm run dev   # http://localhost:3004
```

## Atalhos de estudo

`Espaço`/`Enter` mostra a resposta · `1` Errei · `2` Difícil · `3` Bom · `4` Fácil

## Supabase (opcional)

Configure em `/settings` ou via `.env.local` (veja `.env.local.example`). O SQL das tabelas está em `/settings`. Use apenas a chave pública (anon/publishable), nunca a `service_role`.

## Deploy na Vercel

1. Importe este repositório em [vercel.com/new](https://vercel.com/new).
2. (Opcional) Adicione `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Deploy.

## APK Android (`/download`)

O APK é um app [Capacitor](https://capacitorjs.com) que abre o site publicado. Ele é compilado pelo GitHub Actions ([`android-apk.yml`](.github/workflows/android-apk.yml)), sem precisar do Android Studio.

1. No GitHub: **Settings → Secrets and variables → Actions → Variables** e crie `ZARKDROID_URL` com a URL da Vercel (ex: `https://zarkdroid.vercel.app`).
2. Gere a release:
   ```bash
   git tag v1.0.0 && git push origin v1.0.0
   ```
   (ou rode o workflow manualmente na aba **Actions**).
3. O arquivo `zarkdroid.apk` fica na release e a página `/download` aponta para `releases/latest/download/zarkdroid.apk`.

Se o repositório não for `leonardozappamkt/zarkdroid`, defina `NEXT_PUBLIC_GITHUB_REPO` (`dono/repo`) na Vercel.
