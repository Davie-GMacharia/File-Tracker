from rest_framework import serializers
from .models import CaseFile, FileMovement, Location


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


class CaseFileListSerializer(serializers.ModelSerializer):
    current_location = serializers.StringRelatedField()

    class Meta:
        model = CaseFile
        fields = [
            'reference_number', 'title', 'registry', 'status',
            'current_location', 'created_at',
        ]


class CaseFileDetailSerializer(serializers.ModelSerializer):
    current_location = serializers.StringRelatedField()
    movements = FileMovementSerializer(many=True, read_only=True)

    class Meta:
        model = CaseFile
        fields = [
            'reference_number', 'title', 'registry', 'status',
            'current_location', 'qr_code', 'created_at', 'movements',
        ]


class CaseFileCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CaseFile
        fields = ['reference_number', 'title', 'registry', 'status', 'current_location']
