export const MYSQL_TYPES = [
  "VARCHAR(255)",
  "BIGINT",
  "INT",
  "TINYINT(1)",
  "VARCHAR(50)",
  "VARCHAR(100)",
  "TEXT",
  "DECIMAL(20,2)",
  "DATE",
  "TIMESTAMP"
];

export const POSTGRES_TYPES = [
  "VARCHAR(255)",
  "BIGINT",
  "INTEGER",
  "BOOLEAN",
  "VARCHAR(50)",
  "VARCHAR(100)",
  "TEXT",
  "NUMERIC(20,2)",
  "DATE",
  "TIMESTAMP"
];

export const DIALECT_TYPES_MAP: Record<string, string[]> = {
  mysql: MYSQL_TYPES,
  postgresql: POSTGRES_TYPES,
};

export interface ValueMapping {
  when_value: string;
  then_value: string;
}

export const isBooleanOrTinyint = (type: string): boolean => {
  const t = type.toUpperCase();
  return t.includes("TINYINT(1)") || t.includes("BOOLEAN") || t === "BIT";
};

export const isDateType = (type: string): boolean => {
  const t = type.toUpperCase();
  return t === "DATE" || t === "TIMESTAMP" || t === "DATETIME";
};

export const DATE_OUTPUT_FORMAT_OPTIONS = [
  { label: "YYYY-MM-DD  (ex: 2026-05-03) — padrão SQL", value: "%Y-%m-%d" },
  { label: "DD/MM/YYYY  (ex: 03/05/2026)", value: "%d/%m/%Y" },
  { label: "MM/DD/YYYY  (ex: 05/03/2026)", value: "%m/%d/%Y" },
  { label: "DD-MM-YYYY  (ex: 03-05-2026)", value: "%d-%m-%Y" },
];

export const DATE_FORMAT_OPTIONS = [
  { label: "DD/MM/YYYY  (ex: 03/05/2026)", value: "%d/%m/%Y" },
  { label: "MM/DD/YYYY  (ex: 05/03/2026)", value: "%m/%d/%Y" },
  { label: "YYYY-MM-DD  (ex: 2026-05-03)", value: "%Y-%m-%d" },
  { label: "DD-MM-YYYY  (ex: 03-05-2026)", value: "%d-%m-%Y" },
  { label: "DD/MM/YY    (ex: 03/05/26)", value: "%d/%m/%y" },
  { label: "DD M\u00eas, YYYY  (ex: 3 maio, 2026)", value: "%d %B, %Y" },
  { label: "Mês DD, YYYY  (ex: maio 3, 2026)", value: "%B %d, %Y" },
  { label: "DD de Mês de YYYY  (ex: 3 de maio de 2026)", value: "%d de %B de %Y" },
];