import qrcode
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont
from django.core.files.base import ContentFile
from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError

SERVER_BASE_URL = "http://10.37.111.14:8000"
QR_CAPTION = "Scan to view file location & history"


class Location(models.Model):
    """A physical location within the court where files can be held."""
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']


class CaseFile(models.Model):
    """A physical case file being tracked through the court."""

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

    reference_number = models.CharField(max_length=50, unique=True, help_text="e.g. MCSOE033/2022")
    title = models.CharField(max_length=255, blank=True, help_text="Case title or parties involved")
    registry = models.CharField(max_length=20, choices=REGISTRY_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    current_location = models.ForeignKey(
        Location, on_delete=models.SET_NULL, null=True, related_name='files_here'
    )
    qr_code = models.ImageField(upload_to='qr_codes/', blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return self.reference_number

    def generate_qr_code(self):
        """Builds a QR code with a caption underneath, encoding the file's scan URL."""
        scan_url = f"{SERVER_BASE_URL}/file/{self.reference_number}/"

        qr = qrcode.QRCode(box_size=8, border=2)
        qr.add_data(scan_url)
        qr.make(fit=True)
        qr_img = qr.make_image(fill_color="black", back_color="white").convert("RGB")

        caption_height = 40
        canvas = Image.new(
            "RGB", (qr_img.width, qr_img.height + caption_height), "white"
        )
        canvas.paste(qr_img, (0, 0))

        draw = ImageDraw.Draw(canvas)
        try:
            font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 16)
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
        is_new = self.pk is None
        super().save(*args, **kwargs)
        if not self.qr_code:
            self.generate_qr_code()
            super().save(update_fields=['qr_code'])

    class Meta:
        ordering = ['-created_at']


class FileMovement(models.Model):
    """A single movement event of a case file from one location to another."""

    case_file = models.ForeignKey(CaseFile, on_delete=models.CASCADE, related_name='movements')
    from_location = models.ForeignKey(
        Location, on_delete=models.SET_NULL, null=True, blank=True, related_name='movements_from'
    )
    to_location = models.ForeignKey(
        Location, on_delete=models.SET_NULL, null=True, related_name='movements_to'
    )
    handled_by = models.CharField(max_length=100, help_text="Name of staff who handled this movement")
    remarks = models.TextField(blank=True)
    timestamp = models.DateTimeField(default=timezone.now)

    def clean(self):
        if self.from_location_id and self.case_file_id:
            actual_location = self.case_file.current_location_id
            if actual_location and self.from_location_id != actual_location:
                raise ValidationError({
                    'from_location': (
                        f"This file is currently at '{self.case_file.current_location}', "
                        f"not '{self.from_location}'. Please correct the from-location."
                    )
                })

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
        self.case_file.current_location = self.to_location
        self.case_file.save(update_fields=['current_location'])

    def __str__(self):
        return f"{self.case_file.reference_number}: {self.from_location} -> {self.to_location}"

    class Meta:
        ordering = ['-timestamp']
