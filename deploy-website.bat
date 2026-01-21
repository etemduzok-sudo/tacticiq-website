@echo off
echo === Deploying Website to Vercel ===

echo.
echo 1. Pushing to main repository (fan_manager_2026)...
git push origin main

echo.
echo 2. Pushing website folder to tacticiq-website (Vercel)...
git subtree push --prefix=website tacticiqweb main

echo.
echo === Deployment triggered! Check Vercel dashboard for status ===
pause
