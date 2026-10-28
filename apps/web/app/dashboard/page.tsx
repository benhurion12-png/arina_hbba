"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Activity, ArrowRight, CalendarDays, ClipboardPlus, Clock3, HeartPulse, LoaderCircle, ShieldCheck, Stethoscope } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { apiFetch } from "@/lib/api";
import type { Analysis } from "@/lib/types";
import { useSession } from "@/hooks/use-session";

const riskLabels = { PLANNED: "Планово", URGENT: "Срочно", EMERGENCY: "Экстренно" };

export default function DashboardPage() {
  const { user, loading: sessionLoading } = useSession();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    apiFetch<{ analyses: Analysis[] }>("/analyses")
      .then((payload) => setAnalyses(payload.analyses))
      .finally(() => setLoading(false));
  }, [user]);

  const planned = useMemo(() => analyses.filter((item) => item.riskLevel === "PLANNED").length, [analyses]);
  const last = analyses[0];

  if (sessionLoading || !user) return <div className="page-loader"><LoaderCircle className="spin" /><span>Загружаем ваши данные…</span></div>;

  return (
    <div className="app-page">
      <AppHeader user={user} />
      <main className="app-main dashboard-main">
        <section className="welcome-row">
          <div><span className="page-kicker"><HeartPulse size={15} /> Личный кабинет</span><h1>Здравствуйте, {user.name.split(" ")[0]}</h1><p>Здесь хранится история первичных анализов и рекомендации системы.</p></div>
          <Link href="/assessment" className="button primary"><ClipboardPlus size={18} /> Новый анализ</Link>
        </section>

        <section className="dashboard-stats">
          <article><span className="stat-icon teal"><Activity /></span><div><small>Всего анализов</small><strong>{analyses.length}</strong><em>за всё время</em></div></article>
          <article><span className="stat-icon blue"><ShieldCheck /></span><div><small>Плановый приоритет</small><strong>{planned}</strong><em>без красных флагов</em></div></article>
          <article><span className="stat-icon violet"><CalendarDays /></span><div><small>Последняя проверка</small><strong className="date-stat">{last ? new Date(last.createdAt).toLocaleDateString("ru-RU", { day: "numeric", month: "short" }) : "—"}</strong><em>{last ? new Date(last.createdAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }) : "пока нет данных"}</em></div></article>
        </section>

        <section className="dashboard-columns">
          <div className="panel history-panel">
            <div className="section-row"><div><span>Ваша динамика</span><h2>Последние анализы</h2></div>{analyses.length > 0 && <small>{analyses.length} записей</small>}</div>
            {loading ? (
              <div className="inline-loader"><LoaderCircle className="spin" /> Загружаем историю…</div>
            ) : analyses.length === 0 ? (
              <div className="empty-state"><span><Stethoscope /></span><h3>История пока пуста</h3><p>Первый анализ займёт несколько минут и сохранится здесь.</p><Link href="/assessment" className="button secondary">Начать <ArrowRight size={17} /></Link></div>
            ) : (
              <div className="history-list">
                {analyses.slice(0, 8).map((analysis) => (
                  <article key={analysis.id}>
                    <span className={`history-mark ${analysis.riskLevel.toLowerCase()}`}><Activity size={18} /></span>
                    <div className="history-copy"><div><strong>{analysis.result.selectedZoneLabels.join(", ")}</strong><span className={`risk-badge ${analysis.riskLevel.toLowerCase()}`}>{riskLabels[analysis.riskLevel]}</span></div><p>{analysis.symptoms}</p><small><Clock3 size={13} /> {new Date(analysis.createdAt).toLocaleString("ru-RU", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })} · {analysis.specialist}</small></div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <aside className="dashboard-aside">
            <div className="panel next-step-card">
              <span className="aside-icon"><Stethoscope /></span>
              <span className="page-kicker">Следующий шаг</span>
              <h2>{last ? last.specialist : "Начните с оценки"}</h2>
              <p>{last ? last.urgency : "Отметьте зону дискомфорта и опишите симптомы, чтобы получить маршрут."}</p>
              <Link href="/assessment">Провести новый анализ <ArrowRight size={16} /></Link>
            </div>
            <div className="safety-card"><ShieldCheck /><div><strong>Ваши данные защищены</strong><p>История доступна только вам и авторизованным администраторам системы.</p></div></div>
          </aside>
        </section>
      </main>
    </div>
  );
}
