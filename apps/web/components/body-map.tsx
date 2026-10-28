"use client";

import type { CSSProperties, KeyboardEvent } from "react";
import { RotateCcw } from "lucide-react";

export const BODY_ZONES = [
  { id: "head", label: "Голова", fullLabel: "Голова / Виски / Затылок", color: "#ff7f74" },
  { id: "neck", label: "Шея", fullLabel: "Шея / Шейный отдел", color: "#8b7ff5" },
  { id: "shoulders_arms", label: "Плечи и руки", fullLabel: "Плечи / Руки", color: "#4aa8e8" },
  { id: "chest", label: "Грудная клетка", fullLabel: "Грудная клетка", color: "#36b9a0" },
  { id: "abdomen", label: "Живот", fullLabel: "Живот", color: "#e4a443" },
  { id: "lower_back", label: "Поясница", fullLabel: "Поясница / Крестец", color: "#c676df" },
  { id: "pelvis", label: "Таз", fullLabel: "Таз / Тазобедренный сустав", color: "#ec78a7" },
  { id: "knees_legs", label: "Колени и ноги", fullLabel: "Колени / Ноги", color: "#54b876" },
  { id: "ankles_feet", label: "Стопы", fullLabel: "Голеностоп / Стопа", color: "#3bbbc4" },
] as const;

export type BodyZoneId = (typeof BODY_ZONES)[number]["id"];
type View = "front" | "back";

type Props = {
  selected: BodyZoneId[];
  onToggle: (zone: BodyZoneId) => void;
  view: View;
  onViewChange: (view: View) => void;
};

function zoneProps(id: BodyZoneId, selected: BodyZoneId[], onToggle: (zone: BodyZoneId) => void) {
  const zone = BODY_ZONES.find((item) => item.id === id)!;
  const active = selected.includes(id);
  const handleKeyboard = (event: KeyboardEvent<SVGGElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onToggle(id);
    }
  };
  return {
    className: active ? "body-zone selected" : "body-zone",
    style: { "--zone-color": zone.color } as CSSProperties,
    role: "button",
    tabIndex: 0,
    "aria-label": `${active ? "Убрать" : "Выбрать"}: ${zone.fullLabel}`,
    "aria-pressed": active,
    onClick: () => onToggle(id),
    onKeyDown: handleKeyboard,
  };
}

