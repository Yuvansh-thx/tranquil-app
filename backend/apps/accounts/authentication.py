"""
Custom JWT authentication using HttpOnly cookies.

Why cookies instead of Authorization headers?
- HttpOnly cookies are inaccessible to JavaScript → prevents XSS token theft
- Automatically sent by browser → no manual token storage/management
- SameSite=Lax provides CSRF protection for cross-origin requests
"""
import logging
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework.exceptions import AuthenticationFailed
from django.conf import settings

logger = logging.getLogger(__name__)


class CookieJWTAuthentication(JWTAuthentication):
    """
    Authenticates requests using JWT stored in HttpOnly cookies.
    Falls back to Authorization header for API clients / testing.
    """

    def authenticate(self, request):
        # 1. Try cookie first
        raw_token = request.COOKIES.get(settings.JWT_AUTH_COOKIE)

        if raw_token is None:
            # 2. Fall back to Authorization: Bearer <token>
            return super().authenticate(request)

        try:
            validated_token = self.get_validated_token(raw_token)
        except (InvalidToken, TokenError) as e:
            logger.debug("JWT cookie validation failed: %s", e)
            raise AuthenticationFailed("Token is invalid or expired.") from e

        try:
            user = self.get_user(validated_token)
        except AuthenticationFailed:
            raise

        return user, validated_token
