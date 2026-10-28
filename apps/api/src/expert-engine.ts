export const ZONE_DEFINITIONS = [
  { id: "head", label: "Голова / Виски / Затылок", category: "head_neck" },
  { id: "neck", label: "Шея / Шейный отдел", category: "head_neck" },
  { id: "shoulders_arms", label: "Плечи / Руки", category: "upper_limbs" },
  { id: "chest", label: "Грудная клетка", category: "chest" },
  { id: "abdomen", label: "Живот", category: "abdomen" },
  { id: "lower_back", label: "Поясница / Крестец", category: "back_pelvis" },
  { id: "pelvis", label: "Таз / Тазобедренный сустав", category: "back_pelvis" },
  { id: "knees_legs", label: "Колени / Ноги", category: "lower_limbs" },
  { id: "ankles_feet", label: "Голеностоп / Стопа", category: "lower_limbs" },
] as const;

export const RED_FLAG_DEFINITIONS = [
  { id: "limb_weakness", label: "Онемение или нарастающая слабость в конечностях" },
  { id: "dizziness_nausea", label: "Сильное головокружение, тошнота или потемнение в глазах" },
  { id: "acute_breathing", label: "Резкая боль при вдохе, выдохе или нагрузке" },
  { id: "chest_pressure", label: "Давящая боль за грудиной или нехватка воздуха" },
  { id: "face_asymmetry", label: "Внезапная асимметрия лица или нарушение речи" },
  { id: "loss_consciousness", label: "Потеря сознания или спутанность" },
] as const;

type ZoneId = (typeof ZONE_DEFINITIONS)[number]["id"];
type RedFlagId = (typeof RED_FLAG_DEFINITIONS)[number]["id"];
type RiskLevel = "PLANNED" | "URGENT" | "EMERGENCY";

export type AnalysisInput = {
  zones: ZoneId[];
  symptoms: string;
  redFlags: RedFlagId[];
  attachmentText?: string;
};

export type ExpertResult = {
  riskLevel: RiskLevel;
  urgency: string;
  specialist: string;
  summary: string;
  insights: string[];
  possibleFactors: string[];
  actions: string[];
  avoid: string[];
  selectedZoneLabels: string[];
  redFlagLabels: string[];
  dataQuality: "Базовая" | "Достаточная" | "Подробная";
  disclaimer: string;
};

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  head_neck: ["голов", "висок", "затыл", "глаз", "ухо", "уше", "макуш", "шея", "шею", "шейн"],
  upper_limbs: ["плеч", "рук", "локт", "кист", "предплеч"],
  chest: ["груд", "межреб", "грудин", "сердц", "дышан"],
  abdomen: ["живот", "желуд", "кишеч", "подребер", "тошнот"],
  back_pelvis: ["поясниц", "спин", "крест", "таз", "ягод", "бедр"],
  lower_limbs: ["ног", "колен", "стоп", "голен", "пятк", "икр"],
};

const EMERGENCY_PHRASES = [
  "потеря сознания",
  "не могу дышать",
  "нехватка воздуха",
  "давит за грудиной",
  "асимметрия лица",
  "нарушение речи",
  "внезапное онемение",
  "громоподобная боль",
];

const URGENT_PHRASES = ["высокая температура", "сильный отек", "после падения", "после удара", "усиливается", "не проходит", "рвота"];

export class ConsistencyError extends Error {
  constructor(public readonly details: { selected: string[]; mentioned: string[] }) {
    super("Выбранная зона не совпадает с описанием симптомов");
  }
}

function includesAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

function validateConsistency(zones: ZoneId[], text: string) {
  const selectedCategories = new Set<string>(
    zones.map((id) => ZONE_DEFINITIONS.find((zone) => zone.id === id)!.category),
  );
  const mentionedCategories = new Set(
    Object.entries(CATEGORY_KEYWORDS)
      .filter(([, keywords]) => includesAny(text, keywords))
      .map(([category]) => category),
  );

  if (
    selectedCategories.size > 0 &&
    mentionedCategories.size > 0 &&
    ![...mentionedCategories].some((category) => selectedCategories.has(category))
  ) {
    const categoryNames: Record<string, string> = {
      head_neck: "голова / шея",
      upper_limbs: "плечи / руки",
      chest: "грудная клетка",
      abdomen: "живот",
      back_pelvis: "поясница / таз",
      lower_limbs: "ноги / стопы",
    };
    throw new ConsistencyError({
      selected: [...selectedCategories].map((category) => categoryNames[category!] ?? category!),
      mentioned: [...mentionedCategories].map((category) => categoryNames[category] ?? category),
    });
  }
}

function chooseSpecialist(text: string, zones: ZoneId[], riskLevel: RiskLevel) {
  if (riskLevel === "EMERGENCY") return "Бригада скорой медицинской помощи";
  if (includesAny(text, ["ухо", "уше", "отит", "насмор", "горл", "синус", "гаймор"])) return "Оториноларинголог (ЛОР)";
  if (includesAny(text, ["зуб", "челюст", "внчс", "прикус", "жеван"])) return "Стоматолог-гнатолог";
  if (zones.includes("chest")) return "Кардиолог / Терапевт";
  if (zones.includes("abdomen")) return "Терапевт / Гастроэнтеролог";
  if (zones.some((zone) => ["shoulders_arms", "lower_back", "pelvis", "knees_legs", "ankles_feet"].includes(zone))) {
    return includesAny(text, ["онем", "прострел", "мураш", "слабост"]) ? "Невролог" : "Травматолог-ортопед";
  }
  if (zones.some((zone) => ["head", "neck"].includes(zone))) return "Невролог";
  return "Терапевт";
}