export function BodyMap({ selected, onToggle, view, onViewChange }: Props) {
  return (
    <div className="body-map-wrap">
      <div className="body-view-switch" role="group" aria-label="Вид тела">
        <button type="button" className={view === "front" ? "active" : ""} onClick={() => onViewChange("front")}>Спереди</button>
        <button type="button" className={view === "back" ? "active" : ""} onClick={() => onViewChange("back")}>Сзади</button>
        <RotateCcw size={15} aria-hidden="true" />
      </div>

      <div className="body-canvas">
        <div className="body-orbit orbit-one" />
        <div className="body-orbit orbit-two" />
        <svg className="body-svg" viewBox="0 0 320 620" role="img" aria-labelledby="body-title body-desc">
          <title id="body-title">Интерактивная карта тела, вид {view === "front" ? "спереди" : "сзади"}</title>
          <desc id="body-desc">Выберите одну или несколько зон, в которых ощущаете дискомфорт.</desc>
          <defs>
            <linearGradient id="bodyBase" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="var(--body-gradient-start)" />
              <stop offset="1" stopColor="var(--body-gradient-end)" />
            </linearGradient>
            <filter id="bodyGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="7" stdDeviation="9" floodColor="var(--body-shadow)" floodOpacity=".2" />
            </filter>
          </defs>

          <g filter="url(#bodyGlow)" className="body-figure">
            <g {...zoneProps("head", selected, onToggle)}>
              <ellipse cx="160" cy="55" rx="39" ry="46" />
              <path className="body-detail" d="M143 57c5 4 10 5 17 5s12-1 17-5M148 43h.1M172 43h.1" />
              <title>Голова / Виски / Затылок</title>
            </g>

            <g {...zoneProps("neck", selected, onToggle)}>
              <path d="M142 96v31l-14 13h64l-14-13V96c-10 9-26 9-36 0Z" />
              {view === "back" && <path className="body-detail" d="M153 103v27M167 103v27" />}
              <title>Шея / Шейный отдел</title>
            </g>

            <g {...zoneProps("shoulders_arms", selected, onToggle)}>
              <path d="M127 132c-25 3-42 11-51 29-8 16-14 50-18 83l-12 106c-1 13 6 21 16 22 10 0 16-7 18-19l18-98 20-71 19-41Z" />
              <path d="M193 132c25 3 42 11 51 29 8 16 14 50 18 83l12 106c1 13-6 21-16 22-10 0-16-7-18-19l-18-98-20-71-19-41Z" />
              <circle cx="58" cy="378" r="15" />
              <circle cx="262" cy="378" r="15" />
              <title>Плечи / Руки</title>
            </g>

            {view === "front" ? (
              <g {...zoneProps("chest", selected, onToggle)}>
                <path d="M126 132c11 7 57 7 68 0 13 13 19 38 18 66l-5 63H113l-5-63c-1-28 5-53 18-66Z" />
                <path className="body-detail" d="M160 146v104M119 195c21-8 61-8 82 0" />
                <title>Грудная клетка</title>
              </g>
            ) : (
              <g {...zoneProps("lower_back", selected, onToggle)}>
                <path d="M126 132c11 7 57 7 68 0 13 13 19 38 18 66l-5 68h-94l-5-68c-1-28 5-53 18-66Z" />
                <path className="body-detail spine" d="M160 143v110m-20-86 20 9 20-9m-40 36 20 9 20-9m-35 36 15 8 15-8" />
                <title>Поясница / Спина</title>
              </g>
            )}

            {view === "front" && (
              <g {...zoneProps("abdomen", selected, onToggle)}>
                <path d="M113 258c3 31 8 51 16 70h62c8-19 13-39 16-70-25 8-69 8-94 0Z" />
                <path className="body-detail" d="M160 274v39m-23-20h46" />
                <title>Живот</title>
              </g>
            )}

            <g {...zoneProps("pelvis", selected, onToggle)}>
              <path d="M129 324c-8 22-10 43-4 65l35 16 35-16c6-22 4-43-4-65-18 8-44 8-62 0Z" />
              <path className="body-detail" d="M136 352c14 8 34 8 48 0" />
              <title>Таз / Тазобедренный сустав</title>
            </g>

            <g {...zoneProps("knees_legs", selected, onToggle)}>
              <path d="M126 383c-3 47-1 91 5 124l3 57h37l-2-58-9-105Z" />
              <path d="M194 383c3 47 1 91-5 124l-3 57h-37l2-58 9-105Z" />
              <circle className="body-joint" cx="141" cy="486" r="12" />
              <circle className="body-joint" cx="179" cy="486" r="12" />
              <title>Колени / Ноги</title>
            </g>

            <g {...zoneProps("ankles_feet", selected, onToggle)}>
              <path d="M133 554h38l1 36c-4 12-52 12-54 2 0-8 8-15 15-21Z" />
              <path d="M187 554h-38l-1 36c4 12 52 12 54 2 0-8-8-15-15-21Z" />
              <title>Голеностоп / Стопа</title>
            </g>
          </g>
        </svg>
        <span className="body-view-label">{view === "front" ? "Передняя проекция" : "Задняя проекция"}</span>
      </div>

      <div className="zone-list" aria-label="Зоны тела">
        {BODY_ZONES.map((zone) => (
          <button
            key={zone.id}
            type="button"
            className={selected.includes(zone.id) ? "zone-chip selected" : "zone-chip"}
            onClick={() => onToggle(zone.id)}
            style={{ "--zone-color": zone.color } as CSSProperties}
            aria-pressed={selected.includes(zone.id)}
          >
            <span />{zone.label}
          </button>
        ))}
      </div>
    </div>
  );
}
