"""
FocusSession model — Pomodoro session recording.

Design decisions:
- Timer state is managed client-side (Zustand store) for responsiveness
- Sessions are recorded to the backend when they complete or are interrupted
- actual_duration_seconds reflects wall-clock time (not planned duration)
- session_number_in_cycle tracks position in the 4-work-sessions-then-long-break cycle
- A user cannot have two 'active' sessions simultaneously (enforced via constraint)
"""
import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class FocusSession(models.Model):
    SESSION_TYPE_CHOICES = [
        ("work", "Work"),
        ("short_break", "Short Break"),
        ("long_break", "Long Break"),
    ]
    STATUS_CHOICES = [
        ("active", "Active"),
        ("completed", "Completed"),
        ("interrupted", "Interrupted"),
        ("abandoned", "Abandoned"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="focus_sessions")
    task = models.ForeignKey(
        "tasks.Task",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="focus_sessions",
    )

    session_type = models.CharField(max_length=20, choices=SESSION_TYPE_CHOICES, default="work")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")

    planned_duration_seconds = models.PositiveIntegerField()
    actual_duration_seconds = models.PositiveIntegerField(null=True, blank=True)

    started_at = models.DateTimeField()
    ended_at = models.DateTimeField(null=True, blank=True)

    # Position in the current Pomodoro cycle (1-4 for work sessions)
    session_number_in_cycle = models.PositiveSmallIntegerField(default=1)

    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "focus_sessions"
        ordering = ["-started_at"]
        indexes = [
            models.Index(fields=["user", "started_at"]),
            models.Index(fields=["user", "status"]),
            models.Index(fields=["task"]),
        ]
        # A user can only have one active session at a time
        constraints = [
            models.UniqueConstraint(
                fields=["user"],
                condition=models.Q(status="active"),
                name="unique_active_session_per_user",
            )
        ]

    def __str__(self):
        return f"{self.session_type} session [{self.status}] by {self.user.email}"

    def complete(self):
        """Mark session as completed and record actual duration."""
        from django.utils import timezone
        self.status = "completed"
        self.ended_at = timezone.now()
        self.actual_duration_seconds = int(
            (self.ended_at - self.started_at).total_seconds()
        )
        self.save(update_fields=["status", "ended_at", "actual_duration_seconds"])

        # Update associated task's actual_minutes
        if self.task and self.session_type == "work":
            from django.db.models import F
            self.task.__class__.objects.filter(id=self.task_id).update(
                actual_minutes=F("actual_minutes") + round(self.actual_duration_seconds / 60)
            )

    def interrupt(self):
        """Mark as interrupted (user paused and abandoned)."""
        from django.utils import timezone
        self.status = "interrupted"
        self.ended_at = timezone.now()
        self.actual_duration_seconds = int(
            (self.ended_at - self.started_at).total_seconds()
        )
        self.save(update_fields=["status", "ended_at", "actual_duration_seconds"])
