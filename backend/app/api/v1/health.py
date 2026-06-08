from fastapi import APIRouter, HTTPException, status

from app.core.database import check_database_connection
from app.core.responses import success_response


router = APIRouter()


@router.get("")
def health_check():
    return success_response({"status": "ok"})


@router.get("/db")
def database_health_check():
    if not check_database_connection():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "DATABASE_UNAVAILABLE",
                "message": "Database connection failed.",
            },
        )

    return success_response({"database": "ok"})
