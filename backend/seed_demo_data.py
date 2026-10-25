"""Seed initial demo data for Tranquil."""
import os
import django
from datetime import timedelta
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tranquil.settings.development')
django.setup()

from apps.accounts.models import User, UserSettings
from apps.projects.models import Project
from apps.tasks.models import Task
from apps.notes.models import Note, NoteLink
from apps.tags.models import Tag
from apps.focus.models import FocusSession

user, created = User.objects.get_or_create(
    email='admin@tranquil.app',
    defaults={
        'first_name': 'Shivansh',
        'last_name': 'Yadav',
        'is_staff': True,
        'is_superuser': True,
    }
)
user.set_password('Password123!')
user.save()

# Ensure user settings
settings, _ = UserSettings.objects.get_or_create(
    user=user,
    defaults={
        'theme': 'dark',
        'pomodoro_work_mins': 25,
        'pomodoro_short_break_mins': 5,
        'pomodoro_long_break_mins': 15,
        'pomodoro_sessions_before_long_break': 4,
    }
)

# 1. Tags
tags_data = ['Engineering', 'Design', 'Health', 'Habit', 'Strategy']
tag_objs = {}
for tname in tags_data:
    tag, _ = Tag.objects.get_or_create(user=user, name=tname)
    tag_objs[tname] = tag

# 2. Projects
projects_data = [
    {'name': 'Product Roadmap', 'color': '#6366f1', 'description': 'Q4 2026 feature specs and system delivery'},
    {'name': 'Deep Learning Research', 'color': '#8b5cf6', 'description': 'Agentic architectures and latent reasoning studies'},
    {'name': 'Health & Longevity', 'color': '#10b981', 'description': 'Daily cardio, zone 2 training, and recovery routines'},
    {'name': 'Personal Systems', 'color': '#f59e0b', 'description': 'Home workspace, books, and deliberate routines'},
]
project_objs = {}
for p_data in projects_data:
    proj, _ = Project.objects.get_or_create(user=user, name=p_data['name'], defaults=p_data)
    project_objs[p_data['name']] = proj

today = timezone.now().date()
yesterday = today - timedelta(days=1)
tomorrow = today + timedelta(days=1)
day_after = today + timedelta(days=2)

# 3. Tasks
tasks_data = [
    {
        'title': 'Finalize system architecture review for Tranquil v1.0',
        'description': 'Review PostgreSQL indexing, JWT cookie auth flow, and bidirectional link sync.',
        'status': 'in_progress',
        'priority': 'urgent',
        'due_date': today,
        'project': project_objs['Product Roadmap'],
        'estimated_minutes': 45,
        'tags': [tag_objs['Engineering'], tag_objs['Strategy']],
        'subtasks': [
            'Verify GIN index on note full-text search',
            'Confirm HttpOnly cookie expiration policy',
            'Validate SVG Knowledge Graph physics loop',
        ]
    },
    {
        'title': 'Read chapter 4 of Designing Data-Intensive Applications',
        'description': 'Focus on encoding protocols and schema evolution.',
        'status': 'todo',
        'priority': 'high',
        'due_date': today,
        'project': project_objs['Deep Learning Research'],
        'estimated_minutes': 30,
        'tags': [tag_objs['Engineering']],
    },
    {
        'title': 'Morning 5km Zone-2 run and mobility stretching',
        'description': 'Target heart rate 130-142 bpm for aerobic base building.',
        'status': 'done',
        'priority': 'medium',
        'due_date': today,
        'project': project_objs['Health & Longevity'],
        'estimated_minutes': 35,
        'actual_minutes': 32,
        'completed_at': timezone.now() - timedelta(hours=3),
        'tags': [tag_objs['Health']],
    },
    {
        'title': 'Weekly workspace desk cleanup and cable management',
        'description': 'Clear desk surface for uncluttered focus headspace.',
        'status': 'todo',
        'priority': 'low',
        'due_date': tomorrow,
        'project': project_objs['Personal Systems'],
        'estimated_minutes': 20,
        'tags': [tag_objs['Habit']],
    },
    {
        'title': 'Write blog post on Obsidian + Todoist hybrid workflows',
        'description': 'Explain the synergy between fast capture cards and relational knowledge graphs.',
        'status': 'todo',
        'priority': 'high',
        'due_date': day_after,
        'project': project_objs['Product Roadmap'],
        'estimated_minutes': 60,
        'tags': [tag_objs['Strategy']],
    },
    {
        'title': 'Quick inbox capture: explore Tailwind CSS v4 color tokens',
        'description': 'Test CSS color-mix and inline root tokens in modern browsers.',
        'status': 'todo',
        'priority': 'medium',
        'due_date': None,
        'is_inbox': True,
        'estimated_minutes': 15,
        'tags': [tag_objs['Design']],
    },
]

