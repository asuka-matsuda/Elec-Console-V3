$results = @()
$files = Get-ChildItem -Path app -Recurse -Include *.vue,*.scss
foreach ($f in $files) {
    $lines = Get-Content $f.FullName
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match 'flex-direction:\s*column') {
            # look back for display: flex
            $start = $i
            if ($i -gt 0 -and $lines[$i-1] -match 'display:\s*flex') { $start = $i - 1 }
            elseif ($i -gt 1 -and $lines[$i-2] -match 'display:\s*flex') { $start = $i - 2 }
            
            # look forward for gap
            $end = $i
            if ($i -lt ($lines.Count - 1) -and $lines[$i+1] -match 'gap:') { $end = $i + 1 }
            elseif ($i -lt ($lines.Count - 2) -and $lines[$i+2] -match 'gap:') { $end = $i + 2 }
            
            $results += [PSCustomObject]@{
                File = $f.FullName
                Start = $start + 1
                End = $end + 1
                Content = ($lines[$start..$end] | Out-String).Trim()
            }
        }
    }
}
$results | ConvertTo-Json -Depth 3 > scan.json
