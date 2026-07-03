from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from tracker.models import Location

class Command(BaseCommand):
    help = 'Creates superuser and initial locations if they do not exist'

    def handle(self, *args, **kwargs):
        # Create superuser
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser('admin', 'admin@court.go.ke', 'Admin@1234')
            self.stdout.write('Superuser created: admin / Admin@1234')
        else:
            self.stdout.write('Superuser already exists')

        # Create default locations
        locations = [
            'Criminal Registry',
            'Civil Registry', 
            'Succession Registry',
            'Chief Magistrate Office',
            'Archives',
            'Court Room 1',
            'Court Room 2',
            'Court Room 3',
            'Records Office',
            'Dispatch',
        ]
        for name in locations:
            Location.objects.get_or_create(name=name)
            self.stdout.write(f'Location ready: {name}')

        self.stdout.write(self.style.SUCCESS('Initial data setup complete!'))
