from fastapi import APIRouter, UploadFile, File, status
from app.services.csv_service import CSVService
from app.schemas.csv_schema import CSVUploadResponse

router = APIRouter()


@router.post("/upload-csv", response_model=CSVUploadResponse, status_code=status.HTTP_200_OK)
async def upload_csv(file: UploadFile = File(...)):
    return await CSVService.process_upload(file)