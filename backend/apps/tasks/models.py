"""
Tasks model.

Design decisions:
- UUID primary keys throughout
- Self-referential FK for subtasks (parent_task)
- recurrence_rule stored as JSONB for flexibility (RFC 5545 compatible)
- recurrence_parent tracks which template a generated occurrence came from
- status enum: todo → in_progress → done, or archived at any point
- is_inbox: tasks without a project default to inbox
- actual_minutes auto-updated from linked focus sessions
"""
import uuid
from django.db import models
from django.contrib.auth import get_user_model
from apps.projects.models import Project
from apps.tags.models import Tag

User = get_user_model()


class Task(models.Model):
    STATUS_CHOICES = [
        ("todo", "To Do"),
        ("in_progress", "In Progress"),
        ("done", "Done"),
        ("archived", "Archived"),
    ]
    PRIORITY_CHOICES = [
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
        ("urgent", "Urgent"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="tasks")
    project = models.ForeignKey(
        Project,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tasks",
    )
    parent_task = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="subtasks",
    )

    title = models.CharField(max_length=500)
    description = models.TextField(blank=True, default="")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="todo")
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default="medium")

    # Dates
    due_date = models.DateField(null=True, blank=True)
    due_time = models.TimeField(null=True, blank=True)
    start_date = models.DateField(null=True, blank=True)

    # Time tracking
    estimated_minutes = models.PositiveIntegerField(null=True, blank=True)
    actual_minutes = models.PositiveIntegerField(default=0)

    # Completion
    completed_at = models.DateTimeField(null=True, blank=True)

    # Organization
    is_inbox = models.BooleanField(default=True)
    sort_order = models.IntegerField(default=0)

    # Recurrence
    # Example: {"freq": "weekly", "interval": 1, "byday": ["MO", "WE", "FR"]}
    recurrence_rule = models.JSONField(null=True, blank=True)
    # Points to the original recurring task definition
    recurrence_parent = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="recurrence_instances",
    )

    # Tags (M2M)
    tags = models.ManyToManyField(Tag, blank=True, related_name="tasks")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "tasks"
        ordering = ["sort_order", "-created_at"]
        indexes = [
            models.Index(fields=["user", "status"]),
            models.Index(fields=["user", "due_date"]),
            models.Index(fields=["user", "project"]),
            models.Index(fields=["user", "is_inbox"]),
            models.Index(fields=["user", "parent_task"]),
        ]

    def __str__(self):
        return f"[{self.status}] {self.title}"

    def complete(self):
        """Mark task as done with timestamp."""
        from django.utils import timezone
        self.status = "done"
        self.completed_at = timezone.now()
        self.save(update_fields=["status", "completed_at", "updated_at"])

    def reopen(self):
        """Reopen a completed task."""
        self.status = "todo"
        self.completed_at = None
        self.save(update_fields=["status", "completed_at", "updated_at"])

    @property
    def is_overdue(self):
        from django.utils import timezone
        if self.due_date and self.status not in ("done", "archived"):
            return self.due_date < timezone.now().date()
        return False

    @property
    def is_due_today(self):
        from django.utils import timezone
        if self.due_date:
            return self.due_date == timezone.now().date()
        return False
