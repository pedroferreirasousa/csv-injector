from pydantic import BaseModel
from typing import List, Dict, Any


class CSVUploadResponse(BaseModel):
    filename: str
    columns: List[str]
    total_rows: int
    sample_data: List[Dict[str, Any]]
