# This script removes API keys from .env files and replaces them with placeholders

# Root .env file
if (Test-Path -Path ".env") {
    Write-Host "Cleaning root .env file..."
    (Get-Content -Path ".env") -replace "OPENAI_API_KEY=.*", "OPENAI_API_KEY=your_openai_api_key_here" | Set-Content -Path ".env"
    (Get-Content -Path ".env") -replace "DEEPSEEK_API_KEY=.*", "DEEPSEEK_API_KEY=your_deepseek_api_key_here" | Set-Content -Path ".env"
    Write-Host "Done."
}

# Backend .env file
if (Test-Path -Path "backend/agents/.env") {
    Write-Host "Cleaning backend/agents/.env file..."
    (Get-Content -Path "backend/agents/.env") -replace "OPENAI_API_KEY=.*", "OPENAI_API_KEY=your_openai_api_key_here" | Set-Content -Path "backend/agents/.env"
    (Get-Content -Path "backend/agents/.env") -replace "DEEPSEEK_API_KEY=.*", "DEEPSEEK_API_KEY=your_deepseek_api_key_here" | Set-Content -Path "backend/agents/.env"
    Write-Host "Done."
}

Write-Host "API keys have been removed from .env files."
Write-Host "Please run 'git add .env backend/agents/.env' and commit the changes."
Write-Host "Then try pushing again." 