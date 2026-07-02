from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .models import CaseFile, Location, FileMovement
from .serializers import (
    CaseFileListSerializer,
    CaseFileDetailSerializer,
    CaseFileCreateSerializer,
    LocationSerializer,
    FileMovementSerializer,
)


class CaseFileListCreateView(generics.ListCreateAPIView):
    queryset = CaseFile.objects.select_related('current_location')

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CaseFileCreateSerializer
        return CaseFileListSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        query = self.request.query_params.get('q', '').strip()
        registry = self.request.query_params.get('registry', '')
        status_param = self.request.query_params.get('status', '')
        if query:
            qs = qs.filter(Q(reference_number__icontains=query) | Q(title__icontains=query))
        if registry:
            qs = qs.filter(registry=registry)
        if status_param:
            qs = qs.filter(status=status_param)
        return qs


class CaseFileDetailView(generics.RetrieveAPIView):
    queryset = CaseFile.objects.select_related('current_location').prefetch_related('movements')
    serializer_class = CaseFileDetailSerializer
    lookup_field = 'reference_number'
    permission_classes = [permissions.AllowAny]


class LocationListView(generics.ListAPIView):
    queryset = Location.objects.all()
    serializer_class = LocationSerializer


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def log_movement(request, reference_number):
    case_file = get_object_or_404(CaseFile, reference_number=reference_number)
    serializer = FileMovementSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(case_file=case_file, from_location=case_file.current_location)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
