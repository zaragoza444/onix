from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Onix API"
    debug: bool = False
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    database_url: str = "sqlite:///./onix.db"
    jwt_secret: str = "change-me-in-production-use-openssl-rand"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7

    # API receiver / sender (production)
    api_environment: str = "production"
    api_sender_timeout_seconds: float = 30.0
    api_sender_max_body_bytes: int = 1_048_576
    api_receiver_max_body_bytes: int = 1_048_576
    api_webhook_secret_header: str = "X-Onix-Webhook-Secret"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
