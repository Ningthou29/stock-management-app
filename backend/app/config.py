from pydantic_settings import BaseSettings
from pydantic import Field
import os

# Locate .env file in parent directory if it exists
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")

class Settings(BaseSettings):
    supabase_url: str = Field(default="", validation_alias="SUPABASE_URL")
    supabase_key: str = Field(default="", validation_alias="SUPABASE_KEY")
    port: int = Field(default=8000, validation_alias="PORT")
    host: str = Field(default="0.0.0.0", validation_alias="HOST")

    model_config = {
        "env_file": dotenv_path,
        "env_file_encoding": "utf-8",
        "extra": "ignore"
    }

settings = Settings()
