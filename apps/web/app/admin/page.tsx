"use client";

import { useEffect, useState } from "react";
import { Activity, AlertTriangle, Ban, CheckCircle2, Database, LoaderCircle, Search, ShieldCheck, Users } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { apiFetch, ApiError } from "@/lib/api";
import type { RiskLevel, User } from "@/lib/types";
import { useSession } from "@/hooks/use-session";

type AdminUser = User & { status: "ACTIVE" | "BLOCKED"; createdAt: string; _count: { analyses: number } };
type RecentAnalysis = { id: string; symptoms: string; specialist: string; riskLevel: RiskLevel; createdAt: string; user: { name: string; email: string } };
type Overview = { stats: { users: number; activeClients: number; analyses: number; byRisk: Partial<Record<RiskLevel, number>> }; recent: RecentAnalysis[] };

export default function AdminPage() {
  const { user, loading: sessionLoading } = useSession({ admin: true });
  const [overview, setOverview] = useState<Overview | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      const [overviewData, usersData] = await Promise.all([
        apiFetch<Overview>("/admin/overview"),
        apiFetch<{ users: AdminUser[] }>("/admin/users"),
      ]);
      setOverview(overviewData);
      setUsers(usersData.users);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Не удалось загрузить данные");
    }
  }

  useEffect(() => { if (user) void load(); }, [user]);

  async function changeStatus(target: AdminUser) {
    const status = target.status === "ACTIVE" ? "BLOCKED" : "ACTIVE";
    try {
      await apiFetch(`/admin/users/${target.id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
      setUsers((current) => current.map((item) => item.id === target.id ? { ...item, status } : item));
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Не удалось изменить статус");
    }
  }

  const filteredUsers = users.filter((item) => `${item.name} ${item.email}`.toLowerCase().includes(query.toLowerCase()));

  if (sessionLoading || !user || !overview) return <div className="page-loader"><LoaderCircle className="spin" /><span>Собираем административную сводку…</span></div>;

  return (
    <div className="app-page">
      <AppHeader user={user} />
      <main className="app-main admin-main">
        <div className="page-title-row admin-title"><div><span className="page-kicker"><ShieldCheck size={15} /> Панель администратора</span><h1>Состояние системы</h1><p>Пользователи, анализы и распределение приоритетов.</p></div><span className="system-online"><i /> API и база данных активны</span></div>
        {error && <div className="form-error"><AlertTriangle size={17} /> {error}</div>}

        <section className="admin-stats">
          <article><span className="stat-icon blue"><Users /></span><div><small>Пользователи</small><strong>{overview.stats.users}</strong><em>{overview.stats.activeClients} активных клиентов</em></div></article>
          <article><span className="stat-icon teal"><Database /></span><div><small>Анализы</small><strong>{overview.stats.analyses}</strong><em>сохранено в PostgreSQL</em></div></article>
          <article><span className="stat-icon amber"><AlertTriangle /></span><div><small>Срочные</small><strong>{overview.stats.byRisk.URGENT ?? 0}</strong><em>требуют внимания</em></div></article>
          <article><span className="stat-icon coral"><Activity /></span><div><small>Экстренные</small><strong>{overview.stats.byRisk.EMERGENCY ?? 0}</strong><em>с красными флагами</em></div></article>
        </section>

        <section className="admin-grid">
          <div className="panel users-panel">
            <div className="section-row"><div><span>Управление доступом</span><h2>Пользователи</h2></div><label className="search-field"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск…" /></label></div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Пользователь</th><th>Роль</th><th>Анализы</th><th>Статус</th><th><span className="sr-only">Действия</span></th></tr></thead>
                <tbody>
                  {filteredUsers.map((item) => (
                    <tr key={item.id}>
                      <td><div className="table-user"><span>{item.name[0]?.toUpperCase()}</span><div><strong>{item.name}</strong><small>{item.email}</small></div></div></td>
                      <td><span className="role-badge">{item.role === "ADMIN" ? "Администратор" : "Клиент"}</span></td>
                      <td>{item._count.analyses}</td>
                      <td><span className={`status-badge ${item.status.toLowerCase()}`}><i /> {item.status === "ACTIVE" ? "Активен" : "Заблокирован"}</span></td>
                      <td><button className="table-action" disabled={item.id === user.id} onClick={() => changeStatus(item)} title={item.status === "ACTIVE" ? "Заблокировать" : "Разблокировать"}>{item.status === "ACTIVE" ? <Ban size={16} /> : <CheckCircle2 size={16} />}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="panel recent-admin">
            <div className="section-row"><div><span>В реальном времени</span><h2>Последние анализы</h2></div></div>
            <div className="recent-admin-list">
              {overview.recent.map((item) => (
                <article key={item.id}><span className={`history-mark ${item.riskLevel.toLowerCase()}`}><Activity size={16} /></span><div><div><strong>{item.user.name}</strong><span className={`risk-badge ${item.riskLevel.toLowerCase()}`}>{item.riskLevel === "PLANNED" ? "Планово" : item.riskLevel === "URGENT" ? "Срочно" : "Экстренно"}</span></div><p>{item.symptoms}</p><small>{item.specialist} · {new Date(item.createdAt).toLocaleDateString("ru-RU")}</small></div></article>
              ))}
              {overview.recent.length === 0 && <div className="mini-empty">Анализов пока нет</div>}
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
