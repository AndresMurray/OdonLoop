#!/usr/bin/env python
"""
Script para generar hash de contraseña compatible con Django
"""
import os
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.hashers import make_password

# Cambiá la contraseña aquí
contraseña = "admin123"  # CAMBIÁ ESTO

hash_generado = make_password(contraseña)
print("\n" + "="*60)
print("Hash de contraseña generado:")
print("="*60)
print(hash_generado)
print("="*60)
print("\nUsá este hash en el INSERT INTO usuarios_usuario")
print()
