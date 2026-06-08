from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.responses import error_response


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_name)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(api_router, prefix="/api/v1")
    app.add_exception_handler(HTTPException, http_exception_handler)
    return app


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    detail = exc.detail

    if isinstance(detail, dict):
        code = detail.get("code", "INVALID_INPUT")
        message = detail.get("message", "Request failed.")
    else:
        code = "INVALID_INPUT"
        message = str(detail)

    return JSONResponse(
        status_code=exc.status_code,
        content=error_response(code, message),
    )


app = create_app()
