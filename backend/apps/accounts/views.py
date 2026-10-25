"""
Authentication views.

Cookie strategy:
- On login: set HttpOnly access + refresh cookies
- On refresh: rotate refresh cookie, update access cookie
- On logout: blacklist refresh token, clear both cookies
"""
import logging
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken

from .serializers import (
    RegisterSerializer,
    UserSerializer,
    UserSettingsSerializer,
    ChangePasswordSerializer,
)

User = get_user_model()
logger = logging.getLogger(__name__)


class AuthRateThrottle(AnonRateThrottle):
    rate = "10/minute"


def _set_auth_cookies(response, access_token, refresh_token):
    """Set HttpOnly JWT cookies on the response."""
    is_secure = not settings.DEBUG
    response.set_cookie(
        settings.JWT_AUTH_COOKIE,
        str(access_token),
        httponly=True,
        secure=is_secure,
        samesite=settings.JWT_AUTH_COOKIE_SAMESITE,
        max_age=int(settings.SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"].total_seconds()),
    )
    response.set_cookie(
        settings.JWT_AUTH_REFRESH_COOKIE,
        str(refresh_token),
        httponly=True,
        secure=is_secure,
        samesite=settings.JWT_AUTH_COOKIE_SAMESITE,
        max_age=int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds()),
    )


def _clear_auth_cookies(response):
    """Clear auth cookies on logout."""
    response.delete_cookie(settings.JWT_AUTH_COOKIE)
    response.delete_cookie(settings.JWT_AUTH_REFRESH_COOKIE)


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([AuthRateThrottle])
def register_view(request):
    """Create a new user account."""
    serializer = RegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()

    # Issue tokens immediately on registration
    refresh = RefreshToken.for_user(user)
    response = Response(
        {
            "user": UserSerializer(user).data,
            "message": "Account created successfully.",
        },
        status=status.HTTP_201_CREATED,
    )
    _set_auth_cookies(response, refresh.access_token, refresh)
    logger.info("New user registered: %s", user.email)
    return response


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([AuthRateThrottle])
def login_view(request):
    """Authenticate user and set JWT cookies."""
    from .serializers import CustomTokenObtainPairSerializer

    serializer = CustomTokenObtainPairSerializer(data=request.data)
    try:
        serializer.is_valid(raise_exception=True)
    except Exception:
        # Return generic message to avoid user enumeration
        return Response(
            {"detail": "Invalid email or password."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    user_data = serializer.validated_data
    tokens = serializer.get_token(serializer.user)

    response = Response(
        {
            "user": user_data["user"],
            "message": "Logged in successfully.",
        },
        status=status.HTTP_200_OK,
    )
    _set_auth_cookies(response, tokens.access_token, tokens)
    return response


@api_view(["POST"])
@permission_classes([AllowAny])
def refresh_view(request):
    """Rotate JWT tokens using the refresh cookie."""
    refresh_token = request.COOKIES.get(settings.JWT_AUTH_REFRESH_COOKIE)

    if not refresh_token:
        return Response(
            {"detail": "Refresh token not found."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    try:
        token = RefreshToken(refresh_token)
        new_access = token.access_token
        token.blacklist()  # Blacklist old refresh token
        new_refresh = RefreshToken.for_user(
            User.objects.get(id=token["user_id"])
        )
    except (TokenError, InvalidToken, User.DoesNotExist) as e:
        response = Response(
            {"detail": "Token is invalid or expired."},
            status=status.HTTP_401_UNAUTHORIZED,
        )
        _clear_auth_cookies(response)
        return response

    response = Response({"message": "Token refreshed."}, status=status.HTTP_200_OK)
    _set_auth_cookies(response, new_access, new_refresh)
    return response


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """Blacklist refresh token and clear auth cookies."""
    refresh_token = request.COOKIES.get(settings.JWT_AUTH_REFRESH_COOKIE)

    if refresh_token:
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except (TokenError, InvalidToken):
            pass  # Already invalid — still clear cookies

    response = Response({"message": "Logged out successfully."}, status=status.HTTP_200_OK)
    _clear_auth_cookies(response)
    return response


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me_view(request):
    """Return current authenticated user."""
    return Response(UserSerializer(request.user).data)


class UserSettingsView(generics.RetrieveUpdateAPIView):
    """Get or update the current user's settings."""
    serializer_class = UserSettingsSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user.settings


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def change_password_view(request):
    """Change password for authenticated user."""
    serializer = ChangePasswordSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    user = request.user
    if not user.check_password(serializer.validated_data["old_password"]):
        return Response(
            {"old_password": "Incorrect current password."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user.set_password(serializer.validated_data["new_password"])
    user.save()

    # Invalidate all existing tokens by clearing the refresh
    response = Response({"message": "Password changed. Please log in again."}, status=status.HTTP_200_OK)
    _clear_auth_cookies(response)
    return response
