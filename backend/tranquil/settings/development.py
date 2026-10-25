"""Development settings — extends base."""
from .base import *  # noqa: F401, F403

DEBUG = True

INSTALLED_APPS += ["django_extensions"]  # noqa: F405

# Relax password validation in development
AUTH_PASSWORD_VALIDATORS = []

# Show all SQL queries in shell
LOGGING["loggers"]["django.db.backends"] = {  # noqa: F405
    "handlers": ["console"],
    "level": "DEBUG",
    "propagate": False,
}
