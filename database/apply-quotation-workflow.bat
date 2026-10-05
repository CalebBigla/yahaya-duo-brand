@echo off
REM ============================================================================
REM Apply Quotation Workflow Migration
REM Run this to add versioning, responses, and tokens to your Supabase database
REM ============================================================================

echo.
echo ========================================
echo   Quotation Workflow Migration
echo ========================================
echo.
echo This script will:
echo   - Add quote versioning support
echo   - Create quote_responses table
echo   - Create quote_access_tokens table
echo   - Link quotes to enquiries
echo   - Add RLS policies
echo   - Create helper functions
echo.

REM Check if .env file exists
if not exist "..\\.env" (
    echo ERROR: .env file not found!
    echo Please create .env with your Supabase credentials.
    echo.
    pause
    exit /b 1
)

echo Reading Supabase credentials from .env...
echo.

REM Load environment variables
for /f "usebackq tokens=1,* delims==" %%a in ("..\.env") do (
    set "%%a=%%b"
)

REM Remove any quotes from the variables
set VITE_SUPABASE_URL=%VITE_SUPABASE_URL:"=%
set VITE_SUPABASE_ANON_KEY=%VITE_SUPABASE_ANON_KEY:"=%

if "%VITE_SUPABASE_URL%"=="" (
    echo ERROR: VITE_SUPABASE_URL not found in .env
    echo.
    pause
    exit /b 1
)

echo Supabase URL: %VITE_SUPABASE_URL%
echo.
echo IMPORTANT: This migration will modify your quotes table and add new tables.
echo Make sure you have a backup if this is production data.
echo.
set /p confirm="Do you want to continue? (yes/no): "

if /i not "%confirm%"=="yes" (
    echo Migration cancelled.
    pause
    exit /b 0
)

echo.
echo Running migration...
echo.

REM Note: You'll need to run this SQL in Supabase dashboard SQL editor
REM or use psql/pgAdmin to execute it
echo.
echo ============================================
echo NEXT STEPS:
echo ============================================
echo 1. Open your Supabase dashboard
echo 2. Go to SQL Editor
echo 3. Create a new query
echo 4. Copy the contents of quotation-workflow-migration.sql
echo 5. Paste and run it
echo.
echo Or use psql:
echo psql "postgresql://[user]:[password]@[host]:[port]/[database]" -f quotation-workflow-migration.sql
echo.
echo ============================================

pause
