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