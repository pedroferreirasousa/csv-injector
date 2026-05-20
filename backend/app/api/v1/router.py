from fastapi import APIRouter
from app.api.v1.endpoints import csv_upload, sql_generator

api_router = APIRouter()

api_router.include_router(csv_upload.router, tags=["CSV"])
api_router.include_router(sql_generator.router, tags=["SQL"])
