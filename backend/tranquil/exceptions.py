"""Custom exception handler — sanitizes error responses for production."""
import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Wraps DRF's default exception handler to:
    - Return consistent {error, detail} JSON shapes
    - Log server errors
    - Never expose stack traces in responses
    """
    response = exception_handler(exc, context)

    if response is not None:
        # Normalize error shape
        data = response.data
        if isinstance(data, dict) and "detail" not in data:
            response.data = {"detail": data}
        elif not isinstance(data, dict):
            response.data = {"detail": data}
        return response

    # Unhandled exception — log and return 500
    logger.exception("Unhandled exception in API view: %s", exc)
    return Response(
        {"detail": "An unexpected error occurred. Please try again."},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
