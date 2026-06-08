import os
from functools import lru_cache
from typing import List

from dotenv import load_dotenv


load_dotenv()


class Settings:
    app_name = "Dev Reflection Board API"
    database_url = os.getenv(
        "DATABASE_URL",
        "postgresql+pg8000://postgres:postgres@localhost:5432/dev_reflection_board",
    )
    backend_cors_origins = os.getenv(
        "BACKEND_CORS_ORIGINS",
        "http://localhost:5173",
    )

    @property
    def cors_origins(self) -> List[str]:
        return [
            origin.strip()
            for origin in self.backend_cors_origins.split(",")
            if origin.strip()
        ]


@lru_cache
def get_settings() -> Settings:
    return Settings()
