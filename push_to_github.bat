@echo off
chcp 65001 > nul
set "PATH=C:\Program Files\Git\cmd;C:\Program Files\nodejs;%PATH%"
echo ========================================================
echo  🌸 Plataforma Rosa em Alerta - Envio para o GitHub
echo  Repositório: https://github.com/rehitutcontato/equiperoxocancedemama
echo ========================================================
echo.
git push -u origin main
echo.
if %ERRORLEVEL% EQU 0 (
    echo [SUCESSO] Código enviado com êxito para o GitHub!
) else (
    echo [ATENÇÃO] Se for solicitada autenticação, faça o login na janela que se abriu.
)
pause
