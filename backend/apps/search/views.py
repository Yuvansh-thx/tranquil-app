"""
Unified search across tasks and notes using PostgreSQL full-text search.

Uses Django's SearchVector/SearchQuery for ranked results.
Falls back to icontains for short queries.
"""
from django.contrib.postgres.search import SearchVector, SearchQuery, SearchRank
from django.db.models import Q, Value, CharField
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.tasks.models import Task
from apps.notes.models import Note


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def search(request):
    """
    Search tasks and notes.
    Query params:
      q: search string (required, min 2 chars)
      type: 'tasks' | 'notes' | 'all' (default: 'all')
      limit: max results per type (default: 10)
    """
    query_str = request.query_params.get("q", "").strip()
    result_type = request.query_params.get("type", "all")
    limit = min(int(request.query_params.get("limit", 10)), 50)

    if len(query_str) < 2:
        return Response({"tasks": [], "notes": [], "query": query_str})

    results = {"query": query_str, "tasks": [], "notes": []}

    if result_type in ("all", "tasks"):
        tasks = Task.objects.filter(
            user=request.user,
            status__in=["todo", "in_progress", "done"],
        ).filter(
            Q(title__icontains=query_str) | Q(description__icontains=query_str)
        ).select_related("project")[:limit]

        results["tasks"] = [
            {
                "id": str(t.id),
                "type": "task",
                "title": t.title,
                "status": t.status,
                "priority": t.priority,
                "due_date": t.due_date,
                "project_name": t.project.name if t.project else None,
            }
            for t in tasks
        ]

    if result_type in ("all", "notes"):
        notes = Note.objects.filter(
            user=request.user,
            is_archived=False,
        ).filter(
            Q(title__icontains=query_str) | Q(content__icontains=query_str)
        )[:limit]

        results["notes"] = [
            {
                "id": str(n.id),
                "type": "note",
                "title": n.title or "Untitled",
                "color": n.color,
                "updated_at": n.updated_at,
            }
            for n in notes
        ]

    return Response(results)
