"""Projects model."""
import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Project(models.Model):
    """A container for organizing related tasks and notes."""
    COLOR_CHOICES = [
        ("slate", "Slate"), ("red", "Red"), ("orange", "Orange"),
        ("amber", "Amber"), ("yellow", "Yellow"), ("lime", "Lime"),
        ("green", "Green"), ("teal", "Teal"), ("cyan", "Cyan"),
        ("sky", "Sky"), ("blue", "Blue"), ("indigo", "Indigo"),
        ("violet", "Violet"), ("purple", "Purple"), ("fuchsia", "Fuchsia"),
        ("pink", "Pink"), ("rose", "Rose"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="projects")
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    color = models.CharField(max_length=20, default="indigo", choices=COLOR_CHOICES)
    icon = models.CharField(max_length=50, default="folder")
    is_archived = models.BooleanField(default=False)
    sort_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "projects"
        ordering = ["sort_order", "name"]
        indexes = [
            models.Index(fields=["user", "is_archived"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.user.email})"

    @property
    def task_count(self):
        return self.tasks.filter(status__in=["todo", "in_progress"]).count()
