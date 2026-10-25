"""Notes views — CRUD, backlinks, links, knowledge graph data."""
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
            target_note__isnull=False,
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
