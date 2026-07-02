from django.urls import path
from . import api

urlpatterns = [
    path('case-files/', api.CaseFileListCreateView.as_view(), name='api_case_file_list'),
    path('case-files/<str:reference_number>/', api.CaseFileDetailView.as_view(), name='api_case_file_detail'),
    path('case-files/<str:reference_number>/movements/', api.log_movement, name='api_log_movement'),
    path('locations/', api.LocationListView.as_view(), name='api_location_list'),
]
