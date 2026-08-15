$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$words = Get-Content -Raw -LiteralPath (Join-Path $root 'data\words.json') | ConvertFrom-Json
$tokens = @{}
foreach ($entry in $words) {
  foreach ($field in @('en', 'ex')) {
    foreach ($match in [regex]::Matches([string]$entry.$field, "[A-Za-z]+(?:['’-][A-Za-z]+)*")) {
      $token = $match.Value.ToLowerInvariant().Replace([char]0x2019, "'")
      if (-not $tokens.ContainsKey($token)) { $tokens[$token] = New-Object System.Collections.Generic.List[string] }
      $location = "{0}:{1}" -f $entry.i, $field
      if (-not $tokens[$token].Contains($location)) { $null = $tokens[$token].Add($location) }
    }
  }
}

$tokenKeys = @($tokens.GetEnumerator() | ForEach-Object { $_.Key } | Sort-Object)
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$document = $word.Documents.Add()
try {
  $suspects = foreach ($token in $tokenKeys) {
    if (-not $word.CheckSpelling($token)) {
      # Word occasionally raises a COM "Internal error" for an otherwise valid
      # token. Keep the spelling suspect and leave its suggestions empty.
      try {
        $suggestions = @($word.GetSpellingSuggestions($token) | Select-Object -First 5 -ExpandProperty Name)
      } catch {
        $suggestions = @()
      }
      [pscustomobject]@{ token = $token; locations = @($tokens[$token]); suggestions = $suggestions }
    }
  }
} finally {
  $document.Close(0)
  $word.Quit()
}

Write-Information ("Checked {0} unique English tokens; found {1} spelling suspects." -f $tokenKeys.Count, @($suspects).Count) -InformationAction Continue
Write-Warning 'Dictionary acceptance does not validate fragments, abbreviations, answer-key letters, or pedagogical suitability. Review docs/english-spelling-audit.md.'
$suspects | ConvertTo-Json -Depth 4
