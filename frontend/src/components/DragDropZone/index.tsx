"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { UploadIcon, SpinnerIcon } from "@/components/icons";
import { API_BASE_URL } from "@/lib/api";
import styles from "./styles.module.scss";

export interface CSVUploadResponse {
  filename: string;
  columns: string[];
  total_rows: number;
  sample_data: Record<string, unknown>[];
}

interface DragDropZoneProps {
  onUploadSuccess: (data: CSVUploadResponse) => void;
}

export default function DragDropZone({ onUploadSuccess }: DragDropZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleContainerClick = () => {
    fileInputRef.current?.click();
  };

  const uploadFileToBackend = async (file: File) => {
    if (!file || !file.name.endsWith(".csv")) {
      alert("Por favor, selecione apenas arquivos com formato .csv");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/upload-csv`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Erro na resposta do servidor.");
      }

      const data: CSVUploadResponse = await response.json();
      onUploadSuccess(data);
    } catch (error) {
      console.error("Erro no upload:", error);
      alert("Falha ao conectar com o backend. Certifique-se de que a API está rodando.");
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFileToBackend(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadFileToBackend(e.target.files[0]);
    }
  };

  return (
    <>
    <div
      className={`${styles.dropzone} ${isDragActive ? styles.dragActive : ""} ${loading ? styles.isLoading : ""}`}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      onClick={!loading ? handleContainerClick : undefined}
    >
      <input
        ref={fileInputRef}
        type="file"
        className={styles.fileInput}
        accept=".csv"
        onChange={handleInputChange}
      />

      <div className={styles.iconContainer}>
        {loading ? (
          <SpinnerIcon size={36} className={styles.spinner} />
        ) : (
          <UploadIcon size={36} />
        )}
      </div>

      <div className={styles.textContainer}>
        {loading ? (
          <p>Processando arquivo...</p>
        ) : (
          <>
            <p>Arraste um arquivo CSV aqui</p>
            <span>ou clique para selecionar</span>
          </>
        )}
      </div>
    </div>
    </>
  );
}