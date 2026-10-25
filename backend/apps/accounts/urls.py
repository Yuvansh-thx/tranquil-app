"""URL patterns for accounts/auth endpoints."""
from django.urls import path
from . import views

urlpatterns = [
    path("register/", views.register_view, name="auth-register"),
    path("login/", views.login_view, name="auth-login"),
    path("logout/", views.logout_view, name="auth-logout"),
    path("refresh/", views.refresh_view, name="auth-refresh"),
    path("me/", views.me_view, name="auth-me"),
    path("settings/", views.UserSettingsView.as_view(), name="auth-settings"),
    path("change-password/", views.change_password_view, name="auth-change-password"),
]
