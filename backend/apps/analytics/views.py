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


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def activity_analytics(request):
    """
    Returns daily activity for both tasks and focus hours.
    Designed for:
    1. GitHub-style daily block contribution heatmap (level 0 to 4)
    2. Focus Hours vs. Tasks Completed comparative graph
    """
    user = request.user
    days_count = int(request.query_params.get("days", 365))
    today = timezone.now().date()
    start_date = today - timedelta(days=days_count - 1)

    # 1. Query task completions grouped by date
    task_counts = {
        row["date"]: row["count"]
        for row in (
            Task.objects.filter(user=user, completed_at__date__gte=start_date)
            .annotate(date=TruncDate("completed_at"))
            .values("date")
            .annotate(count=Count("id"))
        )
        if row["date"]
    }

    # 2. Query focus duration in seconds grouped by date
    focus_data = {
        row["date"]: row["total_seconds"] or 0
        for row in (
            FocusSession.objects.filter(
                user=user,
                session_type="work",
                status="completed",
                started_at__date__gte=start_date,
            )
            .annotate(date=TruncDate("started_at"))
            .values("date")
            .annotate(total_seconds=Sum("actual_duration_seconds"))
        )
        if row["date"]
    }

    # 3. Build continuous date list from start_date to today
    daily_records = []
    total_focus_seconds = 0
    total_tasks = 0
    active_days_count = 0

    curr = start_date
    while curr <= today:
        t_count = task_counts.get(curr, 0)
        f_sec = focus_data.get(curr, 0)
        total_focus_seconds += f_sec
        total_tasks += t_count

        f_hours = round(f_sec / 3600.0, 1)
        f_mins = round(f_sec / 60.0)

        # Activity level 0 - 4 (similar to GitHub green blocks)
        score = t_count + (f_mins / 25.0)
        if score == 0:
            level = 0
        elif score <= 1.5:
            level = 1
        elif score <= 3.5:
            level = 2
        elif score <= 6.0:
            level = 3
        else:
            level = 4

        if score > 0:
            active_days_count += 1

        daily_records.append({
            "date": curr.strftime("%Y-%m-%d"),
            "tasks_completed": t_count,
            "focus_hours": f_hours,
            "focus_minutes": f_mins,
            "level": level,
        })
        curr += timedelta(days=1)

    # 4. Calculate streaks
    current_streak = 0
    longest_streak = 0
    temp_streak = 0

    for rec in daily_records:
        if rec["tasks_completed"] > 0 or rec["focus_minutes"] > 0:
            temp_streak += 1
            if temp_streak > longest_streak:
                longest_streak = temp_streak
        else:
            temp_streak = 0

    for rec in reversed(daily_records):
        if rec["tasks_completed"] > 0 or rec["focus_minutes"] > 0:
            current_streak += 1
        else:
            if rec["date"] == today.strftime("%Y-%m-%d"):
                continue
            break

    total_focus_hours = round(total_focus_seconds / 3600.0, 1)

    return Response({
        "daily": daily_records,
        "summary": {
            "total_focus_hours": total_focus_hours,
            "total_tasks_completed": total_tasks,
            "current_streak": current_streak,
            "longest_streak": longest_streak,
            "total_active_days": active_days_count,
            "days_count": days_count,
        }
    })
