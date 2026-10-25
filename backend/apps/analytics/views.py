"""
Analytics views — all metrics calculated from persisted database data.

No fake scores. No vanity metrics. All numbers are derived from actual
FocusSessions, Tasks, and completion timestamps.
"""
from datetime import timedelta
from django.utils import timezone
from django.db.models import Count, Sum, Avg, Q, ExpressionWrapper, DurationField
from django.db.models.functions import TruncDate, TruncWeek
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.tasks.models import Task
from apps.focus.models import FocusSession


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def overview(request):
    """Dashboard summary — today's snapshot."""
    user = request.user
    today = timezone.now().date()
    week_start = today - timedelta(days=today.weekday())

    tasks_due_today = Task.objects.filter(
        user=user,
        due_date=today,
        status__in=["todo", "in_progress"],
    ).count()

    tasks_overdue = Task.objects.filter(
        user=user,
        due_date__lt=today,
        status__in=["todo", "in_progress"],
    ).count()

    tasks_completed_today = Task.objects.filter(
        user=user,
        completed_at__date=today,
    ).count()

    tasks_completed_this_week = Task.objects.filter(
        user=user,
        completed_at__date__gte=week_start,
    ).count()

    # Focus stats for today
    today_sessions = FocusSession.objects.filter(
        user=user,
        session_type="work",
        started_at__date=today,
    )
    focus_sessions_today = today_sessions.filter(status="completed").count()
    focus_minutes_today = (
        today_sessions.filter(status="completed")
        .aggregate(total=Sum("actual_duration_seconds"))["total"] or 0
    ) // 60

    # Active session
    active_session = FocusSession.objects.filter(
        user=user, status="active"
    ).select_related("task").first()

    active_session_data = None
    if active_session:
        elapsed = int((timezone.now() - active_session.started_at).total_seconds())
        active_session_data = {
            "id": str(active_session.id),
            "session_type": active_session.session_type,
            "planned_duration_seconds": active_session.planned_duration_seconds,
            "elapsed_seconds": elapsed,
            "task_title": active_session.task.title if active_session.task else None,
        }

    return Response({
        "tasks_due_today": tasks_due_today,
        "tasks_overdue": tasks_overdue,
        "tasks_completed_today": tasks_completed_today,
        "tasks_completed_this_week": tasks_completed_this_week,
        "focus_sessions_today": focus_sessions_today,
        "focus_minutes_today": focus_minutes_today,
        "active_session": active_session_data,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def task_analytics(request):
    """Task completion trends."""
    user = request.user
    days = int(request.query_params.get("days", 14))
    since = timezone.now().date() - timedelta(days=days)

    # Daily completion counts
    daily = (
        Task.objects.filter(user=user, completed_at__date__gte=since)
        .annotate(date=TruncDate("completed_at"))
        .values("date")
        .annotate(count=Count("id"))
        .order_by("date")
    )

    # By priority
    by_priority = (
        Task.objects.filter(user=user, status="done")
        .values("priority")
        .annotate(count=Count("id"))
    )

    # Completion rate (last 30 days)
    total_created = Task.objects.filter(
        user=user,
        created_at__date__gte=timezone.now().date() - timedelta(days=30),
    ).count()
    total_completed = Task.objects.filter(
        user=user,
        completed_at__date__gte=timezone.now().date() - timedelta(days=30),
    ).count()

    completion_rate = round(
        (total_completed / total_created * 100) if total_created > 0 else 0, 1
    )

    return Response({
        "daily_completions": list(daily),
        "by_priority": list(by_priority),
        "completion_rate_30d": completion_rate,
        "total_completed_30d": total_completed,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def focus_analytics(request):
    """Focus session trends."""
    user = request.user
    days = int(request.query_params.get("days", 14))
    since = timezone.now().date() - timedelta(days=days)

    daily = (
        FocusSession.objects.filter(
            user=user,
            session_type="work",
            status="completed",
            started_at__date__gte=since,
        )
        .annotate(date=TruncDate("started_at"))
        .values("date")
        .annotate(
            sessions=Count("id"),
            minutes=Sum("actual_duration_seconds"),
        )
        .order_by("date")
    )

    # Convert seconds to minutes
    daily_list = [
        {**d, "minutes": (d["minutes"] or 0) // 60}
        for d in daily
    ]

    avg_session = (
        FocusSession.objects.filter(
            user=user,
            session_type="work",
            status="completed",
        ).aggregate(avg=Avg("actual_duration_seconds"))["avg"] or 0
    )

    total_completed = FocusSession.objects.filter(
        user=user, session_type="work", status="completed"
    ).count()

    return Response({
        "daily_focus": daily_list,
        "avg_session_minutes": round(avg_session / 60, 1),
        "total_sessions_completed": total_completed,
    })
