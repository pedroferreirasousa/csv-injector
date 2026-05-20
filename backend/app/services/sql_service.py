import os
from fastapi import HTTPException, status
from app.core.csv_parser import CSVProcessor, STORAGE_DIR
from app.schemas.sql_schema import SQLGenerationRequest, SQLGenerationResponse


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

            columns_sql = ", ".join(f"{quote}{m.db_name}{quote}" for m in mappings)
            sql_lines = []

            for row in rows:
                values_list = []
                for m in mappings:
                    val = row.get(m.csv_name, "")
                    if val == "" or val is None:
                        values_list.append("NULL")
                    elif any(
                        t in m.db_type.lower()
                        for t in ("int", "decimal", "numeric", "float")
                    ):
                        clean_num = str(val).replace(",", ".").strip()
                        try:
                            values_list.append(
                                str(float(clean_num) if "." in clean_num else int(clean_num))
                            )
                        except ValueError:
                            values_list.append(f"'{str(val).replace(chr(39), chr(39) * 2)}'")
                    else:
                        clean_val = str(val).replace("'", "''")
                        values_list.append(f"'{clean_val}'")

                values_str = ", ".join(values_list)
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
