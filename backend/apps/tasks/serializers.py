"""Tasks serializers."""
from django.utils import timezone
from rest_framework import serializers
from apps.tags.models import Tag
from apps.tags.serializers import TagSerializer
from .models import Task


class SubtaskSerializer(serializers.ModelSerializer):
    """Lightweight subtask representation."""
    class Meta:
        model = Task
        fields = ["id", "title", "status", "priority", "due_date", "sort_order"]
        read_only_fields = ["id"]


class TaskSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Tag.objects.all(),
        write_only=True,
        required=False,
        source="tags",
    )
    subtasks = SubtaskSerializer(many=True, read_only=True)
    subtask_count = serializers.IntegerField(read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    is_due_today = serializers.BooleanField(read_only=True)

    class Meta:
        model = Task
        fields = [
            "id", "project", "parent_task",
            "title", "description", "status", "priority",
            "due_date", "due_time", "start_date",
            "estimated_minutes", "actual_minutes",
            "completed_at", "is_inbox", "sort_order",
            "recurrence_rule",
            "tags", "tag_ids",
            "subtasks", "subtask_count",
            "is_overdue", "is_due_today",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "actual_minutes", "completed_at",
            "created_at", "updated_at",
            "subtasks", "subtask_count", "is_overdue", "is_due_today",
        ]

    def validate_parent_task(self, value):
        """Parent task must belong to the same user."""
        if value and value.user != self.context["request"].user:
            raise serializers.ValidationError("Parent task not found.")
        return value

    def validate_project(self, value):
        """Project must belong to the same user."""
        if value and value.user != self.context["request"].user:
            raise serializers.ValidationError("Project not found.")
        return value

    def create(self, validated_data):
        tags = validated_data.pop("tags", [])
        # Auto-clear inbox flag when a project is assigned
        if validated_data.get("project"):
            validated_data.setdefault("is_inbox", False)
        task = Task.objects.create(user=self.context["request"].user, **validated_data)
        if tags:
            task.tags.set(tags)
        return task

    def update(self, instance, validated_data):
        tags = validated_data.pop("tags", None)
        if validated_data.get("project") and instance.is_inbox:
            validated_data["is_inbox"] = False
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if tags is not None:
            instance.tags.set(tags)
        return instance


class TaskListSerializer(serializers.ModelSerializer):
    """Rich serializer for list views."""
    tags = TagSerializer(many=True, read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    is_due_today = serializers.BooleanField(read_only=True)
    subtask_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Task
        fields = [
            "id", "title", "description", "status", "priority",
            "due_date", "due_time", "project", "is_inbox",
            "is_overdue", "is_due_today", "tags",
            "estimated_minutes", "actual_minutes",
            "subtask_count", "sort_order",
        ]
