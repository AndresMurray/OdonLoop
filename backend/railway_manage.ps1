# 1. Pedir la URL al usuario
$public_url = Read-Host "Pega la DATABASE_PUBLIC_URL de Railway"

# 2. Configurar la variable de entorno para esta sesión
$env:DATABASE_URL = $public_url

# 3. Intentar activar el entorno virtual si existe
if (Test-Path ".\venv\Scripts\Activate.ps1") {
    Write-Host "--- Activando entorno virtual... ---" -ForegroundColor Cyan
    . .\venv\Scripts\Activate.ps1
} else {
    Write-Host "--- No se encontró .\venv, asegúrate de que esté instalado ---" -ForegroundColor Yellow
}

# 4. Menú de opciones rápidas
Write-Host "`n¿Qué comando quieres ejecutar?" -ForegroundColor Green
Write-Host "1. Create Superuser"
Write-Host "2. Migrate"
Write-Host "3. Shell"
Write-Host "4. Otro (escribir manualmente)"

$opcion = Read-Host "Selecciona una opción (1-4)"

switch ($opcion) {
    "1" { python manage.py createsuperuser }
    "2" { python manage.py migrate }
    "3" { python manage.py shell }
    "4" { 
        $comando = Read-Host "Escribe el comando (ej: python manage.py help)"
        invoke-expression $comando 
    }
    Default { Write-Host "Opción no válida" -ForegroundColor Red }
}

Write-Host "`n--- Proceso finalizado ---" -ForegroundColor Cyan
Read-Host "Presiona Enter para cerrar"