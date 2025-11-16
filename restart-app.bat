@echo off
echo ===== Stopping any running Next.js servers =====
taskkill /im node.exe /f

echo ===== Clearing Next.js cache =====
rd /s /q ".next"

echo ===== Rebuilding the application =====
npm run build

echo ===== Starting the server =====
npm start
