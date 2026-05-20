from pydantic import BaseModel
from typing import List


class MappingItem(BaseModel):
    csv_name: str
    db_name: str
    db_type: str


class SQLGenerationRequest(BaseModel):
    filename: str
    custom_table_name: str
    dialect: str
    mappings: List[MappingItem]


class SQLGenerationResponse(BaseModel):
    sql_script: str
    total_statements: int