export function analyzeSymptoms(input: AnalysisInput): ExpertResult {
  const combinedText = `${input.symptoms} ${input.attachmentText ?? ""}`.toLocaleLowerCase("ru").trim();
  validateConsistency(input.zones, combinedText);

  const emergencyByText = includesAny(combinedText, EMERGENCY_PHRASES);
  const riskLevel: RiskLevel = input.redFlags.length > 0 || emergencyByText
    ? "EMERGENCY"
    : includesAny(combinedText, URGENT_PHRASES)
      ? "URGENT"
      : "PLANNED";

  const specialist = chooseSpecialist(combinedText, input.zones, riskLevel);
  const selectedZoneLabels = input.zones.map(
    (id) => ZONE_DEFINITIONS.find((zone) => zone.id === id)?.label ?? id,
  );
  const redFlagLabels = input.redFlags.map(
    (id) => RED_FLAG_DEFINITIONS.find((flag) => flag.id === id)?.label ?? id,
  );
  const insights: string[] = [];
  const possibleFactors: string[] = [];

  if (includesAny(combinedText, ["тян", "ноет", "ноющ", "туп"])) {
    insights.push("Ноющий или тянущий характер часто сопровождает мышечно-фасциальную перегрузку; точную причину устанавливает очный осмотр.");
  }
  if (includesAny(combinedText, ["стрел", "остр", "колющ", "резк"])) {
    insights.push("Острый или простреливающий характер может быть связан с раздражением нервных структур либо повреждением тканей.");
  }
  if (includesAny(combinedText, ["ухо", "уше", "насмор", "горл"])) {
    insights.push("Сочетание боли в области уха с симптомами простуды требует исключить воспаление ЛОР-органов.");
  }
  if (includesAny(combinedText, ["зуб", "челюст", "внчс", "жеван"])) {
    insights.push("Связь с жеванием или челюстью может указывать на стоматологический фактор или дисфункцию ВНЧС.");
  }
  if (includesAny(combinedText, ["голов", "затыл", "макуш"])) {
    insights.push("Боль в голове и затылке нередко усиливается при перенапряжении мышц шеи, недосыпе и длительной работе за экраном.");
  }
  if (insights.length === 0) {
    insights.push("Зафиксирован локализованный дискомфорт. Для определения причины важны осмотр, динамика симптомов и анамнез.");
  }

  possibleFactors.push("Длительная статическая нагрузка, неудобная поза или непривычная физическая активность.");
  if (includesAny(combinedText, ["после нагруз", "спорт", "поднял", "трениров"])) {
    possibleFactors.push("Перегрузка мышц, сухожилий или суставно-связочного аппарата.");
  }
  if (includesAny(combinedText, ["стресс", "недосып", "устал"])) {
    possibleFactors.push("Недосып и стресс способны усиливать мышечное напряжение и восприятие боли.");
  }

  let actions = [
    "Ограничьте нагрузку на беспокоящую область и отслеживайте изменение симптомов.",
    "Зафиксируйте время начала, интенсивность боли по шкале 0–10 и факторы, которые её усиливают.",
    `Запланируйте консультацию: ${specialist}.`,
  ];
  let avoid = [
    "Не выполняйте упражнения и резкие движения через боль.",
    "Не начинайте приём лекарств и не прогревайте область без рекомендации специалиста.",
  ];

  if (riskLevel === "URGENT") {
    actions = [
      "Обратитесь в неотложную помощь или к врачу в течение ближайших суток.",
      "Обеспечьте покой и подготовьте список симптомов, лекарств и хронических заболеваний.",
      ...actions.slice(0, 1),
    ];
  }
  if (riskLevel === "EMERGENCY") {
    actions = [
      "Немедленно вызовите скорую помощь по местному номеру экстренных служб.",
      "Не оставайтесь в одиночестве; сообщите близкому человеку о состоянии.",
      "Примите безопасное положение и следуйте указаниям диспетчера.",
    ];
    avoid = [
      "Не управляйте автомобилем самостоятельно.",
      "Не ждите, что опасные симптомы пройдут сами, и не откладывайте обращение за помощью.",
    ];
  }

  const urgency = riskLevel === "EMERGENCY"
    ? "Экстренно — требуется немедленная помощь"
    : riskLevel === "URGENT"
      ? "Срочно — осмотр в течение 24 часов"
      : "Планово — запишитесь на очную консультацию";

  const textDetail = input.symptoms.trim().length + (input.attachmentText?.trim().length ?? 0);
  const dataQuality = textDetail > 250 && input.zones.length > 0 ? "Подробная" : textDetail > 60 ? "Достаточная" : "Базовая";

  return {
    riskLevel,
    urgency,
    specialist,
    summary: riskLevel === "EMERGENCY"
      ? "Обнаружены признаки, при которых дистанционная оценка недостаточна. Нужна немедленная очная помощь."
      : `Симптомы требуют ${riskLevel === "URGENT" ? "скорого" : "планового"} очного осмотра. Система подобрала профиль специалиста по указанным зонам и описанию.`,
    insights,
    possibleFactors,
    actions,
    avoid,
    selectedZoneLabels,
    redFlagLabels,
    dataQuality,
    disclaimer: "HBBA выполняет первичный информационный триаж и не ставит диагноз. Решение о лечении принимает медицинский специалист после очного осмотра.",
  };
}
