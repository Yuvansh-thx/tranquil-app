"""Notes serializers with internal link parsing."""
import re
from rest_framework import serializers
from apps.tags.serializers import TagSerializer
from apps.tags.models import Tag
from .models import Note, NoteLink


# Regex for [[link]] and [[alias|link]] patterns
INTERNAL_LINK_PATTERN = re.compile(r'\[\[([^\[\]|]+?)(?:\|([^\[\]]+?))?\]\]')


def extract_internal_links(content: str) -> list[dict]:
    """
    Parse [[Title]] and [[Alias|Title]] patterns from note content.
    Returns list of {title, alias} dicts.
    """
    links = []
    for match in INTERNAL_LINK_PATTERN.finditer(content):
        title = match.group(1).strip()
        alias = match.group(2).strip() if match.group(2) else ""
        links.append({"title": title, "alias": alias})
    return links


class NoteLinkSerializer(serializers.ModelSerializer):
    target_note_title = serializers.CharField(source="target_note.title", read_only=True)
    target_note_id = serializers.UUIDField(source="target_note.id", read_only=True)

    class Meta:
        model = NoteLink
        fields = ["id", "target_note_id", "target_note_title", "alias", "target_title"]
        read_only_fields = ["id"]


class BacklinkSerializer(serializers.ModelSerializer):
    """Represents an incoming link (note that links TO this note)."""
    source_note_id = serializers.UUIDField(source="source_note.id", read_only=True)
    source_note_title = serializers.CharField(source="source_note.title", read_only=True)

    class Meta:
        model = NoteLink
        fields = ["id", "source_note_id", "source_note_title", "alias"]


class NoteSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Tag.objects.all(),
        write_only=True,
        required=False,
        source="tags",
    )
    backlink_count = serializers.IntegerField(read_only=True)
    outgoing_link_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Note
        fields = [
            "id", "project", "title", "content", "content_type",
            "color", "is_pinned", "is_archived",
            "reminder_at", "sort_order",
            "tags", "tag_ids",
            "backlink_count", "outgoing_link_count",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "created_at", "updated_at",
            "backlink_count", "outgoing_link_count",
        ]

    def validate_project(self, value):
        if value and value.user != self.context["request"].user:
            raise serializers.ValidationError("Project not found.")
        return value

    def _sync_links(self, note: Note):
        """Parse content and upsert NoteLink records."""
        user = self.context["request"].user
        parsed = extract_internal_links(note.content)

        # Build set of target titles from content
        referenced_titles = {link["title"] for link in parsed}

        # Look up existing notes by title for this user
        existing_notes = {
            n.title: n
            for n in Note.objects.filter(user=user, title__in=referenced_titles)
        }

        # Delete links no longer in content
        NoteLink.objects.filter(source_note=note).exclude(
            target_title__in=referenced_titles
        ).delete()

        # Upsert links
        for link in parsed:
            target = existing_notes.get(link["title"])
            NoteLink.objects.update_or_create(
                source_note=note,
                target_title=link["title"],
                defaults={
                    "target_note": target,
                    "alias": link["alias"],
                },
            )

    def create(self, validated_data):
        tags = validated_data.pop("tags", [])
        user = validated_data.pop("user", None) or self.context["request"].user
        note = Note.objects.create(user=user, **validated_data)
        if tags:
            note.tags.set(tags)
        self._sync_links(note)
        return note

    def update(self, instance, validated_data):
        tags = validated_data.pop("tags", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if tags is not None:
            instance.tags.set(tags)
        self._sync_links(instance)
        return instance


class NoteListSerializer(serializers.ModelSerializer):
    """Compact serializer for grid/list views."""
    tags = TagSerializer(many=True, read_only=True)
    backlink_count = serializers.IntegerField(read_only=True)
    content_preview = serializers.SerializerMethodField()

    class Meta:
        model = Note
        fields = [
            "id", "title", "content_preview", "content_type",
            "color", "is_pinned", "is_archived",
            "tags", "backlink_count", "sort_order",
            "created_at", "updated_at",
        ]

    def get_content_preview(self, obj):
        """First 200 chars of content, stripped of markdown."""
        content = obj.content
        # Strip markdown headings and syntax for preview
        content = re.sub(r'^#+\s+', '', content, flags=re.MULTILINE)
        content = re.sub(r'\*+|_{1,2}|~~|`', '', content)
        return content[:200].strip()
