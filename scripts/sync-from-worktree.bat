@echo off
REM Worktree'deki degisiklikleri ana workspace'e (c:\TacticIQ) kopyala
powershell -ExecutionPolicy Bypass -File "%~dp0sync-worktrees.ps1" worktree-to-main
pause
