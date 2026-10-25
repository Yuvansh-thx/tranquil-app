"""API v1 URL routing — all endpoints aggregated here."""
from django.urls import path, include

urlpatterns = [
    path("auth/", include("apps.accounts.urls")),
    path("projects/", include("apps.projects.urls")),
    path("tasks/", include("apps.tasks.urls")),
    path("notes/", include("apps.notes.urls")),
    path("tags/", include("apps.tags.urls")),
    path("focus/", include("apps.focus.urls")),
    path("analytics/", include("apps.analytics.urls")),
    path("search/", include("apps.search.urls")),
]
