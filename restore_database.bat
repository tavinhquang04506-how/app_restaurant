@echo off
echo =============================================
echo  KHOI PHUC DATABASE NHA HANG 3SHIP
echo  File backup: database_backup_27052026.sql
echo =============================================
echo.
echo [WARNING] Thao tac nay se XOA TOAN BO du lieu hien tai
echo va thay the bang du lieu tu file backup.
echo.
set /p confirm="Ban co chac chan? (Y/N): "
if /i not "%confirm%"=="Y" (
    echo Da huy thao tac.
    pause
    exit /b
)

echo.
echo Dang khoi phuc database...
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p123456 restaurant < "%~dp0database_backup_27052026.sql"

if %ERRORLEVEL%==0 (
    echo.
    echo =============================================
    echo  KHOI PHUC THANH CONG!
    echo  Database da duoc khoi phuc tu backup.
    echo =============================================
) else (
    echo.
    echo [LOI] Khoi phuc THAT BAI! Kiem tra lai MySQL.
)
echo.
pause
