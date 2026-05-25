import os
import re
from decimal import Decimal, ROUND_HALF_UP, InvalidOperation
from datetime import datetime
from fastapi import HTTPException, status
from app.core.csv_parser import CSVProcessor, STORAGE_DIR
from app.schemas.sql_schema import SQLGenerationRequest, SQLGenerationResponse

_PT_MONTHS = {
    "janeiro": "January", "fevereiro": "February", "março": "March", "marco": "March",
    "abril": "April", "maio": "May", "junho": "June",
    "julho": "July", "agosto": "August", "setembro": "September",
    "outubro": "October", "novembro": "November", "dezembro": "December",
}


def _parse_date(val: str, fmt: str, output_fmt: str = "%Y-%m-%d") -> str:
    normalized = val.lower()
    for pt, en in _PT_MONTHS.items():
        normalized = normalized.replace(pt, en)
    try:
        return datetime.strptime(normalized, fmt).strftime(output_fmt)
    except ValueError:
        return val


def _get_decimal_scale(db_type: str) -> int | None:
    """Extract scale from DECIMAL(precision,scale) or NUMERIC(precision,scale)."""
    match = re.search(r'\(\s*\d+\s*,\s*(\d+)\s*\)', db_type, re.IGNORECASE)
    if match:
        return int(match.group(1))
    return None


def _format_decimal(val_str: str, db_type: str) -> str:
    clean = val_str.replace(",", ".")
    try:
        d = Decimal(clean)
    except InvalidOperation:
        return f"'{val_str.replace(chr(39), chr(39)*2)}'"

    scale = _get_decimal_scale(db_type)
    if scale is not None:
        quantize_str = "1" if scale == 0 else f"0.{'0' * scale}"
        d = d.quantize(Decimal(quantize_str), rounding=ROUND_HALF_UP)
        return str(d)

    return str(d)


class SQLService:

    @staticmethod
    def generate_script(payload: SQLGenerationRequest) -> SQLGenerationResponse:
        temp_path = os.path.join(STORAGE_DIR, payload.filename)

        if not os.path.exists(temp_path):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Arquivo temporário expirou. Faça o upload novamente.",
            )

        try:
            with open(temp_path, "rb") as f:
                contents = f.read()

            df = CSVProcessor.load_to_dataframe(contents)
            df_clean = df.fillna("")
            rows = df_clean.to_dict(orient="records")

            quote = "`" if payload.dialect == "mysql" else '"'
            table = payload.custom_table_name.strip()
            mappings = payload.mappings

            seen_db_names = set()
            unique_active_cols = []
            for m in mappings:
                if m.db_name not in seen_db_names:
                    seen_db_names.add(m.db_name)
                    unique_active_cols.append(m)

            columns_sql = ", ".join(f"{quote}{m.db_name}{quote}" for m in unique_active_cols)
            sql_lines = []

            for row in rows:
                values_list = []
                for m in unique_active_cols:
                    val = row.get(m.csv_name, "")

                    if val == "" or val is None:
                        values_list.append("NULL")
                        continue

                    val_str = str(val).strip()

                    if m.value_mappings:
                        matched = False
                        for rule in m.value_mappings:
                            if val_str.upper() == rule.when_value.strip().upper():
                                values_list.append(rule.then_value.strip())
                                matched = True
                                break
                        if matched:
                            continue
                        else:
                            tipo_coluna = m.db_type.lower()
                            if any(t in tipo_coluna for t in ("tinyint", "int", "bool", "bit")):
                                values_list.append(val_str if val_str.isdigit() else "0")
                            else:
                                values_list.append(f"'{val_str.replace(chr(39), chr(39) * 2)}'")
                            continue
                    tipo_coluna = m.db_type.lower()
                    if any(t in tipo_coluna for t in ("tinyint", "int", "bool", "bit")):
                        if val_str.upper() in ["Y", "YES", "TRUE", "S", "SIM"]:
                            values_list.append("1")
                        elif val_str.upper() in ["N", "NO", "FALSE", "NÃO", "NAO"]:
                            values_list.append("0")
                        else:
                            values_list.append(val_str if val_str.isdigit() else "0")

                    elif any(t in tipo_coluna for t in ("decimal", "numeric", "float")):
                        values_list.append(_format_decimal(val_str, m.db_type))
                    elif tipo_coluna in ("date", "timestamp", "datetime"):
                        if m.date_format:
                            output_fmt = m.date_output_format or "%Y-%m-%d"
                            values_list.append(f"'{_parse_date(val_str, m.date_format, output_fmt)}'")
                        else:
                            values_list.append(f"'{val_str.replace(chr(39), chr(39) * 2)}'") 
                    else:
                        clean_val = val_str.replace("'", "''")
                        values_list.append(f"'{clean_val}'")

                values_str = ", ".join(values_list)
                if columns_sql and values_str:
                    sql_lines.append(
                        f"INSERT INTO {quote}{table}{quote} ({columns_sql}) VALUES ({values_str});"
                    )

            return SQLGenerationResponse(
                sql_script="\n".join(sql_lines),
                total_statements=len(sql_lines),
            )

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Erro ao gerar o script SQL: {str(e)}",
            )