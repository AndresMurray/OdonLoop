#!/bin/bash
# Start script for Railway deployment

echo "Running database migrations..."
python manage.py migrate --no-input

echo "Populating obras sociales..."
python manage.py poblar_obras_sociales || echo "Obras sociales already populated"

echo "Starting gunicorn server..."
gunicorn config.wsgi --bind 0.0.0.0:$PORT
