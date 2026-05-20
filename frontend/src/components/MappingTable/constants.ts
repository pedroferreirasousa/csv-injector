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

// Mapeamento centralizado para facilitar a busca dinâmica por dialeto
export const DIALECT_TYPES_MAP: Record<string, string[]> = {
  mysql: MYSQL_TYPES,
  postgresql: POSTGRES_TYPES,
};