from rest_framework import serializers
from .models import CaseFile, FileMovement, Location, Gazettement


class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = ['id', 'name']


class FileMovementSerializer(serializers.ModelSerializer):
    from_location = serializers.StringRelatedField(read_only=True)
    to_location_name = serializers.StringRelatedField(source='to_location', read_only=True)

    class Meta:
        model = FileMovement
        fields = [
            'id', 'from_location', 'to_location', 'to_location_name',
            'handled_by', 'remarks', 'timestamp',
        ]
        read_only_fields = ['from_location', 'timestamp']


class MovementListSerializer(serializers.ModelSerializer):
    from_location = serializers.StringRelatedField(read_only=True)
    to_location_name = serializers.StringRelatedField(source='to_location', read_only=True)
    reference_number = serializers.StringRelatedField(source='case_file', read_only=True)
    registry = serializers.CharField(source='case_file.registry', read_only=True)

    class Meta:
        model = FileMovement
        fields = [
            'id', 'reference_number', 'registry', 'from_location',
            'to_location_name', 'handled_by', 'remarks', 'timestamp',
        ]


class CaseFileListSerializer(serializers.ModelSerializer):
    current_location = serializers.StringRelatedField()

    class Meta:
        model = CaseFile
        fields = [
            'reference_number', 'title', 'registry', 'status',
            'current_location', 'created_at',
        ]


class GazettementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Gazettement
        fields = [
            'id', 'gazette_notice_number', 'gazette_date',
            'volume_issue', 'remarks', 'logged_by', 'created_at',
        ]


class CaseFileDetailSerializer(serializers.ModelSerializer):
    current_location = serializers.StringRelatedField()
    movements = FileMovementSerializer(many=True, read_only=True)
    gazettements = GazettementSerializer(many=True, read_only=True)

    class Meta:
        model = CaseFile
        fields = [
            'reference_number', 'title', 'registry', 'status',
            'current_location', 'qr_code', 'created_at', 'movements',
            'requires_gazettement', 'gazettement_status', 'gazettements',
        ]


class CaseFileCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CaseFile
        fields = ['reference_number', 'title', 'registry', 'status', 'current_location', 'requires_gazettement']
