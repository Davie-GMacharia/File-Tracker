from django.shortcuts import render, get_object_or_404, redirect
from .models import CaseFile, FileMovement, Location


def file_detail(request, reference_number):
    case_file = get_object_or_404(CaseFile, reference_number=reference_number)

    if request.method == 'POST':
        to_location_id = request.POST.get('to_location')
        handled_by = request.POST.get('handled_by', '').strip()
        remarks = request.POST.get('remarks', '').strip()

        if to_location_id and handled_by:
            to_location = get_object_or_404(Location, pk=to_location_id)
            FileMovement.objects.create(
                case_file=case_file,
                from_location=case_file.current_location,
                to_location=to_location,
                handled_by=handled_by,
                remarks=remarks,
            )
            return redirect('file_detail', reference_number=case_file.reference_number)

    movements = case_file.movements.all()
    locations = Location.objects.exclude(pk=case_file.current_location_id)
    context = {
        'case_file': case_file,
        'movements': movements,
        'locations': locations,
    }
    return render(request, 'tracker/file_detail.html', context)
