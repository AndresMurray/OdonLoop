#!/bin/bash
# Build script for Railway deployment

echo "Installing dependencies..."
pip install -r requirements.txt

echo "Collecting static files..."
python manage.py collectstatic --no-input

echo "Build completed successfully!"
