# PowerShell script to update OpenAI API key
$envContent = Get-Content .env.local -Raw

# Replace the placeholder with the actual API key
$newEnvContent = $envContent -replace 'OPENAI_API_KEY=your_openai_api_key_here', 'OPENAI_API_KEY=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'

# Write the updated content back to the file
Set-Content .env.local -Value $newEnvContent

Write-Host "✅ OpenAI API key updated successfully!"
Write-Host "📝 Updated .env.local file:"
Get-Content .env.local | Where-Object { $_ -like "*OPENAI_API_KEY*" }
