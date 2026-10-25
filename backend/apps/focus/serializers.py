"""Focus session serializers and views."""
from django.utils import timezone
from rest_framework import serializers, viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
import django_filters

from .models import FocusSession


class FocusSessionSerializer(serializers.ModelSerializer):
    task_title = serializers.CharField(source="task.title", read_only=True)
    started_at = serializers.DateTimeField(required=False, default=timezone.now)

    class Meta:
        model = FocusSession
        fields = [
            "id", "task", "task_title",
            "session_type", "status",
            "planned_duration_seconds", "actual_duration_seconds",
            "started_at", "ended_at",
            "session_number_in_cycle", "notes",
            "created_at",
        ]
        read_only_fields = [
            "id", "status", "actual_duration_seconds",
            "ended_at", "created_at",
        ]

    def validate_task(self, value):
        if value and value.user != self.context["request"].user:
            raise serializers.ValidationError("Task not found.")
        return value


class FocusSessionFilter(django_filters.FilterSet):
    session_type = django_filters.ChoiceFilter(choices=FocusSession.SESSION_TYPE_CHOICES)
    status = django_filters.MultipleChoiceFilter(choices=FocusSession.STATUS_CHOICES)
    date_from = django_filters.DateTimeFilter(field_name="started_at", lookup_expr="gte")
    date_to = django_filters.DateTimeFilter(field_name="started_at", lookup_expr="lte")
    task = django_filters.UUIDFilter(field_name="task__id")

    class Meta:
        model = FocusSession
        fields = ["session_type", "status", "task"]


class FocusSessionViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_class = FocusSessionFilter
    ordering_fields = ["started_at", "created_at"]
    ordering = ["-started_at"]
    serializer_class = FocusSessionSerializer

    def get_queryset(self):
        return FocusSession.objects.filter(user=self.request.user).select_related("task")

    @action(detail=False, methods=["post"])
    def start(self, request):
        """Start a new focus session. Prevents duplicate active sessions."""
        # Check for existing active session
        active = FocusSession.objects.filter(
            user=request.user,
            status="active",
        ).first()

        if active:
            return Response(
                {
                    "detail": "You already have an active session.",
                    "session": FocusSessionSerializer(active).data,
                },
                status=status.HTTP_409_CONFLICT,
            )

        serializer = FocusSessionSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        session = serializer.save(
            user=request.user,
            status="active",
            started_at=request.data.get("started_at") or timezone.now(),
        )
        return Response(
            FocusSessionSerializer(session).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        """Mark session as completed."""
        session = self.get_object()
        if session.status != "active":
            return Response(
                {"detail": f"Cannot complete a session with status '{session.status}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        session.complete()
        return Response(FocusSessionSerializer(session).data)

    @action(detail=True, methods=["post"])
    def interrupt(self, request, pk=None):
        """Mark session as interrupted."""
        session = self.get_object()
        if session.status != "active":
            return Response(
                {"detail": f"Cannot interrupt a session with status '{session.status}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        session.interrupt()
        return Response(FocusSessionSerializer(session).data)

    @action(detail=False, methods=["get"])
    def active(self, request):
        """Return the currently active session, if any."""
        session = FocusSession.objects.filter(
            user=request.user,
            status="active",
        ).select_related("task").first()

        if session:
            return Response(FocusSessionSerializer(session).data)
        return Response(None)
