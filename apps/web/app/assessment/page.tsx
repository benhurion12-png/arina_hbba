"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { AlertTriangle, Check, ChevronRight, FileText, LoaderCircle, Paperclip, ShieldAlert, Sparkles, UploadCloud, X } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { AnalysisResult } from "@/components/analysis-result";
import { BodyMap, BODY_ZONES, type BodyZoneId } from "@/components/body-map";
import { apiFetch, ApiError } from "@/lib/api";
import type { Analysis } from "@/lib/types";
import { useSession } from "@/hooks/use-session";

const RED_FLAGS = [
  { id: "limb_weakness", label: "Онемение или нарастающая слабость в конечностях" },
  { id: "dizziness_nausea", label: "Сильное головокружение, тошнота или потемнение в глазах" },
  { id: "acute_breathing", label: "Резкая боль при вдохе, выдохе или нагрузке" },
  { id: "chest_pressure", label: "Давящая боль за грудиной или нехватка воздуха" },
  { id: "face_asymmetry", label: "Внезапная асимметрия лица или нарушение речи" },
  { id: "loss_consciousness", label: "Потеря сознания или спутанность" },
] as const;

export default function AssessmentPage() {
  const { user, loading: sessionLoading } = useSession();
  const [view, setView] = useState<"front" | "back">("front");
  const [zones, setZones] = useState<BodyZoneId[]>(["head"]);
  const [symptoms, setSymptoms] = useState("");
  const [redFlags, setRedFlags] = useState<string[]>([]);
  const [attachmentText, setAttachmentText] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileLoading, setFileLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  function toggleZone(zone: BodyZoneId) {
    setZones((current) => current.includes(zone) ? current.filter((item) => item !== zone) : [...current, zone]);
  }

  function toggleFlag(flag: string) {
    setRedFlags((current) => current.includes(flag) ? current.filter((item) => item !== flag) : [...current, flag]);
  }

  async function uploadFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileLoading(true);
    setError("");
    const body = new FormData();
    body.append("file", file);
    try {
      const payload = await apiFetch<{ filename: string; text: string; truncated: boolean }>("/files/extract", { method: "POST", body });
      setFileName(payload.filename);
      setAttachmentText(payload.text);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Не удалось прочитать файл");
    } finally {
      setFileLoading(false);
      event.target.value = "";
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    setAnalysis(null);
    try {
      const payload = await apiFetch<{ analysis: Analysis }>("/analyses", {
        method: "POST",
        body: JSON.stringify({ zones, symptoms, redFlags, attachmentText: attachmentText || undefined }),
      });
      setAnalysis(payload.analysis);
      window.setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 422) {
        const details = caught.details as { selected?: string[]; mentioned?: string[] } | undefined;
        setError(`${caught.message}. На карте: ${details?.selected?.join(", ")}; в описании: ${details?.mentioned?.join(", ")}.`);
      } else {
        setError(caught instanceof ApiError ? caught.message : "Анализ не выполнен. Попробуйте ещё раз.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (sessionLoading || !user) return <div className="page-loader"><LoaderCircle className="spin" /><span>Открываем рабочее пространство…</span></div>;

  return (
    <div className="app-page">
      <AppHeader user={user} />
      <main className="app-main assessment-main">
        <div className="page-title-row">
          <div><span className="page-kicker"><Sparkles size={15} /> Новый анализ</span><h1>Где вы чувствуете дискомфорт?</h1><p>Отметьте области на карте и подробно опишите ощущения.</p></div>
          <div className="progress-steps" aria-label="Этапы анализа">
            <span className="active"><b>1</b> Зона</span><i /><span className="active"><b>2</b> Симптомы</span><i /><span><b>3</b> Результат</span>
          </div>
        </div>

        <form onSubmit={submit} className="assessment-grid">
          <section className="panel body-panel">
            <div className="panel-heading"><div><span>Шаг 1</span><h2>Выберите зоны тела</h2></div><small>{zones.length} выбрано</small></div>
            <BodyMap selected={zones} onToggle={toggleZone} view={view} onViewChange={setView} />
            <p className="panel-hint"><Check size={15} /> Можно выбрать несколько областей</p>
          </section>

          <section className="assessment-form-column">
            <div className="panel symptoms-panel">
              <div className="panel-heading"><div><span>Шаг 2</span><h2>Расскажите о симптомах</h2></div></div>
              <label className="field-label" htmlFor="symptoms">Описание ощущений</label>
              <textarea
                id="symptoms"
                value={symptoms}
                onChange={(event) => setSymptoms(event.target.value)}
                placeholder="Например: тянущая боль в шее появилась два дня назад, усиливается при повороте головы и отдает в правое плечо…"
                minLength={10}
                maxLength={5000}
                required
              />
              <div className="textarea-meta"><span>Укажите характер, длительность и что усиливает боль</span><b>{symptoms.length}/5000</b></div>

              <div className="upload-area">
                <input id="medical-file" type="file" accept=".pdf,.txt,application/pdf,text/plain" onChange={uploadFile} disabled={fileLoading} />
                {fileName ? (
                  <div className="file-ready"><span><FileText size={21} /></span><div><strong>{fileName}</strong><small>{attachmentText.length} символов извлечено</small></div><button type="button" onClick={() => { setFileName(""); setAttachmentText(""); }} aria-label="Удалить файл"><X size={18} /></button></div>
                ) : (
                  <label htmlFor="medical-file"><span>{fileLoading ? <LoaderCircle className="spin" /> : <UploadCloud />}</span><div><strong>{fileLoading ? "Читаем файл…" : "Добавить медицинский документ"}</strong><small>PDF или TXT, до 5 МБ</small></div><Paperclip size={18} /></label>
                )}
              </div>
            </div>

            <div className="panel flags-panel">
              <div className="flags-heading"><span><ShieldAlert size={19} /></span><div><h2>Есть ли опасные симптомы?</h2><p>Отметьте всё, что наблюдается сейчас</p></div></div>
              <div className="flags-grid">
                {RED_FLAGS.map((flag) => (
                  <label key={flag.id} className={redFlags.includes(flag.id) ? "flag-option selected" : "flag-option"}>
                    <input type="checkbox" checked={redFlags.includes(flag.id)} onChange={() => toggleFlag(flag.id)} />
                    <span className="custom-check"><Check size={14} /></span>
                    <span>{flag.label}</span>
                  </label>
                ))}
              </div>
              {redFlags.length > 0 && <div className="emergency-note"><AlertTriangle size={18} /><span>Отмечен опасный симптом. Результат получит экстренный приоритет.</span></div>}
            </div>

            {error && <div className="form-error assessment-error" role="alert"><AlertTriangle size={18} /> <span>{error}</span></div>}

            <button className="button primary analyze-button" type="submit" disabled={submitting || fileLoading || zones.length === 0 || symptoms.trim().length < 10}>
              {submitting ? <><LoaderCircle className="spin" size={20} /> Экспертная система анализирует…</> : <><Sparkles size={20} /> Получить результат <ChevronRight size={20} /></>}
            </button>
            <p className="submit-note"><ShieldAlert size={15} /> Результат носит информационный характер и не заменяет медицинскую консультацию.</p>
          </section>
        </form>

        <div ref={resultRef}>{analysis && <AnalysisResult analysis={analysis} />}</div>
      </main>
    </div>
  );
}
