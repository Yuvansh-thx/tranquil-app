"""Projects serializers."""
from rest_framework import serializers
from .models import Project


class ProjectSerializer(serializers.ModelSerializer):
    task_count = serializers.IntegerField(read_only=True)
    color = serializers.CharField(max_length=20, required=False, default="blue", allow_blank=True)

    class Meta:
        model = Project
        fields = [
            "id", "name", "description", "color", "icon",
            "is_archived", "sort_order", "task_count",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "task_count"]

    def create(self, validated_data):
        user = validated_data.pop("user", None)
        if not user and "request" in self.context:
            user = self.context["request"].user
        return Project.objects.create(user=user, **validated_data)



class ProjectListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for sidebar/lists."""
    task_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Project
        fields = ["id", "name", "color", "icon", "is_archived", "task_count", "sort_order"]
