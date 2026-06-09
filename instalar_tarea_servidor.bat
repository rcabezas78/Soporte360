@echo off
echo Instalando tarea automatica para Servidor HTTP Soporte360...

schtasks /create /tn "Soporte360-Servidor-HTTP" ^
  /tr "\"C:\Users\Rodrigo\AppData\Local\Python\pythoncore-3.14-64\pythonw.exe\" \"D:\Sistemas\Soporte360\p_server.py\"" ^
  /sc ONSTART ^
  /ru SYSTEM ^
  /rl HIGHEST ^
  /f

if %errorlevel% == 0 (
    echo.
    echo [OK] Tarea instalada correctamente.
    echo El servidor HTTP arrancara automaticamente al iniciar Windows.
    echo.
    echo Iniciando el servidor ahora para verificar...
    schtasks /run /tn "Soporte360-Servidor-HTTP"
    echo.
    echo Verificando puerto 8080...
    timeout /t 3 /nobreak >nul
    netstat -ano | findstr :8080
) else (
    echo.
    echo [ERROR] No se pudo instalar la tarea.
    echo Asegurate de ejecutar este archivo como Administrador.
)

pause
