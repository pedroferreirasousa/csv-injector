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
          <DatabaseIcon size={16} />
          <span>CSV Injector</span>
        </div>
      </nav>
      <main className={styles.main}>
        {!csvData ? (
          <DragDropZone onUploadSuccess={(data) => setCsvData(data)} />
        ) : (
          <MappingTable data={csvData} onCancel={() => setCsvData(null)} />
        )}
      </main>
    </div>
  );
}