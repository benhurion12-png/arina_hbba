"use client";

import { AlertTriangle, CheckCircle2, Download, Lightbulb, ShieldAlert, Stethoscope, UserRoundSearch, XCircle } from "lucide-react";
import type { Analysis } from "@/lib/types";

const riskMeta = {
  PLANNED: { label: "Плановый приоритет", icon: CheckCircle2 },
  URGENT: { label: "Срочный приоритет", icon: AlertTriangle },
  EMERGENCY: { label: "Экстренный приоритет", icon: ShieldAlert },
} as const;

export function AnalysisResult({ analysis }: { analysis: Analysis }) {
  const result = analysis.result;
  const meta = riskMeta[result.riskLevel];
  const RiskIcon = meta.icon;

  function downloadReport() {
    const report = [
      "HBBA — ОТЧЕТ ПЕРВИЧНОГО ТРИАЖА",
      "==================================================",
      `Дата: ${new Date(analysis.createdAt).toLocaleString("ru-RU")}`,
      `Выбранные зоны: ${result.selectedZoneLabels.join(", ")}`,
      `Описание: ${analysis.symptoms}`,
      `Красные флаги: ${result.redFlagLabels.join(", ") || "Не отмечены"}`,
      "",
      `ПРИОРИТЕТ: ${result.urgency}`,
      `РЕКОМЕНДОВАННЫЙ СПЕЦИАЛИСТ: ${result.specialist}`,
      "",
      "КРАТКИЙ ИТОГ",
      result.summary,
      "",
      "НАБЛЮДЕНИЯ",
      ...result.insights.map((item) => `• ${item}`),
      "",
      "СЛЕДУЮЩИЕ ШАГИ",
      ...result.actions.map((item, index) => `${index + 1}. ${item}`),
      "",
      "ЧЕГО ИЗБЕГАТЬ",
      ...result.avoid.map((item) => `• ${item}`),
      "",
      result.disclaimer,
    ].join("\n");
    const url = URL.createObjectURL(new Blob([report], { type: "text/plain;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `HBBA-report-${analysis.id.slice(0, 8)}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className={`result-panel risk-${result.riskLevel.toLowerCase()}`} aria-live="polite">
      <div className="result-hero">
        <div className="result-risk-icon"><RiskIcon /></div>
        <div>
          <span className="result-kicker">Анализ завершён</span>
          <h2>{meta.label}</h2>
          <p>{result.summary}</p>
        </div>
        <button className="button secondary small" type="button" onClick={downloadReport}><Download size={17} /> Скачать отчёт</button>
      </div>

      <div className="result-summary-grid">
        <article><span><ShieldAlert size={19} /></span><small>Рекомендуемый приоритет</small><strong>{result.urgency}</strong></article>
        <article><span><Stethoscope size={19} /></span><small>Профиль специалиста</small><strong>{result.specialist}</strong></article>
        <article><span><UserRoundSearch size={19} /></span><small>Полнота описания</small><strong>{result.dataQuality}</strong></article>
      </div>

      <div className="result-content-grid">
        <article className="result-card">
          <h3><Lightbulb size={19} /> Что учтено системой</h3>
          <ul>{result.insights.map((item) => <li key={item}>{item}</li>)}</ul>
          <h4>Возможные влияющие факторы</h4>
          <ul className="muted-list">{result.possibleFactors.map((item) => <li key={item}>{item}</li>)}</ul>
        </article>
        <article className="result-card action-card">
          <h3><CheckCircle2 size={19} /> Что делать дальше</h3>
          <ol>{result.actions.map((item) => <li key={item}>{item}</li>)}</ol>
        </article>
        <article className="result-card avoid-card">
          <h3><XCircle size={19} /> Чего следует избегать</h3>
          <ul>{result.avoid.map((item) => <li key={item}>{item}</li>)}</ul>
        </article>
      </div>
      <div className="result-disclaimer"><ShieldAlert size={18} /><p>{result.disclaimer}</p></div>
    </section>
  );
}
