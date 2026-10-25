"""
Notes model — Google Keep inspired with Obsidian-style linking.

Design decisions:
- content stored as raw markdown text (never HTML to avoid XSS)
- content_type allows future expansion (checklist items stored inline as GFM)
- NoteLink is a separate table — backlinks are reverse FK queries on target_note
- GIN full-text index added via migration (not model field) for performance
"""
import uuid
from django.db import models
from django.contrib.auth import get_user_model
from apps.projects.models import Project
from apps.tags.models import Tag

User = get_user_model()


class Note(models.Model):
    COLOR_CHOICES = [
        ("default", "Default"),
        ("red", "Red"), ("orange", "Orange"), ("yellow", "Yellow"),
        ("green", "Green"), ("teal", "Teal"), ("blue", "Blue"),
        ("purple", "Purple"), ("pink", "Pink"), ("gray", "Gray"),
    ]
    CONTENT_TYPE_CHOICES = [
        ("markdown", "Markdown"),
        ("plain", "Plain Text"),
        ("checklist", "Checklist"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notes")
    project = models.ForeignKey(
        Project,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notes",
    )

    title = models.CharField(max_length=500, blank=True, default="")
    content = models.TextField(blank=True, default="")
    content_type = models.CharField(
        max_length=20,
        choices=CONTENT_TYPE_CHOICES,
        default="markdown",
    )

    # Visual / UX
    color = models.CharField(max_length=20, choices=COLOR_CHOICES, default="default")
    is_pinned = models.BooleanField(default=False)
    is_archived = models.BooleanField(default=False)

    # Optional reminder
    reminder_at = models.DateTimeField(null=True, blank=True)

    # Organization
    sort_order = models.IntegerField(default=0)

    # Tags (M2M)
    tags = models.ManyToManyField(Tag, blank=True, related_name="notes")

    # Linked tasks
    tasks = models.ManyToManyField(
        "tasks.Task",
        blank=True,
        related_name="linked_notes",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "notes"
        ordering = ["-is_pinned", "-updated_at"]
        indexes = [
            models.Index(fields=["user", "is_archived", "is_pinned"]),
            models.Index(fields=["user", "updated_at"]),
        ]

    def __str__(self):
        return self.title or f"Note {self.id}"

    @property
    def backlink_count(self):
        if hasattr(self, "_backlink_count"):
            return self._backlink_count
        return self.incoming_links.count()

    @backlink_count.setter
    def backlink_count(self, value):
        self._backlink_count = value

    @property
    def outgoing_link_count(self):
        if hasattr(self, "_outgoing_link_count"):
            return self._outgoing_link_count
        return self.outgoing_links.count()

    @outgoing_link_count.setter
    def outgoing_link_count(self, value):
        self._outgoing_link_count = value


class NoteLink(models.Model):
    """
    Represents an [[internal link]] from one note to another.

    When note content is saved, we parse all [[Title]] patterns and
    upsert NoteLink records. Orphaned links (target deleted or renamed)
    are soft-handled by retaining the record with a null target or
    by searching for the new title on next parse.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    source_note = models.ForeignKey(
        Note,
        on_delete=models.CASCADE,
        related_name="outgoing_links",
    )
    target_note = models.ForeignKey(
        Note,
        on_delete=models.SET_NULL,  # Keep link record even if target deleted
        null=True,
        blank=True,
        related_name="incoming_links",
    )
    # The raw text used in [[alias|title]] syntax
    alias = models.CharField(max_length=255, blank=True, default="")
    # The title string that was used to look up the target (for re-resolution)
    target_title = models.CharField(max_length=500, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "note_links"
        unique_together = [("source_note", "target_note")]
        indexes = [
            models.Index(fields=["source_note"]),
            models.Index(fields=["target_note"]),
        ]

    def __str__(self):
        return f"{self.source_note} → {self.target_note}"
