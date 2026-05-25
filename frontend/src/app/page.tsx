"use client";

import { useState } from "react";
import DragDropZone, { CSVUploadResponse } from "@/components/DragDropZone";
import MappingTable from "@/components/MappingTable";
import { DatabaseIcon } from "@/components/icons";
import styles from "./page.module.scss";

export default function Home() {
  const [csvData, setCsvData] = useState<CSVUploadResponse | null>(null);

  return (
    <div className={styles.wrapper}>
      <nav className={styles.topbar}>
        <div className={styles.brand}>
          <span>CSV Injector</span>
        </div>
      </nav>
      <main className={`${styles.main} ${csvData ? styles.mainMapping : ""}`}>
        <div className={styles.content}>

          {!csvData && (
          <div className={styles.content_name}>
            <h3>Arrumar e transformar CSV em script Insert</h3>
            <p>Arraste o arquivo CSV para a área abaixo, ajuste os mapeamentos e gere o script SQL. <br />Feito para facilitar a inserção de dados em bancos de dados.
            <br />Sintaxes para (MySql e postgresql)</p>
          </div>
          )}
            {!csvData ? (
            <DragDropZone onUploadSuccess={(data) => setCsvData(data)} />
          ) : (
            <MappingTable data={csvData} onCancel={() => setCsvData(null)} />
          )}
          
        </div>
        
      </main>
    </div>
  );
}