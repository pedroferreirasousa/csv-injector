from pydantic import BaseModel
from typing import List, Optional


class ValueMappingSchema(BaseModel):
    when_value: str
    then_value: str


class MappingItem(BaseModel):
    csv_name: str
    db_name: str
    db_type: str
    value_mappings: Optional[List[ValueMappingSchema]] = []


class SQLGenerationRequest(BaseModel):
    filename: str
    custom_table_name: str
    dialect: str
    mappings: List[MappingItem]


class SQLGenerationResponse(BaseModel):
    sql_script: str
    total_statements: int
