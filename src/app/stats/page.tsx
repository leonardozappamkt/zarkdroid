'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { storage } from '@/lib/storage';
import { computeStats, HEATMAP_WEEKS, type Stats } from '@/lib/stats';

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="bg-paper p-5">
      <p className="text-xs uppercase tracking-wider text-mute">{label}</p>
      <p className="mt-2 font-mono text-3xl font-semibold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-mute">{hint}</p>}
    </div>
  );
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    setStats(computeStats(storage.getCards(), storage.getReviewLogs()));
  }, []);

  if (!stats) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-mute">Carregando…</div>;
  }

  const maxDay = Math.max(1, ...stats.heatmap.map((d) => d.count));
  const level = (count: number) => (count === 0 ? 0 : Math.min(4, Math.ceil((count / maxDay) * 4)));
  const shade = ['bg-soft', 'bg-ink/20', 'bg-ink/40', 'bg-ink/65', 'bg-ink'];
  const maxForecast = Math.max(1, ...stats.forecast);
  const cardsTotal = Math.max(1, stats.cards.total);
  const segments = [
    { label: 'Novos', value: stats.cards.new, tone: 'bg-line' },
    { label: 'Aprendendo', value: stats.cards.learning, tone: 'bg-ink/30' },
    { label: 'Jovens', value: stats.cards.young, tone: 'bg-ink/60' },
    { label: 'Maduros', value: stats.cards.mature, tone: 'bg-ink' },
  ];

  const columns = Array.from({ length: HEATMAP_WEEKS }, (_, w) => stats.heatmap.slice(w * 7, w * 7 + 7));

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="mx-auto w-full max-w-5xl flex-1 space-y-10 px-4 py-10 sm:px-6">
        <div className="space-y-4">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-mute hover:text-ink">
            <ArrowLeft className="h-4 w-4" />
            Baralhos
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight">Estatísticas</h1>
        </div>

        <section className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4">
          <Metric label="Hoje" value={String(stats.todayTotal)} hint={`${stats.todayNew} novos`} />
          <Metric
            label="Acertos hoje"
            value={stats.todayCorrectPct === null ? '—' : `${stats.todayCorrectPct}%`}
          />
          <Metric label="Sequência" value={`${stats.streak} d`} hint={`recorde ${stats.bestStreak} d`} />
          <Metric
            label="Retenção (30 dias)"
            value={stats.retention30 === null ? '—' : `${stats.retention30}%`}
            hint={stats.reviewed30 ? `${stats.reviewed30} revisões` : 'sem revisões ainda'}
          />
        </section>

        <section className="card space-y-4 p-6">
          <h2 className="text-lg font-semibold tracking-tight">Constância</h2>
          <div className="overflow-x-auto">
            <div className="flex gap-1">
              <div className="mr-1 flex flex-col gap-1 text-[10px] text-mute">
                {WEEKDAYS.map((d, i) => (
                  <span key={i} className="flex h-3.5 items-center">
                    {i % 2 === 1 ? d : ''}
                  </span>
                ))}
              </div>
              {columns.map((week, w) => (
                <div key={w} className="flex flex-col gap-1">
                  {week.map((day) => (
                    <div
                      key={day.key}
                      title={`${day.key}: ${day.count} revisões`}
                      className={`h-3.5 w-3.5 rounded-[3px] ${day.future ? 'opacity-0' : shade[level(day.count)]}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-mute">{stats.totalReviews} revisões no histórico.</p>
        </section>

        <section className="card space-y-4 p-6">
          <h2 className="text-lg font-semibold tracking-tight">Próximos 14 dias</h2>
          <div className="flex h-32 items-end gap-1.5">
            {stats.forecast.map((count, i) => (
              <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1">
                <span className="font-mono text-[10px] text-mute">{count || ''}</span>
                <div
                  className="w-full rounded-t bg-ink"
                  style={{ height: `${Math.max(count ? 4 : 0, (count / maxForecast) * 100)}%` }}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-1.5 text-[10px] text-mute">
            {stats.forecast.map((_, i) => (
              <span key={i} className="flex-1 text-center">
                {i === 0 ? 'hoje' : `+${i}`}
              </span>
            ))}
          </div>
        </section>

        <section className="card space-y-4 p-6">
          <h2 className="text-lg font-semibold tracking-tight">Seus cards</h2>
          <div className="flex h-3 overflow-hidden rounded-full bg-soft">
            {segments.map((s) => (
              <div key={s.label} className={s.tone} style={{ width: `${(s.value / cardsTotal) * 100}%` }} />
            ))}
          </div>
          <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-5">
            {segments.map((s) => (
              <div key={s.label} className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${s.tone}`} />
                <dt className="text-mute">{s.label}</dt>
                <dd className="ml-auto font-mono font-semibold tabular-nums sm:ml-1">{s.value}</dd>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <dt className="text-mute">Difíceis (leech)</dt>
              <dd className="ml-auto font-mono font-semibold tabular-nums sm:ml-1">{stats.cards.leeches}</dd>
            </div>
          </dl>
          <p className="text-xs text-mute">Maduros: intervalo de 21 dias ou mais.</p>
        </section>
      </main>
    </div>
  );
}
