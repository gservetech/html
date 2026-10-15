param([switch]$Send)

$ErrorActionPreference = 'Stop'
$settings = @{}
$envPath = Join-Path $PSScriptRoot '.env'
if (Test-Path -LiteralPath $envPath) {
    foreach ($line in Get-Content -LiteralPath $envPath) {
        if ($line -match '^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$') {
            $key = $matches[1]
            $value = $matches[2].Trim()
            if ($value.Length -ge 2 -and (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'")))) {
                $value = $value.Substring(1, $value.Length - 2)
            }
            $settings[$key] = $value
        }
    }
}
foreach ($key in @('NEO_SMTP_USER', 'NEO_SMTP_PASSWORD')) {
    $value = [Environment]::GetEnvironmentVariable($key)
    if ($value) { $settings[$key] = $value }
}

$sender = 'info@gservetech.com'
$recipient = 'mackumar26@gmail.com'
$subject = 'BIODANCE | Your skincare moment'
$htmlPath = Join-Path $PSScriptRoot 'html/amazon/image/biodance-promotion.html'
$html = [IO.File]::ReadAllText($htmlPath)
if ([string]::IsNullOrWhiteSpace($html)) { throw 'HTML email is empty.' }
Write-Output "From: $sender"
Write-Output "To: $recipient"
Write-Output "Subject: $subject"
Write-Output "HTML loaded: $($html.Length) characters"

if (-not $Send) {
    Write-Output 'Preview complete; no email sent. Run with -Send to submit once through Neo.'
    exit 0
}
if (-not $settings['NEO_SMTP_PASSWORD']) {
    throw 'Missing NEO_SMTP_PASSWORD. Save it in the local .env file before sending.'
}
$username = $settings['NEO_SMTP_USER']
if (-not $username) { $username = $sender }
if ($username -ne $sender) { throw 'NEO_SMTP_USER must match info@gservetech.com for this sender.' }

$mail = New-Object System.Net.Mail.MailMessage($sender, $recipient)
$client = New-Object System.Net.Mail.SmtpClient('smtp0001.neo.space', 587)
try {
    $mail.Subject = $subject
    $mail.SubjectEncoding = [Text.Encoding]::UTF8
    $mail.BodyEncoding = [Text.Encoding]::UTF8
    $mail.Body = $html
    $mail.IsBodyHtml = $true
    $client.EnableSsl = $true
    $client.UseDefaultCredentials = $false
    $client.Credentials = New-Object System.Net.NetworkCredential($username, $settings['NEO_SMTP_PASSWORD'])
    $client.Timeout = 30000
    $client.Send($mail)
    Write-Output 'Neo accepted the SMTP submission. This does not confirm inbox delivery; check for a rejection notice.'
} catch {
    Write-Error 'Neo SMTP submission failed. Check third-party email access, credentials, connectivity, and Neo rejection notices. Do not retry if delivery status is uncertain.'
} finally {
    $mail.Dispose()
    $client.Dispose()
}
