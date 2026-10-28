import { Activity, CheckCircle2, HeartPulse, ShieldCheck } from "lucide-react";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <main className="auth-page">
      <div className="auth-panel visual-panel">
        <div className="auth-visual-top"><Logo /><ThemeToggle /></div>
        <div className="auth-visual-copy">
          <div className="eyebrow light"><Activity size={15} /> Технологии для осознанной заботы</div>
          <h2>Ваше тело говорит.<br />Мы помогаем <em>понять.</em></h2>
          <p>Структурируйте симптомы и получите понятный маршрут к профильному специалисту.</p>
          <ul>
            <li><CheckCircle2 /> История анализов в одном месте</li>
            <li><CheckCircle2 /> Учет опасных симптомов</li>
            <li><CheckCircle2 /> Медицински нейтральные рекомендации</li>
          </ul>
        </div>
        <div className="auth-orbit"><HeartPulse /></div>
      </div>
      <div className="auth-panel form-panel">
        <div className="mobile-auth-top"><Logo /><ThemeToggle /></div>
        <div className="auth-card">
          <div className="auth-icon"><ShieldCheck /></div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
          {children}
          <small className="auth-disclaimer">Продолжая, вы соглашаетесь с обработкой данных для работы сервиса.</small>
        </div>
      </div>
    </main>
  );
}
