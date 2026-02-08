param(
    [string]$BaseUrl = "https://cale-app.vercel.app",
    [string]$UserId = ""
)

if (-not $env:WOMPI_EVENTS_SECRET) {
    Write-Error "WOMPI_EVENTS_SECRET is not set in the environment."
    exit 1
}

$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$transactionId = "test_tx_$([guid]::NewGuid().ToString('N'))"

$refUser = $UserId
if ([string]::IsNullOrWhiteSpace($refUser)) {
    $refUser = "test"
}

$reference = "PRO-$refUser-$timestamp"

$payload = @{
    event = "transaction.updated"
    data = @{
        transaction = @{
            id = $transactionId
            reference = $reference
            status = "APPROVED"
            amount_in_cents = 2000000
            currency = "COP"
            payment_method_type = "CARD"
            customer_email = "tester@payment.com"
        }
    }
}

$json = $payload | ConvertTo-Json -Depth 8 -Compress

$bytes = [System.Text.Encoding]::UTF8.GetBytes($json + $env:WOMPI_EVENTS_SECRET)
$hash = [System.Security.Cryptography.SHA256]::Create().ComputeHash($bytes)
$checksum = ($hash | ForEach-Object { $_.ToString("x2") }) -join ""

$headers = @{
    "x-event-checksum" = $checksum
    "Content-Type" = "application/json"
}

Write-Host "Posting webhook to $BaseUrl/api/payments/webhook"
Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/payments/webhook" -Headers $headers -Body $json | Out-Host

Write-Host "Fetching last payments..."
Invoke-RestMethod -Method Get -Uri "$BaseUrl/api/payments?limit=5" | Out-Host
