from fastapi import UploadFile, HTTPException, status
from app.core.csv_parser import parse_csv_metadata
from app.schemas.csv_schema import CSVUploadResponse


class CSVService:
    @staticmethod
    async def process_upload(file: UploadFile) -> CSVUploadResponse:
        if not file.filename.endswith(".csv"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="O arquivo enviado deve ser um CSV válido.",
            )
        try:
            contents = await file.read()
            metadata = parse_csv_metadata(contents, file.filename)
            return CSVUploadResponse(**metadata)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Erro ao processar o arquivo CSV: {str(e)}",
            )
