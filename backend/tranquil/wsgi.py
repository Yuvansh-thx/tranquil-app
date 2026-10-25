"""WSGI application entry point."""
import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "tranquil.settings.development")
application = get_wsgi_application()
