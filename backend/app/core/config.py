import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "CSV Injector API"
    app_description: str = "API profissional para tratamento de CSVs e geração de scripts SQL."
    app_version: str = "1.0.0"

    allowed_origins: list[str] = ["http://localhost:3000"]

    storage_dir: str = "/tmp" if os.name != "nt" else "C:\\Windows\\Temp"
    max_file_size_mb: int = 10

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
