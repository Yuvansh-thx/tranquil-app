"""Tags model — shared across tasks and notes."""
import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Tag(models.Model):
    """User-owned tag. Shared between tasks and notes."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="tags")
    name = models.CharField(max_length=100)
    color = models.CharField(max_length=20, default="#6366f1")  # indigo default
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "tags"
        unique_together = [("user", "name")]
        ordering = ["name"]

    def __str__(self):
        return f"#{self.name} ({self.user.email})"
