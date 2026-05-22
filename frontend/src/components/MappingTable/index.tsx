"use client";

import { useState } from "react";
import { CSVUploadResponse } from "../DragDropZone";
import { ArrowLeftIcon, CodeIcon, ClipboardIcon, CheckIcon } from "@/components/icons";
import { DIALECT_TYPES_MAP, isBooleanOrTinyint, isDateType, ValueMapping, DATE_FORMAT_OPTIONS, DATE_OUTPUT_FORMAT_OPTIONS } from "./constants";
import Modal from "../Modal";
import styles from "./styles.module.scss";

interface MappingTableProps {
  data: CSVUploadResponse;
  onCancel: () => void;
}

interface ColumnConfig {
  csv_name: string;
  enabled: boolean;
  db_name: string;
  db_type: string;
  value_mappings?: ValueMapping[];
  date_format?: string;
  date_output_format?: string;
}

export default function MappingTable({ data, onCancel }: MappingTableProps) {
  const [dialect, setDialect] = useState("mysql");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSql, setGeneratedSql] = useState("");
  const [copied, setCopied] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeModalIndex, setActiveModalIndex] = useState<number | null>(null);
  const [modalType, setModalType] = useState<"boolean" | "date" | null>(null);
  const [tempMappings, setTempMappings] = useState<ValueMapping[]>([]);
  const [tempDateFormat, setTempDateFormat] = useState("%d/%m/%Y");
  const [tempDateOutputFormat, setTempDateOutputFormat] = useState("%Y-%m-%d");
  const [sampleDateValue, setSampleDateValue] = useState("");

  const [tableName, setTableName] = useState(() => {
    return data.filename.toLowerCase().replace(".csv", "").replace(/[^a-z0-9_]/g, "_");
  });

  const [columns, setColumns] = useState<ColumnConfig[]>(() => {
    return data.columns.map((col) => {
      const cleanColName = col
        .toLowerCase()
        .replace(/ /g, "_")
        .replace(/[^a-z0-9_]/g, "");

      return {
        csv_name: col,
        enabled: true,
        db_name: cleanColName,
        db_type: "VARCHAR(255)",
      };
    });
  });

  const currentTypes = DIALECT_TYPES_MAP[dialect] || DIALECT_TYPES_MAP["mysql"];

  const handleDialectChange = (newDialect: string) => {
    setDialect(newDialect);
    setColumns((prev) => prev.map((col) => ({ ...col, db_type: "VARCHAR(255)", value_mappings: undefined, date_format: undefined, date_output_format: undefined })));
  };

  const handleRowPropertyChange = (
    index: number,
    property: keyof ColumnConfig,
    value: string | boolean
  ) => {
    setColumns((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [property]: value } as ColumnConfig;
      if (property === "db_type") {
        updated[index].value_mappings = undefined;
        updated[index].date_format = undefined;
        updated[index].date_output_format = undefined;
      }
      return updated;
    });

    if (property === "db_type") {
      if (isBooleanOrTinyint(value as string)) {
        const currentMappings = columns[index].value_mappings;
        setTempMappings(currentMappings && currentMappings.length > 0
          ? currentMappings
          : [{ when_value: "Y", then_value: "1" }, { when_value: "N", then_value: "0" }]
        );
        setModalType("boolean");
        setActiveModalIndex(index);
        setIsModalOpen(true);
      } else if (isDateType(value as string)) {
        setTempDateFormat(columns[index].date_format || "%d/%m/%Y");
        setTempDateOutputFormat(columns[index].date_output_format || "%Y-%m-%d");
        setSampleDateValue(data.sample_data[0]?.[columns[index].csv_name]?.toString() ?? "");
        setModalType("date");
        setActiveModalIndex(index);
        setIsModalOpen(true);
      }
    }
  };

  const saveModalMappings = () => {
    if (activeModalIndex !== null) {
      if (modalType === "boolean") {
        setColumns((prev) => {
          const updated = [...prev];
          updated[activeModalIndex].value_mappings = tempMappings.filter(
            (m) => m.when_value.trim() !== "" && m.then_value.trim() !== ""
          );
          return updated;
        });
      } else if (modalType === "date") {
        setColumns((prev) => {
          const updated = [...prev];
          updated[activeModalIndex].date_format = tempDateFormat;
          updated[activeModalIndex].date_output_format = tempDateOutputFormat;
          return updated;
        });
      }
    }
    setIsModalOpen(false);
    setActiveModalIndex(null);
    setModalType(null);
  };

  const handleGenerateScript = async () => {
    if (!tableName.trim()) {
      alert("Por favor, digite um nome válido para a tabela.");
      return;
    }

    const activeMappings = columns.filter((c) => c.enabled);
    if (activeMappings.length === 0) {
      alert("Selecione ao menos uma coluna para gerar o script.");
      return;
    }

    setIsGenerating(true);

    const payload = {
      filename: data.filename,
      custom_table_name: tableName,
      dialect,
      mappings: activeMappings.map((c) => ({
        csv_name: c.csv_name,
        db_name: c.db_name,
        db_type: c.db_type,
        value_mappings: c.value_mappings || [],
        date_format: c.date_format || null,
        date_output_format: c.date_output_format || null,
      })),
    };

    try {
      const response = await fetch("http://localhost:8000/api/v1/generate-sql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Erro no processamento.");

      const result = await response.json();
      setGeneratedSql(result.sql_script);
    } catch (error) {
      console.error(error);
      alert("Falha ao gerar o script SQL.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedSql);
    } catch {
      const el = document.createElement("textarea");
      el.value = generatedSql;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={styles.container}>
      <div className={styles.tableHeader}>
        <div className={styles.fileInfo}>
          <button className={styles.backBtn} onClick={onCancel}>
            <ArrowLeftIcon size={14} />
            Voltar
          </button>
          <span className={styles.separator}>/</span>
          <span className={styles.fileName}>{data.filename}</span>
        </div>
        <div className={styles.infoBadge}>{data.total_rows} linhas</div>
      </div>

      <div className={styles.globalConfig}>
        <div className={styles.inputGroup}>
          <label>Nome da tabela</label>
          <input
            type="text"
            value={tableName}
            onChange={(e) => setTableName(e.target.value)}
            placeholder="ex: tb_usuarios"
            className={styles.textInput}
          />
        </div>

        <div className={styles.inputGroup}>
          <label>Dialeto SQL</label>
          <select
            value={dialect}
            onChange={(e) => handleDialectChange(e.target.value)}
            className={styles.selectInput}
          >
            <option value="mysql">MySQL</option>
            <option value="postgresql">PostgreSQL</option>
          </select>
        </div>
      </div>

      <div className={styles.gridHeader}>
        <span className={styles.checkCol}></span>
        <span style={{ flex: 2 }}>Coluna CSV</span>
        <span style={{ flex: 2 }}>Nome na tabela</span>
        <span style={{ flex: 1.5 }}>Tipo</span>
      </div>

      <div className={styles.grid}>
        {columns.map((column, index) => (
          <div
            key={column.csv_name}
            className={`${styles.row} ${!column.enabled ? styles.rowDisabled : ""}`}
          >
            <input
              type="checkbox"
              checked={column.enabled}
              onChange={(e) => handleRowPropertyChange(index, "enabled", e.target.checked)}
              className={styles.checkbox}
            />

            <span className={styles.columnName} style={{ flex: 2 }}>
              {column.csv_name}
            </span>

            <input
              type="text"
              value={column.db_name}
              onChange={(e) => handleRowPropertyChange(index, "db_name", e.target.value)}
              disabled={!column.enabled}
              className={styles.tableInput}
              style={{ flex: 2 }}
            />

            <div style={{ flex: 1.5, display: "flex", alignItems: "center", gap: "8px" }}>
              <select
                value={column.db_type}
                onChange={(e) => handleRowPropertyChange(index, "db_type", e.target.value)}
                disabled={!column.enabled}
                className={styles.tableSelect}
                style={{ flex: 1 }}
              >
                {currentTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              {column.enabled && (isBooleanOrTinyint(column.db_type) || isDateType(column.db_type)) && (
                <button
                  type="button"
                  className={styles.gearBtn}
                  onClick={() => {
                    if (isBooleanOrTinyint(column.db_type)) {
                      setTempMappings(column.value_mappings || [
                        { when_value: "Y", then_value: "1" },
                        { when_value: "N", then_value: "0" },
                      ]);
                      setModalType("boolean");
                    } else {
                      setTempDateFormat(column.date_format || "%d/%m/%Y");
                      setTempDateOutputFormat(column.date_output_format || "%Y-%m-%d");
                      setSampleDateValue(data.sample_data[0]?.[column.csv_name]?.toString() ?? "");
                      setModalType("date");
                    }
                    setActiveModalIndex(index);
                    setIsModalOpen(true);
                  }}
                >
                  ⚙️
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.actions}>
        <button className={styles.btnCancel} onClick={onCancel}>
          Cancelar
        </button>
        <button
          className={styles.btnSubmit}
          onClick={handleGenerateScript}
          disabled={isGenerating}
        >
          {isGenerating ? "Gerando..." : "Gerar SQL"}
        </button>
      </div>

      {generatedSql && (
        <div className={styles.outputContainer}>
          <div className={styles.outputHeader}>
            <div className={styles.outputTitle}>
              <CodeIcon size={14} />
              <span>Script gerado</span>
            </div>
            <button className={styles.copyBtn} onClick={handleCopy}>
              {copied ? <CheckIcon size={13} /> : <ClipboardIcon size={13} />}
              {copied ? "Copiado" : "Copiar"}
            </button>
          </div>
          <textarea
            readOnly
            value={generatedSql}
            className={styles.textareaSql}
            onClick={(e) => (e.target as HTMLTextAreaElement).select()}
          />
        </div>
      )}

      <Modal
        isOpen={isModalOpen && activeModalIndex !== null}
        onClose={() => { setIsModalOpen(false); setActiveModalIndex(null); setModalType(null); }}
        title={modalType === "date" ? "Configurar Formato de Data" : "Configurar Regras de Conversão"}
      >
        {activeModalIndex !== null && (
          <div className={styles.modalContentBody}>
            <p>Coluna: <strong>{columns[activeModalIndex].csv_name}</strong></p>

            {modalType === "date" ? (
              <div className={styles.inputGroup}>
                {sampleDateValue && (
                  <p className={styles.formatHint}>
                    Valor no CSV: <code>{sampleDateValue}</code> — selecione o formato que corresponde a esse valor.
                  </p>
                )}
                <label>Formato de entrada (no CSV)</label>
                <select
                  value={tempDateFormat}
                  onChange={(e) => setTempDateFormat(e.target.value)}
                  className={styles.selectInput}
                >
                  {DATE_FORMAT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <label style={{ marginTop: "0.75rem" }}>Formato de saída (no INSERT)</label>
                <select
                  value={tempDateOutputFormat}
                  onChange={(e) => setTempDateOutputFormat(e.target.value)}
                  className={styles.selectInput}
                >
                  {DATE_OUTPUT_FORMAT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className={styles.mappingRows}>
                {tempMappings.map((map, i) => (
                  <div key={i} className={styles.modalRow}>
                    <span>Se o valor for:</span>
                    <input
                      type="text"
                      value={map.when_value}
                      onChange={(e) => setTempMappings(prev => {
                        const copy = [...prev];
                        copy[i].when_value = e.target.value;
                        return copy;
                      })}
                    />
                    <span>mudar para:</span>
                    <input
                      type="text"
                      value={map.then_value}
                      onChange={(e) => setTempMappings(prev => {
                        const copy = [...prev];
                        copy[i].then_value = e.target.value;
                        return copy;
                      })}
                    />
                  </div>
                ))}
              </div>
            )}

            <div className={styles.modalActions}>
              <button type="button" onClick={() => { setIsModalOpen(false); setActiveModalIndex(null); setModalType(null); }}>Cancelar</button>
              <button type="button" className={styles.btnSave} onClick={saveModalMappings}>Aplicar</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}