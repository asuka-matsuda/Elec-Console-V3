$files = "app/layouts/default.vue", "app/components/AppToolLayout.vue", "app/components/AppGlobalNav.vue", "app/components/AppPanel.vue", "app/components/AppSectionHeader.vue", "app/components/AppTabs.vue"
foreach ($f in $files) {
    if (Test-Path $f) {
        $lines = Get-Content $f
        for ($i = 0; $i -lt $lines.Count; $i++) {
            if ($lines[$i] -match 'flex-direction:\s*column') { Write-Host "$f : $( $i + 1 )" }
        }
    }
}