for t_data in tasks_data:
    subtasks_list = t_data.pop('subtasks', [])
    tags_list = t_data.pop('tags', [])
    task, _ = Task.objects.get_or_create(user=user, title=t_data['title'], defaults=t_data)
    if tags_list:
        task.tags.set(tags_list)
    for st_title in subtasks_list:
        Task.objects.get_or_create(
            user=user,
            title=st_title,
            parent_task=task,
            defaults={'priority': task.priority, 'status': 'todo'}
        )

# 4. Notes with Keep colors and Obsidian [[wikilinks]]
notes_data = [
    {
        'title': 'Architecture Principles',
        'content': '''# Architecture Principles
Core mental models for engineering resilient systems:

1. **Clean Separation of Concerns**: Keep client presentation decoupled from business domains.
2. **Deterministic Data Contracts**: Schemas and typed DTOs eliminate runtime mismatch.
3. **Calm Software Ergonomics**: Fast capture meets deep knowledge synthesis.

Connected thoughts:
- See [[Deep Work Routine]] for optimal cognitive scheduling.
- Review [[System Design]] for database indexing patterns.
''',
        'color': 'fog',
        'is_pinned': True,
        'project': project_objs['Product Roadmap'],
        'tags': [tag_objs['Engineering']],
    },
    {
        'title': 'Deep Work Routine',
        'content': '''# Deep Work Routine
The daily flow formula:
- **Morning 9:00 - 11:30**: 4x 25-minute Pomodoro focus blocks without email or notifications.
- **Midday**: 30-minute restorative walk outside.
- **Afternoon**: Collaborative reviews and quick tasks.

Cross-references:
- Grounded in [[Architecture Principles]].
- Tracked in [[Productivity Metrics]].
''',
        'color': 'mint',
        'is_pinned': True,
        'project': project_objs['Personal Systems'],
        'tags': [tag_objs['Habit']],
    },
    {
        'title': 'System Design',
        'content': '''# System Design Guidelines
Key architectural choices in Tranquil:
- PostgreSQL with B-tree & GIN full-text indexes.
- HttpOnly JWT access/refresh cookies with CSRF defense.
- Force-directed Canvas simulation for [[Architecture Principles]].
- Bidirectional link graph synced on note save.
''',
        'color': 'sand',
        'is_pinned': False,
        'project': project_objs['Product Roadmap'],
        'tags': [tag_objs['Engineering']],
    },
    {
        'title': 'Productivity Metrics',
        'content': '''# Productivity Metrics
Why vanity metrics fail:
- Output is measured by completed deliverables and uninterrupted deep focus minutes, not task churn.
- Referenced from [[Deep Work Routine]].
''',
        'color': 'peach',
        'is_pinned': False,
        'project': project_objs['Product Roadmap'],
        'tags': [tag_objs['Strategy']],
    },
    {
        'title': 'Books to Read 2026',
        'content': '''# Books to Read 2026
- [x] Designing Data-Intensive Applications
- [ ] Understanding Distributed Consensus
- [ ] Four Thousand Weeks: Time Management for Mortals
- [ ] The Creative Act by Rick Rubin
''',
        'color': 'coral',
        'is_pinned': True,
        'project': project_objs['Personal Systems'],
        'tags': [tag_objs['Habit']],
    },
]

created_notes = {}
for n_data in notes_data:
    tags_list = n_data.pop('tags', [])
    note, _ = Note.objects.get_or_create(user=user, title=n_data['title'], defaults=n_data)
    if tags_list:
        note.tags.set(tags_list)
    created_notes[note.title] = note

# Manually trigger link sync
for title, note in created_notes.items():
    # Sync links
    import re
    matches = re.findall(r'\[\[([^\[\]|]+?)(?:\|([^\[\]]+?))?\]\]', note.content)
    for m in matches:
        target_title = m[0].strip()
        target_note = created_notes.get(target_title)
        if target_note:
            NoteLink.objects.update_or_create(
                source_note=note,
                target_title=target_title,
                defaults={'target_note': target_note}
            )

# 5. Focus Sessions for Analytics
for i in range(10):
    session_date = timezone.now() - timedelta(days=i)
    FocusSession.objects.get_or_create(
        user=user,
        started_at=session_date.replace(hour=10, minute=0, second=0),
        defaults={
            'session_type': 'work',
            'status': 'completed',
            'planned_duration_seconds': 1500,
            'actual_duration_seconds': 1500,
            'session_number_in_cycle': (i % 4) + 1,
            'task': Task.objects.filter(user=user).first(),
        }
    )
    if i % 2 == 0:
        FocusSession.objects.get_or_create(
            user=user,
            started_at=session_date.replace(hour=11, minute=0, second=0),
            defaults={
                'session_type': 'work',
                'status': 'completed',
                'planned_duration_seconds': 1500,
                'actual_duration_seconds': 1500,
                'session_number_in_cycle': (i % 4) + 2,
            }
        )

print("Demo data seeded successfully for admin@tranquil.app!")
