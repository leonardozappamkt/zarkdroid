import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Política de Privacidade — Zarkdroid',
  description: 'Como o Zarkdroid trata os seus dados.',
};

// TODO: substituir pelo e-mail de contato definitivo antes de enviar às lojas.
const CONTACT_EMAIL = 'contato@exemplo.com';
const UPDATED_AT = '20 de outubro de 2026';

const SECTIONS = [
  {
    title: 'Resumo',
    body: [
      'Para usar o Zarkdroid você cria uma conta. Guardamos o seu e-mail e os seus baralhos para que eles fiquem disponíveis em qualquer dispositivo.',
    ],
  },
  {
    title: 'Dados que armazenamos',
    body: [
      'Armazenamos seu e-mail, uma senha protegida por criptografia (nunca em texto puro) e seus baralhos, flashcards e progresso de estudo (datas de revisão e intervalos). Esses dados ficam hospedados no Supabase e só podem ser acessados por você. Uma cópia fica salva no seu aparelho para o app funcionar mesmo sem internet.',
    ],
  },
  {
    title: 'Dados que não coletamos',
    body: [
      'Não coletamos nome, telefone, localização, contatos, identificadores de publicidade nem dados de uso. Não usamos anúncios, não vendemos nem compartilhamos seus dados e não usamos ferramentas de rastreamento de terceiros.',
    ],
  },
  {
    title: 'Backup e exclusão',
    body: [
      'Você pode exportar seus dados em JSON na tela de Configurações. Ao sair da conta, a cópia local é apagada do aparelho. Para excluir sua conta e os dados na nuvem, escreva para o e-mail de contato abaixo.',
    ],
  },
  {
    title: 'Hospedagem',
    body: [
      'O site é hospedado na Vercel e a autenticação e o banco de dados usam o Supabase. Esses provedores podem registrar dados técnicos de acesso (como endereço IP) para operar o serviço, conforme as suas próprias políticas.',
    ],
  },
  {
    title: 'Crianças',
    body: ['O Zarkdroid não é direcionado a menores de 13 anos e não coleta intencionalmente dados deles.'],
  },
  {
    title: 'Mudanças nesta política',
    body: ['Se o app passar a coletar novos tipos de dados, esta página será atualizada antes disso.'],
  },
];

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="mx-auto w-full max-w-2xl flex-1 space-y-10 px-4 py-10 sm:px-6 sm:py-14">
        <div className="space-y-4">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-mute hover:text-ink">
            <ArrowLeft className="h-4 w-4" />
            Baralhos
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Política de Privacidade</h1>
          <p className="font-mono text-xs text-mute">Atualizada em {UPDATED_AT}</p>
        </div>

        {SECTIONS.map((s) => (
          <section key={s.title} className="space-y-2">
            <h2 className="text-lg font-semibold tracking-tight">{s.title}</h2>
            {s.body.map((p) => (
              <p key={p} className="text-sm leading-relaxed text-mute">
                {p}
              </p>
            ))}
          </section>
        ))}

        <section className="space-y-2">
          <h2 className="text-lg font-semibold tracking-tight">Contato</h2>
          <p className="text-sm text-mute">
            Dúvidas sobre privacidade:{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-ink underline">
              {CONTACT_EMAIL}
            </a>
          </p>
        </section>
      </main>
    </div>
  );
}
