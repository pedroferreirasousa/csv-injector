import os
import pandas as pd
import csv
from io import StringIO
from app.core.config import settings

STORAGE_DIR = settings.storage_dir


class CSVProcessor:
    @staticmethod
    def detect_delimiter(file_content: str) -> str:
        try:
            sample = "\n".join(file_content.split("\n")[:5])
            sniffer = csv.Sniffer()
            dialect = sniffer.sniff(sample, delimiters=[',', ';', '\t'])
            return dialect.delimiter
        except Exception:
            return ','

    @classmethod
    def load_to_dataframe(cls, file_bytes: bytes) -> pd.DataFrame:
        content_str = file_bytes.decode('utf-8', errors='ignore')
        delimiter = cls.detect_delimiter(content_str)
        df = pd.read_csv(StringIO(content_str), sep=delimiter)
        return df


def parse_csv_metadata(contents: bytes, filename: str) -> dict:
    temp_path = os.path.join(STORAGE_DIR, filename)
    with open(temp_path, "wb") as f:
        f.write(contents)

    df = CSVProcessor.load_to_dataframe(contents)
    df_clean = df.fillna("")

    return {
        "filename": filename,
        "columns": list(df.columns),
        "total_rows": len(df),
        "sample_data": df_clean.head(5).to_dict(orient="records"),
    }