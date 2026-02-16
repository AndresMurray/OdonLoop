#!/bin/bash
# Start script for Railway deployment

echo "Running database migrations..."
python manage.py migrate --no-input

echo "Starting gunicorn server..."
gunicorn config.wsgi --bind 0.0.0.0:$PORT
