$lines = Get-Content app/components/database/AppDbViewer.vue
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match 'flex-direction:\s*column') { Write-Host ($i + 1) }
}
