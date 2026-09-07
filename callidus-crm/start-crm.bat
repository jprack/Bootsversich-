@echo off
REM Callidus Boots-CRM starten - Doppelklick genuegt.
REM Schliesst sich dieses Fenster, laeuft die App nicht mehr.

cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js wurde nicht gefunden.
  echo Bitte von https://nodejs.org installieren ^(LTS-Version^) und danach
  echo diese Datei erneut doppelklicken.
  echo.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Erster Start: Abhaengigkeiten werden installiert, das dauert einige Minuten...
  call npm run install:all
  if errorlevel 1 (
    echo.
    echo Installation fehlgeschlagen. Bitte die Meldungen oben pruefen.
    pause
    exit /b 1
  )
)

echo.
echo Callidus Boots-CRM startet...
echo Gleich oeffnet sich der Browser unter http://localhost:5173
echo Zum Beenden dieses Fenster schliessen oder Strg+C druecken.
echo.

start "" http://localhost:5173
npm run dev

pause
