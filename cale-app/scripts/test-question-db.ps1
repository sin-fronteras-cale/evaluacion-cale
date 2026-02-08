param(
    [string]$BaseUrl = "http://localhost:3000",
    [string]$QuestionId = "a2-1"
)

$qs = Invoke-RestMethod -Uri "$BaseUrl/api/questions"
$q = $qs | Where-Object { $_.id -eq $QuestionId } | Select-Object -First 1

if (-not $q) {
    $q = $qs | Select-Object -First 1
}

if (-not $q) {
    Write-Error "No questions found"
    exit 1
}

$original = $q.text
$q.text = "$($q.text) [db-test]"

Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/questions" -ContentType "application/json" -Body ($q | ConvertTo-Json -Depth 6) | Out-Null
Start-Sleep -Seconds 1

$after = (Invoke-RestMethod -Uri "$BaseUrl/api/questions" | Where-Object { $_.id -eq $q.id } | Select-Object -First 1)
$apiPreview = if ($after -and $after.text) { $after.text.Substring(0, [Math]::Min(80, $after.text.Length)) } else { "<empty>" }
Write-Host "API text preview:" $apiPreview

$env:QUESTION_ID = $q.id
node scripts/check-question-db.js

$q.text = $original
Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/questions" -ContentType "application/json" -Body ($q | ConvertTo-Json -Depth 6) | Out-Null
Write-Host "Restored original text for" $q.id
