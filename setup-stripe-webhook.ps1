# Stripe Webhook Setup Script for Windows
# This script helps you set up Stripe webhook forwarding for local development

Write-Host "🔔 Stripe Webhook Setup" -ForegroundColor Cyan
Write-Host ""

# Refresh PATH to include Stripe CLI
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Check if Stripe CLI is installed
try {
    $version = stripe --version 2>&1
    Write-Host "✅ Stripe CLI found: $version" -ForegroundColor Green
} catch {
    Write-Host "❌ Stripe CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "   winget install Stripe.StripeCLI" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Make sure you're logged into Stripe CLI:" -ForegroundColor White
Write-Host "   stripe login" -ForegroundColor Yellow
Write-Host ""
Write-Host "2. Start webhook forwarding (run this in a separate terminal):" -ForegroundColor White
Write-Host "   stripe listen --forward-to localhost:3000/api/stripe/webhook" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. Copy the webhook secret (starts with 'whsec_') that appears" -ForegroundColor White
Write-Host ""
Write-Host "4. Add it to your .env.local file:" -ForegroundColor White
Write-Host "   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx" -ForegroundColor Yellow
Write-Host ""
Write-Host "5. Restart your dev server (npm run dev)" -ForegroundColor White
Write-Host ""

# Ask if user wants to start forwarding now
$response = Read-Host "Would you like to start webhook forwarding now? (y/n)"
if ($response -eq "y" -or $response -eq "Y") {
    Write-Host ""
    Write-Host "🚀 Starting webhook forwarding..." -ForegroundColor Green
    Write-Host "⚠️  Keep this terminal open while developing!" -ForegroundColor Yellow
    Write-Host ""
    stripe listen --forward-to localhost:3000/api/stripe/webhook
} else {
    Write-Host ""
    Write-Host "To start webhook forwarding manually, run:" -ForegroundColor White
    Write-Host "stripe listen --forward-to localhost:3000/api/stripe/webhook" -ForegroundColor Yellow
}







