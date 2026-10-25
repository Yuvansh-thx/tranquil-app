"""Projects serializers."""
from rest_framework import serializers
from .models import Project


class ProjectSerializer(serializers.ModelSerializer):
    task_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Project
        fields = [
            "id", "name", "description", "color", "icon",
            "is_archived", "sort_order", "task_count",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "task_count"]


class ProjectListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for sidebar/lists."""
    task_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Project
        fields = ["id", "name", "color", "icon", "is_archived", "task_count", "sort_order"]
