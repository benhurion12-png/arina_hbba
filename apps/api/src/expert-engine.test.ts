import assert from "node:assert/strict";
import test from "node:test";
import { analyzeSymptoms, ConsistencyError } from "./expert-engine.js";

test("routes a knee complaint to an orthopedist", () => {
  const result = analyzeSymptoms({
    zones: ["knees_legs"],
    symptoms: "После тренировки ноет колено и боль усиливается при ходьбе",
    redFlags: [],
  });
  assert.equal(result.specialist, "Травматолог-ортопед");
  assert.equal(result.riskLevel, "URGENT");
});

test("red flags always produce emergency priority", () => {
  const result = analyzeSymptoms({
    zones: ["chest"],
    symptoms: "Боль в грудной клетке",
    redFlags: ["chest_pressure"],
  });
  assert.equal(result.riskLevel, "EMERGENCY");
  assert.equal(result.specialist, "Бригада скорой медицинской помощи");
});

test("detects contradictory body zone", () => {
  assert.throws(
    () => analyzeSymptoms({ zones: ["head"], symptoms: "Сильно ноет колено", redFlags: [] }),
    ConsistencyError,
  );
});

test("recognizes ENT symptom context", () => {
  const result = analyzeSymptoms({
    zones: ["head"],
    symptoms: "Стреляет в ухе после насморка",
    redFlags: [],
  });
  assert.equal(result.specialist, "Оториноларинголог (ЛОР)");
});
