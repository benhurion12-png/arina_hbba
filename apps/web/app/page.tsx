import Link from "next/link";
import { ArrowRight, CheckCircle2, LockKeyhole, ScanLine, ShieldCheck, Sparkles, Stethoscope } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

export default function HomePage() {
  return (
    <main className="landing">
      <header className="landing-header shell">
        <Logo />
        <div className="landing-actions">
          <ThemeToggle />
          <Link href="/login" className="button ghost small">Войти</Link>
          <Link href="/register" className="button primary small">Начать</Link>
        </div>
      </header>

      <section className="hero shell">
        <div className="hero-copy">
          <div className="eyebrow"><Sparkles size={15} /> Экспертная система первичного триажа</div>
          <h1>Понятный маршрут к нужному <em>специалисту</em></h1>
          <p>Отметьте область дискомфорта на интерактивной карте, опишите симптомы — HBBA оценит срочность и сформирует понятный план следующих шагов.</p>
          <div className="hero-actions">
            <Link href="/register" className="button primary large">Провести анализ <ArrowRight size={19} /></Link>
            <Link href="#how" className="button secondary large">Как это работает</Link>
          </div>
          <div className="trust-row">
            <span><ShieldCheck size={17} /> Данные под контролем</span>
            <span><CheckCircle2 size={17} /> Результат за несколько минут</span>
          </div>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <div className="hero-glow" />
          <div className="hero-card main-card">
            <div className="mock-top"><span className="status-dot" /> Анализ симптомов <small>Шаг 1 из 3</small></div>
            <div className="mock-body">
              <svg viewBox="0 0 180 310">
                <circle cx="90" cy="38" r="25" />
                <path d="M74 65h32l18 21 18 75-18 5-13-53 2 75-11 92H78l-11-92 2-75-13 53-18-5 18-75Z" />
                <circle className="hotspot one" cx="91" cy="102" r="18" />
                <circle className="hotspot two" cx="79" cy="204" r="12" />
              </svg>
              <div className="mock-copy">
                <span>Выбрано 2 зоны</span>
                <strong>Грудная клетка</strong>
                <strong>Левое колено</strong>
                <button>Продолжить <ArrowRight size={14} /></button>
              </div>
            </div>
          </div>
          <div className="hero-card float-card risk-card">
            <span><ShieldCheck size={18} /></span>
            <div><small>Уровень риска</small><strong>Плановый</strong></div>
          </div>
          <div className="hero-card float-card doctor-card">
            <span><Stethoscope size={18} /></span>
            <div><small>Специалист</small><strong>Травматолог</strong></div>
          </div>
        </div>
      </section>

      <section className="home-strip">
        <div className="shell home-strip-inner">
          <div><strong>9</strong><span>зон тела</span></div>
          <div><strong>6</strong><span>красных флагов</span></div>
          <div><strong>24/7</strong><span>доступ к истории</span></div>
          <div><strong>2</strong><span>темы интерфейса</span></div>
        </div>
      </section>

      <section id="how" className="how-section shell">
        <div className="section-heading">
          <span>Как это работает</span>
          <h2>Три спокойных шага вместо поиска вслепую</h2>
          <p>Система структурирует жалобы и помогает подготовиться к очной консультации.</p>
        </div>
        <div className="feature-grid">
          <article><span className="feature-number">01</span><ScanLine /><h3>Покажите, где болит</h3><p>Выберите одну или несколько областей на адаптивной карте тела.</p></article>
          <article><span className="feature-number">02</span><Stethoscope /><h3>Опишите ощущения</h3><p>Добавьте характер боли, длительность, ограничения и медицинский файл.</p></article>
          <article><span className="feature-number">03</span><LockKeyhole /><h3>Получите маршрут</h3><p>Узнайте приоритет, профиль врача и безопасные следующие шаги.</p></article>
        </div>
        <div className="medical-note">
          <ShieldCheck size={22} />
          <p><strong>Важно:</strong> HBBA не ставит диагноз и не заменяет врача. При экстренных симптомах система рекомендует немедленно обратиться в скорую помощь.</p>
        </div>
      </section>
    </main>
  );
}
