#!/bin/sh
# Runs on every container start: bring the schema up to date, (re-)import
# the CSV, make sure there's a login to use, then serve. import_items and
# the superuser check are both safe to run repeatedly - re-running this
# script never duplicates data.
set -e

python manage.py migrate --noinput

python manage.py import_items

python manage.py shell -c "
import os
from django.contrib.auth import get_user_model

User = get_user_model()
username = os.environ.get('DJANGO_SUPERUSER_USERNAME', 'admin')
password = os.environ.get('DJANGO_SUPERUSER_PASSWORD', 'admin12345')
email = os.environ.get('DJANGO_SUPERUSER_EMAIL', 'admin@example.com')

if not User.objects.filter(username=username).exists():
    User.objects.create_superuser(username=username, email=email, password=password)
    print(f'Created default superuser \"{username}\".')
"

exec python manage.py runserver 0.0.0.0:8000
