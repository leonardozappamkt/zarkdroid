# E-mails do Supabase em português

No Supabase, vá em **Authentication → Emails → Templates**. Para cada modelo abaixo, preencha o **Subject** e cole o HTML em **Message body** (modo *Source*). As variáveis `{{ ... }}` são do Supabase e não devem ser alteradas.

## 1. Confirm signup

**Subject:** `Confirme seu e-mail no Zarkdroid`

```html
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;background:#ffffff;padding:40px 16px;">
  <div style="max-width:420px;margin:0 auto;color:#0a0a0a;">
    <div style="display:inline-block;width:32px;height:32px;line-height:32px;text-align:center;background:#0a0a0a;color:#ffffff;border-radius:8px;font-weight:700;font-family:Menlo,Consolas,monospace;">Z</div>
    <h1 style="font-size:24px;font-weight:600;letter-spacing:-0.02em;margin:24px 0 8px;">Confirme seu e-mail</h1>
    <p style="font-size:15px;line-height:1.6;color:#525252;margin:0 0 24px;">
      Obrigado por criar sua conta no Zarkdroid. Toque no botão abaixo para confirmar seu e-mail e começar a estudar.
    </p>
    <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#0a0a0a;color:#ffffff;text-decoration:none;font-size:15px;font-weight:500;padding:12px 24px;border-radius:999px;">Confirmar e-mail</a>
    <p style="font-size:13px;line-height:1.6;color:#737373;margin:32px 0 0;">
      Se o botão não funcionar, copie e cole este link no navegador:<br>
      <span style="word-break:break-all;">{{ .ConfirmationURL }}</span>
    </p>
    <p style="font-size:13px;color:#737373;margin:24px 0 0;">
      Se você não criou uma conta, ignore este e-mail.
    </p>
  </div>
</div>
```

## 2. Reset password

**Subject:** `Redefinir sua senha do Zarkdroid`

```html
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;background:#ffffff;padding:40px 16px;">
  <div style="max-width:420px;margin:0 auto;color:#0a0a0a;">
    <div style="display:inline-block;width:32px;height:32px;line-height:32px;text-align:center;background:#0a0a0a;color:#ffffff;border-radius:8px;font-weight:700;font-family:Menlo,Consolas,monospace;">Z</div>
    <h1 style="font-size:24px;font-weight:600;letter-spacing:-0.02em;margin:24px 0 8px;">Redefinir senha</h1>
    <p style="font-size:15px;line-height:1.6;color:#525252;margin:0 0 24px;">
      Recebemos um pedido para redefinir a senha da sua conta. Toque no botão abaixo para criar uma nova senha.
    </p>
    <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#0a0a0a;color:#ffffff;text-decoration:none;font-size:15px;font-weight:500;padding:12px 24px;border-radius:999px;">Criar nova senha</a>
    <p style="font-size:13px;line-height:1.6;color:#737373;margin:32px 0 0;">
      Se o botão não funcionar, copie e cole este link no navegador:<br>
      <span style="word-break:break-all;">{{ .ConfirmationURL }}</span>
    </p>
    <p style="font-size:13px;color:#737373;margin:24px 0 0;">
      Se você não pediu isso, ignore este e-mail. Sua senha continua a mesma.
    </p>
  </div>
</div>
```

## Opcional

- **Change email address** (`Confirme seu novo e-mail`) e **Reauthentication** só importam se você adicionar essas funções ao app. Hoje não existem.
- **Remetente:** em *SMTP Settings*, o campo *Sender name* pode ser `Zarkdroid`.
- Teste cada e-mail criando uma conta e usando "Esqueci a senha". Confira no Gmail do celular e no modo escuro.
