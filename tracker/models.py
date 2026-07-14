import qrcode
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont
from django.conf import settings
from django.core.files.base import ContentFile
from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError
from cloudinary_storage.storage import MediaCloudinaryStorage

QR_CAPTION = "Scan to view file location & history"


class Location(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']


class CaseFile(models.Model):
    REGISTRY_CHOICES = [
        ('CRIMINAL', 'Criminal'),
        ('CIVIL', 'Civil'),
        ('SUCCESSION', 'Succession'),
    ]

    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('CLOSED', 'Closed'),
        ('ARCHIVED', 'Archived'),
    ]

    reference_number = models.CharField(max_length=50, unique=True)
    title = models.CharField(max_length=255, blank=True)
    registry = models.CharField(max_length=20, choices=REGISTRY_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    GAZETTEMENT_STATUS_CHOICES = [
        ('NOT_REQUIRED', 'Not Required'),
        ('PENDING', 'Pending'),
        ('GAZETTED', 'Gazetted'),
    ]
    requires_gazettement = models.BooleanField(default=False)
    gazettement_status = models.CharField(
        max_length=20, choices=GAZETTEMENT_STATUS_CHOICES, default='NOT_REQUIRED'
    )
    current_location = models.ForeignKey(
        Location, on_delete=models.SET_NULL, null=True, blank=True, related_name='files_here'
    )
    qr_code = models.ImageField(
        upload_to='qr_codes/',
        blank=True,
        null=True,
        storage=MediaCloudinaryStorage(),
    )
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return self.reference_number

    def generate_qr_code(self):
        scan_url = f"{settings.SITE_URL}/file/{self.reference_number}/"

        qr = qrcode.QRCode(box_size=8, border=2)
        qr.add_data(scan_url)
        qr.make(fit=True)
        qr_img = qr.make_image(fill_color="black", back_color="white").convert("RGB")

        caption_height = 40
        canvas = Image.new("RGB", (qr_img.width, qr_img.height + caption_height), "white")
        canvas.paste(qr_img, (0, 0))

        draw = ImageDraw.Draw(canvas)
        try:
            font = ImageFont.truetype("DejaVuSans.ttf", 16)
        except OSError:
            font = ImageFont.load_default()

        text_bbox = draw.textbbox((0, 0), QR_CAPTION, font=font)
        text_width = text_bbox[2] - text_bbox[0]
        text_x = (canvas.width - text_width) // 2
        text_y = qr_img.height + 8
        draw.text((text_x, text_y), QR_CAPTION, fill="black", font=font)

        buffer = BytesIO()
        canvas.save(buffer, format="PNG")
        filename = f"{self.reference_number.replace('/', '-')}.png"
        self.qr_code.save(filename, ContentFile(buffer.getvalue()), save=False)

    def save(self, *args, **kwargs):
        regenerate = kwargs.pop('regenerate_qr', False)
        if self.requires_gazettement and self.gazettement_status == 'NOT_REQUIRED':
            self.gazettement_status = 'PENDING'
        elif not self.requires_gazettement:
            self.gazettement_status = 'NOT_REQUIRED'
        super().save(*args, **kwargs)
        if not self.qr_code or regenerate:
            self.generate_qr_code()
            super().save(update_fields=['qr_code'])

    class Meta:
        ordering = ['-created_at']


class FileMovement(models.Model):
    case_file = models.ForeignKey(CaseFile, on_delete=models.CASCADE, related_name='movements')
    from_location = models.ForeignKey(
        Location, on_delete=models.SET_NULL, null=True, blank=True, related_name='movements_from'
    )
    to_location = models.ForeignKey(
        Location, on_delete=models.SET_NULL, null=True, related_name='movements_to'
    )
    handled_by = models.CharField(max_length=100)
    remarks = models.TextField(blank=True)
    timestamp = models.DateTimeField(default=timezone.now)

    def clean(self):
        if self.from_location_id and self.case_file_id:
            actual_location = self.case_file.current_location_id
            if actual_location and self.from_location_id != actual_location:
                raise ValidationError({
                    'from_location': (
                        f"This file is currently at '{self.case_file.current_location}', "
                        f"not '{self.from_location}'."
                    )
                })

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
        self.case_file.current_location = self.to_location
        self.case_file.save(update_fields=['current_location'])
        Notification.objects.create(
            case_file=self.case_file,
            message=(
                f'{self.case_file.reference_number} moved from '
                f'{self.from_location or "Unknown"} to {self.to_location} '
                f'by {self.handled_by}'
            ),
        )

    def __str__(self):
        return f"{self.case_file.reference_number}: {self.from_location} -> {self.to_location}"

    class Meta:
        ordering = ['-timestamp']


class Gazettement(models.Model):
    case_file = models.ForeignKey(CaseFile, on_delete=models.CASCADE, related_name='gazettements')
    gazette_notice_number = models.CharField(max_length=100)
    gazette_date = models.DateField()
    volume_issue = models.CharField(max_length=100, blank=True)
    remarks = models.TextField(blank=True)
    logged_by = models.CharField(max_length=100)
    created_at = models.DateTimeField(default=timezone.now)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.case_file.gazettement_status = 'GAZETTED'
        self.case_file.save(update_fields=['gazettement_status'])

    def __str__(self):
        return f"{self.case_file.reference_number}: Notice {self.gazette_notice_number}"

    class Meta:
        ordering = ['-gazette_date']


class Notification(models.Model):
    case_file = models.ForeignKey(CaseFile, on_delete=models.CASCADE, related_name='notifications')
    message = models.CharField(max_length=255)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return self.message

    class Meta:
        ordering = ['-created_at']


class NotificationRead(models.Model):
    """Tracks the last notification a given user has seen, to compute unread counts."""
    user = models.OneToOneField('auth.User', on_delete=models.CASCADE, related_name='notification_read')
    last_seen_notification_id = models.IntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)
