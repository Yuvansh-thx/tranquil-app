"""Production settings — extends base."""
from .base import *  # noqa: F401, F403

DEBUG = False

# Security hardening
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"

# JWT cookies must be Secure in production
JWT_AUTH_COOKIE_SAMESITE = "Lax"  # noqa: F811

# Production logging — structured for log aggregators
LOGGING["handlers"]["console"]["formatter"] = "verbose"  # noqa: F405
