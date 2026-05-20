from fastapi import APIRouter, UploadFile, File, HTTPException, status
from app.core.csv_parser import parse_csv_metadata  # Importa sua lógica existente

router = APIRouter()

@router.post("/upload-csv", status_code=status.HTTP_200_OK)
async def upload_csv(file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O arquivo enviado deve ser um CSV válido."
        )
    try:
        contents = await file.read()
        
        metadata = parse_csv_metadata(contents, file.filename)
        
        return metadata
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao processar o arquivo CSV: {str(e)}"
        )