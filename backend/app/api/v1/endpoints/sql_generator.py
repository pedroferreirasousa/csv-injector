from fastapi import APIRouter, status
from app.services.sql_service import SQLService
from app.schemas.sql_schema import SQLGenerationRequest, SQLGenerationResponse

router = APIRouter()


@router.post("/generate-sql", response_model=SQLGenerationResponse, status_code=status.HTTP_200_OK)
async def generate_sql(payload: SQLGenerationRequest):
    return SQLService.generate_script(payload)