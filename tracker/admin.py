from django.contrib import admin
from django.utils.html import format_html
from .models import Location, CaseFile, FileMovement


@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)


@admin.register(CaseFile)
class CaseFileAdmin(admin.ModelAdmin):
    list_display = ('reference_number', 'title', 'registry', 'status', 'current_location', 'created_at', 'qr_preview')
    list_filter = ('registry', 'status', 'current_location')
    search_fields = ('reference_number', 'title')
    readonly_fields = ('qr_code_display',)
    fields = (
        'reference_number', 'title', 'registry', 'status',
        'current_location', 'created_at', 'qr_code_display',
    )

    def qr_preview(self, obj):
        if obj.qr_code:
            return format_html('<img src="{}" style="height:40px;" />', obj.qr_code.url)
        return "—"
    qr_preview.short_description = "QR"

    def qr_code_display(self, obj):
        if obj.qr_code:
            return format_html(
                '<img src="{}" style="max-width:250px;" /><br>'
                '<a href="{}" download>Download QR Code</a>',
                obj.qr_code.url, obj.qr_code.url
            )
        return "QR code will be generated after saving."
    qr_code_display.short_description = "QR Code"


@admin.register(FileMovement)
class FileMovementAdmin(admin.ModelAdmin):
    list_display = ('case_file', 'from_location', 'to_location', 'handled_by', 'timestamp')
    list_filter = ('from_location', 'to_location')
    search_fields = ('case_file__reference_number', 'handled_by')
    ordering = ('-timestamp',)
