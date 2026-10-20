# Checklist de publicação — Play Store e App Store

## Antes de tudo
- [ ] D-U-N-S ativo (necessário para conta de organização na Apple e, dependendo do caso, na Google)
- [ ] Conta Apple Developer (US$ 99/ano) e Google Play Console (US$ 25, pagamento único)
- [ ] Nome do app, ícone 1024×1024 e identificador (`app.zarkdroid.flashcards`) definidos
- [ ] Política de privacidade publicada em URL pública: `/privacy` (trocar o e-mail de contato)
- [ ] E-mail de suporte e URL de suporte

## Trabalho técnico (nós fazemos)
- [ ] Empacotar o app com o conteúdo embutido (Capacitor com export estático), não apenas abrindo a URL. A Apple rejeita apps que são só um site (guideline 4.2)
- [ ] Trocar as rotas dinâmicas `/deck/[id]` e `/study/[id]` por rotas com query string, para permitir `output: 'export'`
- [ ] Funcionar 100% offline
- [ ] Android: gerar AAB assinado (keystore guardada em local seguro, com backup; perder a chave impede atualizações)
- [ ] iOS: build no Xcode (precisa de Mac), certificados e provisioning profile
- [ ] Testar em aparelhos reais, incluindo telas pequenas e modo escuro

## Material das lojas
- [ ] Descrição curta (80 caracteres no Google) e descrição longa
- [ ] Capturas de tela: celular (mín. 2 no Google; iPhone 6,9" e 6,5" na Apple); tablet se suportar
- [ ] Imagem de destaque 1024×500 (Google)
- [ ] Categoria: Educação
- [ ] Classificação etária (questionário nas duas lojas)

## Declarações de privacidade (com login e sincronização)
- **Google, Data safety:** coleta e-mail (gerenciamento de conta) e conteúdo do usuário (baralhos); criptografado em trânsito; sem compartilhamento com terceiros; informar o caminho para o usuário pedir exclusão de conta e dados (obrigatório).
- **Apple, App Privacy:** Contact Info (e-mail) e User Content, vinculados à identidade, não usados para rastreamento.
- Excluir conta dentro do app é obrigatório na Apple para apps que permitem criar conta (guideline 5.1.1(v)). **Falta implementar.**

## Regras específicas
- **Google:** contas pessoais novas precisam de teste fechado com 12+ testadores por 14 dias antes de publicar em produção. Contas de organização não têm essa exigência.
- **Apple:** o app precisa de funcionalidade própria além de um site embutido; informar uma conta demo só é necessário se houver login.
- Login: Supabase Auth já integrado; aplicar `docs/supabase-schema.sql` (RLS por `user_id`) e configurar as URLs de redirecionamento (veja `docs/auth-setup.md`).
