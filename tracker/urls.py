from django.urls import path
from . import views

urlpatterns = [
    path('file/<str:reference_number>/', views.file_detail, name='file_detail'),
]
