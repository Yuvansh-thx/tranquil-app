"""Tasks views — CRUD, filtering, completion, subtasks."""
import logging
from django.utils import timezone
from django.db.models import Count, Q
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
import django_filters

from .models import Task
from .serializers import TaskSerializer, TaskListSerializer

logger = logging.getLogger(__name__)


class TaskFilter(django_filters.FilterSet):
    status = django_filters.MultipleChoiceFilter(choices=Task.STATUS_CHOICES)
    priority = django_filters.MultipleChoiceFilter(choices=Task.PRIORITY_CHOICES)
    project = django_filters.UUIDFilter(field_name="project__id")
    no_project = django_filters.BooleanFilter(field_name="project", lookup_expr="isnull")
    due_before = django_filters.DateFilter(field_name="due_date", lookup_expr="lte")
    due_after = django_filters.DateFilter(field_name="due_date", lookup_expr="gte")
    due_today = django_filters.BooleanFilter(method="filter_due_today")
    overdue = django_filters.BooleanFilter(method="filter_overdue")
    is_inbox = django_filters.BooleanFilter()
    parent_task = django_filters.UUIDFilter(field_name="parent_task__id")
    no_parent = django_filters.BooleanFilter(field_name="parent_task", lookup_expr="isnull")
    tag = django_filters.UUIDFilter(field_name="tags__id")

    class Meta:
        model = Task
        fields = ["status", "priority", "project", "is_inbox"]

    def filter_due_today(self, queryset, name, value):
        today = timezone.now().date()
        if value:
            return queryset.filter(due_date=today)
        return queryset.exclude(due_date=today)

    def filter_overdue(self, queryset, name, value):
        today = timezone.now().date()
        if value:
            return queryset.filter(
                due_date__lt=today,
                status__in=["todo", "in_progress"],
            )
        return queryset


class TaskViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = TaskFilter
    search_fields = ["title", "description"]
    ordering_fields = ["due_date", "priority", "created_at", "sort_order", "title"]
    ordering = ["sort_order", "-created_at"]

    def get_queryset(self):
        return (
            Task.objects.filter(user=self.request.user)
            .select_related("project", "parent_task")
            .prefetch_related("tags", "subtasks")
            .annotate(
                subtask_count=Count("subtasks", filter=Q(subtasks__status__in=["todo", "in_progress"]))
            )
        )

    def get_serializer_class(self):
        if self.action == "list":
            return TaskListSerializer
        return TaskSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    # --- Custom actions ---

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        """Mark a task as done."""
        task = self.get_object()
        if task.status == "done":
            return Response({"detail": "Task is already completed."}, status=status.HTTP_400_BAD_REQUEST)
        task.complete()
        return Response(TaskSerializer(task, context={"request": request}).data)

    @action(detail=True, methods=["post"])
    def reopen(self, request, pk=None):
        """Reopen a completed task."""
        task = self.get_object()
        task.reopen()
        return Response(TaskSerializer(task, context={"request": request}).data)

    @action(detail=True, methods=["post"])
    def archive(self, request, pk=None):
        """Archive a task."""
        task = self.get_object()
        task.status = "archived"
        task.save(update_fields=["status", "updated_at"])
        return Response({"status": "archived"})

    @action(detail=True, methods=["post"])
    def move(self, request, pk=None):
        """Move task to a different project or inbox."""
        task = self.get_object()
        project_id = request.data.get("project_id")
        to_inbox = request.data.get("to_inbox", False)

        if to_inbox:
            task.project = None
            task.is_inbox = True
        elif project_id:
            from apps.projects.models import Project
            try:
                project = Project.objects.get(id=project_id, user=request.user)
                task.project = project
                task.is_inbox = False
            except Project.DoesNotExist:
                return Response({"detail": "Project not found."}, status=status.HTTP_404_NOT_FOUND)

        task.save(update_fields=["project", "is_inbox", "updated_at"])
        return Response(TaskSerializer(task, context={"request": request}).data)

    @action(detail=False, methods=["get"])
    def today(self, request):
        """Tasks due today or explicitly scheduled for today."""
        today = timezone.now().date()
        tasks = self.get_queryset().filter(
            Q(due_date=today) | Q(start_date=today),
            status__in=["todo", "in_progress"],
        )
        page = self.paginate_queryset(tasks)
        if page is not None:
            serializer = TaskListSerializer(page, many=True, context={"request": request})
            return self.get_paginated_response(serializer.data)
        return Response(TaskListSerializer(tasks, many=True, context={"request": request}).data)

    @action(detail=False, methods=["get"])
    def upcoming(self, request):
        """Future tasks ordered by due date."""
        today = timezone.now().date()
        tasks = self.get_queryset().filter(
            due_date__gt=today,
            status__in=["todo", "in_progress"],
        ).order_by("due_date", "priority")
        page = self.paginate_queryset(tasks)
        if page is not None:
            serializer = TaskListSerializer(page, many=True, context={"request": request})
            return self.get_paginated_response(serializer.data)
        return Response(TaskListSerializer(tasks, many=True, context={"request": request}).data)

    @action(detail=False, methods=["get"])
    def overdue(self, request):
        """Tasks past their due date."""
        today = timezone.now().date()
        tasks = self.get_queryset().filter(
            due_date__lt=today,
            status__in=["todo", "in_progress"],
        ).order_by("due_date")
        page = self.paginate_queryset(tasks)
        if page is not None:
            serializer = TaskListSerializer(page, many=True, context={"request": request})
            return self.get_paginated_response(serializer.data)
        return Response(TaskListSerializer(tasks, many=True, context={"request": request}).data)
