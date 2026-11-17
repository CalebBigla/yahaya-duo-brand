@echo off
echo ========================================
echo   Applying Quotes Schema to Database
echo ========================================
echo.

REM Load Supabase URL from .env file
for /f "tokens=2 delims==" %%a in ('type ..\.env ^| findstr "VITE_SUPABASE_URL"') do set SUPABASE_URL=%%a
for /f "tokens=2 delims==" %%a in ('type ..\.env ^| findstr "VITE_SUPABASE_ANON_KEY"') do set SUPABASE_KEY=%%a

echo Reading SQL file...
echo.

REM Option 1: Use Supabase Dashboard
echo OPTION 1: Via Supabase Dashboard
echo ===================================
echo.
echo 1. Open Supabase Dashboard: https://supabase.com/dashboard
echo 2. Go to your project
echo 3. Click "SQL Editor" in left sidebar
echo 4. Click "New Query"
echo 5. Copy the contents of: database\quotes-schema.sql
echo 6. Paste into the SQL editor
echo 7. Click "Run" or press Ctrl+Enter
echo.
echo.

REM Option 2: Use curl if available
echo OPTION 2: Via Command Line (if curl is available)
echo ==================================================
echo.
echo Run this command in PowerShell:
echo.
echo curl -X POST "%SUPABASE_URL%/rest/v1/rpc/exec_sql" ^
echo   -H "apikey: %SUPABASE_KEY%" ^
echo   -H "Content-Type: application/json" ^
echo   -d "@quotes-schema.sql"
echo.
echo.

echo OPTION 3: Manual Copy-Paste (Recommended)
echo ===========================================
echo.
echo Opening quotes-schema.sql in notepad...
start notepad quotes-schema.sql
echo.
echo 1. Copy the entire SQL content from Notepad
echo 2. Go to: https://supabase.com/dashboard
echo 3. Open your project -^> SQL Editor
echo 4. Paste and Run
echo.

pause
