from django.urls import path
from . import api

urlpatterns = [
    path('case-files/', api.CaseFileListCreateView.as_view(), name='api_case_file_list'),
    path('case-files/bulk-movements/', api.bulk_log_movement, name='api_bulk_log_movement'),
    path('case-files/<str:reference_number>/', api.CaseFileDetailView.as_view(), name='api_case_file_detail'),
    path('case-files/<str:reference_number>/movements/', api.log_movement, name='api_log_movement'),
    path('case-files/<str:reference_number>/movements/export/', api.export_movement_history, name='api_export_movement_history'),
    path('case-files/<str:reference_number>/gazettements/', api.log_gazettement, name='api_log_gazettement'),
    path('gazettements/pending/', api.PendingGazettementView.as_view(), name='api_pending_gazettement'),
    path('movements/', api.MovementListView.as_view(), name='api_movement_list'),
    path('locations/', api.LocationListView.as_view(), name='api_location_list'),
]
