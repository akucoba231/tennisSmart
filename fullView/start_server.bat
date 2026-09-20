@echo off
title 3D Model Viewer - Local Server
cd /d "%~dp0"

echo ======================================================
echo           3D Model Viewer - Local Web Server
echo ======================================================
echo.

:: Check for py or python launcher
where py >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [OK] Python Launcher ditemukan. Memulai server di http://localhost:8000 ...
    start http://localhost:8000
    py -m http.server 8000
    goto end
)

where python >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [OK] Python ditemukan. Memulai server di http://localhost:8000 ...
    start http://localhost:8000
    python -m http.server 8000
    goto end
)

:: Check for Node / npx
where npx >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [OK] Node.js / NPX ditemukan. Memulai server...
    npx --yes serve -p 8000 .
    goto end
)

:: Check for PHP
where php >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [OK] PHP CLI ditemukan. Memulai server di http://localhost:8000 ...
    start http://localhost:8000
    php -S localhost:8000
    goto end
)

:: Fallback: Open index.html directly (Users can drag and drop GLB files)
echo [INFO] Tidak ditemukan Python/Node/PHP. Membuka index.html langsung di browser...
echo Anda dapat menggunakan tombol "Pilih File Lain" atau Drag-and-Drop model .GLB langsung ke browser.
start "" "%~dp0index.html"

:end
pause
