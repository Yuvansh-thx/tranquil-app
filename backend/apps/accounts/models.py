"""
Accounts models: custom User and UserSettings.

Design decisions:
- Extend AbstractUser to add future profile fields cleanly.
- UUID primary keys on UserSettings to keep IDs opaque in URLs.
- UserSettings created automatically via post_save signal.
"""
import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom user model. Inherits from AbstractUser so we get
    all the standard fields (username, email, password, etc.)
    plus can add custom fields without migrations breakage.
    """
    email = models.EmailField(unique=True)

    # Use email as the login identifier
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    class Meta:
        db_table = "users"
        verbose_name = "User"
        verbose_name_plural = "Users"

    def __str__(self):
        return self.email


class UserSettings(models.Model):
    """Per-user application preferences."""
    THEME_CHOICES = [
        ("light", "Light"),
        ("dark", "Dark"),
        ("system", "System"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="settings",
    )
    timezone = models.CharField(max_length=50, default="UTC")
    theme = models.CharField(max_length=20, choices=THEME_CHOICES, default="system")

    # Pomodoro configuration
    pomodoro_work_mins = models.PositiveSmallIntegerField(default=25)
    pomodoro_short_break_mins = models.PositiveSmallIntegerField(default=5)
    pomodoro_long_break_mins = models.PositiveSmallIntegerField(default=15)
    pomodoro_sessions_before_long_break = models.PositiveSmallIntegerField(default=4)
    pomodoro_auto_start_breaks = models.BooleanField(default=False)
    pomodoro_auto_start_work = models.BooleanField(default=False)
    pomodoro_sound_enabled = models.BooleanField(default=True)

    # Layout preferences
    sidebar_collapsed = models.BooleanField(default=False)
    notes_view_mode = models.CharField(max_length=10, default="grid")  # grid | list

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "user_settings"
        verbose_name = "User Settings"

    def __str__(self):
        return f"Settings for {self.user.email}"
