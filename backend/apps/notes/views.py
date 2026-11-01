import re
from django.db.models import Count
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
import django_filters

from .models import Note, NoteLink
from .serializers import (
    NoteSerializer,
    NoteListSerializer,
    NoteLinkSerializer,
    BacklinkSerializer,
)


class NoteFilter(django_filters.FilterSet):
    color = django_filters.CharFilter()
    is_pinned = django_filters.BooleanFilter()
    is_archived = django_filters.BooleanFilter()
    project = django_filters.UUIDFilter(field_name="project__id")
    tag = django_filters.UUIDFilter(field_name="tags__id")

    class Meta:
        model = Note
        fields = ["color", "is_pinned", "is_archived", "project"]


class NoteViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = NoteFilter
    search_fields = ["title", "content"]
    ordering_fields = ["created_at", "updated_at", "title", "sort_order"]
    ordering = ["-is_pinned", "-updated_at"]

    def get_queryset(self):
        return (
            Note.objects.filter(user=self.request.user)
            .select_related("project")
            .prefetch_related("tags")
            .annotate(
                backlink_count=Count("incoming_links"),
                outgoing_link_count=Count("outgoing_links"),
            )
        )

    def get_serializer_class(self):
        if self.action == "list":
            return NoteListSerializer
        return NoteSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=["get"])
    def backlinks(self, request, pk=None):
        """Notes that link TO this note."""
        note = self.get_object()
        links = NoteLink.objects.filter(target_note=note).select_related("source_note")
        return Response(BacklinkSerializer(links, many=True).data)

    @action(detail=True, methods=["get"])
    def links(self, request, pk=None):
        """Notes that this note links OUT TO."""
        note = self.get_object()
        links = NoteLink.objects.filter(source_note=note).select_related("target_note")
        return Response(NoteLinkSerializer(links, many=True).data)

    @action(detail=True, methods=["post"])
    def pin(self, request, pk=None):
        note = self.get_object()
        note.is_pinned = not note.is_pinned
        note.save(update_fields=["is_pinned", "updated_at"])
        return Response({"is_pinned": note.is_pinned})

    @action(detail=True, methods=["post"])
    def archive(self, request, pk=None):
        note = self.get_object()
        note.is_archived = True
        note.is_pinned = False
        note.save(update_fields=["is_archived", "is_pinned", "updated_at"])
        return Response({"status": "archived"})

    @action(detail=True, methods=["post"])
    def restore(self, request, pk=None):
        note = self.get_object()
        note.is_archived = False
        note.save(update_fields=["is_archived", "updated_at"])
        return Response({"status": "restored"})

    @action(detail=True, methods=["post"])
    def duplicate(self, request, pk=None):
        """Create a copy of this note."""
        note = self.get_object()
        new_note = Note.objects.create(
            user=request.user,
            project=note.project,
            title=f"Copy of {note.title}" if note.title else "",
            content=note.content,
            content_type=note.content_type,
            color=note.color,
        )
        new_note.tags.set(note.tags.all())
        serializer = NoteSerializer(new_note, context={"request": request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def link(self, request, pk=None):
        """Link this note to another note by target_note_id or target_title."""
        note = self.get_object()
        target_id = request.data.get("target_note_id")
        target_title = request.data.get("target_title", "").strip()

        target_note = None
        if target_id:
            if str(note.id) == str(target_id):
                return Response({"detail": "Cannot link a note to itself."}, status=status.HTTP_400_BAD_REQUEST)
            try:
                target_note = Note.objects.get(id=target_id, user=request.user)
                target_title = target_note.title or "Untitled"
            except Note.DoesNotExist:
                return Response({"detail": "Target note not found."}, status=status.HTTP_404_NOT_FOUND)
        elif target_title:
            target_note = Note.objects.filter(title__iexact=target_title, user=request.user).first()
        else:
            return Response({"detail": "target_note_id or target_title is required."}, status=status.HTTP_400_BAD_REQUEST)

        wikilink_str = f"[[{target_title}]]"
        if wikilink_str not in note.content:
            if note.content.strip():
                note.content = f"{note.content.rstrip()}\n\n- {wikilink_str}"
            else:
                note.content = wikilink_str
            note.save(update_fields=["content", "updated_at"])

            NoteLink.objects.update_or_create(
                source_note=note,
                target_title=target_title,
                defaults={"target_note": target_note},
            )

        serializer = NoteSerializer(note, context={"request": request})
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def unlink(self, request, pk=None):
        """Unlink this note from another note."""
        note = self.get_object()
        target_id = request.data.get("target_note_id")
        target_title = request.data.get("target_title", "").strip()

        if target_id:
            try:
                target_note = Note.objects.get(id=target_id, user=request.user)
                target_title = target_note.title or target_title
            except Note.DoesNotExist:
                pass

        if target_title:
            pattern = re.compile(rf'(\n?-?\s*\[\[{re.escape(target_title)}(?:\|[^\]]+)?\]\])')
            note.content = pattern.sub('', note.content).strip()
            note.save(update_fields=["content", "updated_at"])
            NoteLink.objects.filter(source_note=note, target_title=target_title).delete()

        serializer = NoteSerializer(note, context={"request": request})
        return Response(serializer.data)

    @action(detail=False, methods=["post"])
    def connect(self, request):
        """Connect any two notes: source_id -> target_id."""
        source_id = request.data.get("source_id")
        target_id = request.data.get("target_id")
        if not source_id or not target_id:
            return Response({"detail": "source_id and target_id are required."}, status=status.HTTP_400_BAD_REQUEST)
        if str(source_id) == str(target_id):
            return Response({"detail": "Cannot link a note to itself."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            source = Note.objects.get(id=source_id, user=request.user)
            target = Note.objects.get(id=target_id, user=request.user)
        except Note.DoesNotExist:
            return Response({"detail": "One or both notes not found."}, status=status.HTTP_404_NOT_FOUND)

        target_title = target.title or "Untitled"
        wikilink_str = f"[[{target_title}]]"
        if wikilink_str not in source.content:
            if source.content.strip():
                source.content = f"{source.content.rstrip()}\n\n- {wikilink_str}"
            else:
                source.content = wikilink_str
            source.save(update_fields=["content", "updated_at"])

            NoteLink.objects.update_or_create(
                source_note=source,
                target_title=target_title,
                defaults={"target_note": target},
            )

        return Response({"status": "connected", "source_id": str(source.id), "target_id": str(target.id)})

    @action(detail=False, methods=["get"])
    def graph(self, request):
        """
        Return note graph data: nodes and edges.
        Optimized to return only notes that have at least one link,
        plus the top N most-linked orphan notes.
        """
        notes = Note.objects.filter(
            user=request.user,
            is_archived=False,
        ).annotate(
            backlink_count=Count("incoming_links"),
            outgoing_link_count=Count("outgoing_links"),
        )

        links = NoteLink.objects.filter(
            source_note__user=request.user,
            source_note__is_archived=False,
            target_note__isnull=False,
            target_note__is_archived=False,
        ).values("source_note_id", "target_note_id")

        nodes = [
            {
                "id": str(n.id),
                "title": n.title or "Untitled",
                "backlink_count": n.backlink_count,
                "outgoing_link_count": n.outgoing_link_count,
            }
            for n in notes
        ]
        edges = [
            {
                "source": str(link["source_note_id"]),
                "target": str(link["target_note_id"]),
            }
            for link in links
        ]

        return Response({"nodes": nodes, "edges": edges})

    @action(detail=False, methods=["get"])
    def suggestions(self, request):
        """Note title suggestions for [[link]] autocomplete."""
        query = request.query_params.get("q", "").strip()
        if not query:
            return Response([])
        notes = Note.objects.filter(
            user=request.user,
            is_archived=False,
            title__icontains=query,
        ).values("id", "title")[:10]
        return Response(list(notes))
