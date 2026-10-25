"""Analytics URL patterns."""
from django.urls import path
from . import views

urlpatterns = [
    path("overview/", views.overview, name="analytics-overview"),
    path("tasks/", views.task_analytics, name="analytics-tasks"),
    path("focus/", views.focus_analytics, name="analytics-focus"),
]
