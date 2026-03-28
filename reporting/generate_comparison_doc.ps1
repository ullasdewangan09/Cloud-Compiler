param(
    [string]$Source = "Compiler_Comparison_Metrics.md",
    [string]$Output = "Compiler_Comparison_Metrics.docx"
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$sourcePath = Join-Path $scriptDir $Source
$outputPath = Join-Path $scriptDir $Output

if (-not (Test-Path -LiteralPath $sourcePath)) {
    throw "Source markdown not found: $sourcePath"
}

$wdAlignParagraphLeft = 0
$wdAlignParagraphCenter = 1
$wdAlignParagraphJustify = 3
$wdCollapseEnd = 0
$wdFormatXMLDocument = 12
$wdPaperA4 = 7

$word = $null
$doc = $null

function Set-BaseStyle {
    param(
        $Style,
        [int]$Alignment = $wdAlignParagraphJustify,
        [string]$FontName = "Times New Roman",
        [int]$FontSize = 12,
        [bool]$Bold = $false,
        [bool]$Italic = $false
    )

    $selection = $word.Selection
    $selection.Style = $doc.Styles.Item($Style)
    $selection.Font.Name = $FontName
    $selection.Font.Size = $FontSize
    $selection.Font.Bold = [int]$Bold
    $selection.Font.Italic = [int]$Italic
    $selection.ParagraphFormat.Alignment = $Alignment
    $selection.ParagraphFormat.SpaceAfter = 6
}

function Add-BlankLine {
    $word.Selection.TypeParagraph()
}

function Add-Heading {
    param(
        [int]$Level,
        [string]$Text
    )

    $style = switch ($Level) {
        1 { "Heading 1" }
        2 { "Heading 2" }
        default { "Heading 3" }
    }

    Set-BaseStyle -Style $style -Alignment $wdAlignParagraphLeft
    $word.Selection.TypeText($Text.Trim())
    $word.Selection.TypeParagraph()
}

function Add-Paragraph {
    param(
        [string]$Text,
        [int]$Alignment = $wdAlignParagraphJustify,
        [bool]$Bold = $false,
        [bool]$Italic = $false
    )

    Set-BaseStyle -Style "Normal" -Alignment $Alignment -Bold $Bold -Italic $Italic
    $word.Selection.TypeText($Text)
    $word.Selection.TypeParagraph()
}

function Add-BulletList {
    param([string[]]$Items)

    foreach ($item in $Items) {
        Add-Paragraph -Text ([char]0x2022 + " " + $item.Trim()) -Alignment $wdAlignParagraphLeft
    }
}

function Add-NumberedList {
    param([string[]]$Items)

    for ($j = 0; $j -lt $Items.Count; $j++) {
        Add-Paragraph -Text ("{0}. {1}" -f ($j + 1), $Items[$j].Trim()) -Alignment $wdAlignParagraphLeft
    }
}

function Parse-MarkdownRow {
    param([string]$Line)

    $trimmed = $Line.Trim()
    if ($trimmed.StartsWith("|")) { $trimmed = $trimmed.Substring(1) }
    if ($trimmed.EndsWith("|")) { $trimmed = $trimmed.Substring(0, $trimmed.Length - 1) }
    return @($trimmed.Split("|") | ForEach-Object { $_.Trim() })
}

function Add-MarkdownTable {
    param([string[]]$TableLines)

    if ($TableLines.Count -lt 2) {
        foreach ($line in $TableLines) {
            Add-Paragraph -Text $line -Alignment $wdAlignParagraphLeft
        }
        return
    }

    $rows = @()
    foreach ($line in $TableLines) {
        if ($line -match '^\s*\|(?:\s*:?-+:?\s*\|)+\s*$') {
            continue
        }
        $rows += ,(Parse-MarkdownRow -Line $line)
    }

    if ($rows.Count -eq 0) {
        return
    }

    $colCount = $rows[0].Count
    $table = $doc.Tables.Add($word.Selection.Range, $rows.Count, $colCount)
    $table.Style = "Table Grid"

    for ($r = 1; $r -le $rows.Count; $r++) {
        for ($c = 1; $c -le $colCount; $c++) {
            $cell = $table.Cell($r, $c).Range
            $cell.Text = $rows[$r - 1][$c - 1]
            $cell.Font.Name = "Times New Roman"
            $cell.Font.Size = 11
            if ($r -eq 1) {
                $cell.Bold = 1
            }
        }
    }

    $word.Selection.SetRange($table.Range.End, $table.Range.End)
    $word.Selection.Collapse($wdCollapseEnd)
    $word.Selection.TypeParagraph()
}

function Add-CodeBlock {
    param([string[]]$CodeLines)

    $table = $doc.Tables.Add($word.Selection.Range, 1, 1)
    $table.Style = "Table Grid"
    $range = $table.Cell(1, 1).Range
    $range.Text = ($CodeLines -join [Environment]::NewLine)
    $range.Font.Name = "Consolas"
    $range.Font.Size = 10

    $word.Selection.SetRange($table.Range.End, $table.Range.End)
    $word.Selection.Collapse($wdCollapseEnd)
    $word.Selection.TypeParagraph()
}

function Add-Image {
    param(
        [string]$ImagePath,
        [string]$AltText = ""
    )

    $resolvedPath = $ImagePath
    if (-not [System.IO.Path]::IsPathRooted($resolvedPath)) {
        $resolvedPath = Join-Path $scriptDir $resolvedPath
    }

    if (-not (Test-Path -LiteralPath $resolvedPath)) {
        Add-Paragraph -Text ("[Missing image] " + $AltText + " -> " + $ImagePath) -Alignment $wdAlignParagraphLeft
        return
    }

    $selection = $word.Selection
    $selection.ParagraphFormat.Alignment = $wdAlignParagraphCenter
    $selection.InlineShapes.AddPicture($resolvedPath) | Out-Null
    $selection.TypeParagraph()
}

try {
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $word.DisplayAlerts = 0
    $doc = $word.Documents.Add()

    $pageSetup = $doc.PageSetup
    $pageSetup.PaperSize = $wdPaperA4

    $normal = $doc.Styles.Item("Normal")
    $normal.Font.Name = "Times New Roman"
    $normal.Font.Size = 12
    $normal.ParagraphFormat.Alignment = $wdAlignParagraphJustify
    $normal.ParagraphFormat.SpaceAfter = 6

    $heading1 = $doc.Styles.Item("Heading 1")
    $heading1.Font.Name = "Times New Roman"
    $heading1.Font.Size = 16
    $heading1.Font.Bold = 1

    $heading2 = $doc.Styles.Item("Heading 2")
    $heading2.Font.Name = "Times New Roman"
    $heading2.Font.Size = 14
    $heading2.Font.Bold = 1

    $heading3 = $doc.Styles.Item("Heading 3")
    $heading3.Font.Name = "Times New Roman"
    $heading3.Font.Size = 12
    $heading3.Font.Bold = 1

    $lines = Get-Content -LiteralPath $sourcePath
    $i = 0

    while ($i -lt $lines.Count) {
        $line = $lines[$i]
        $trimmed = $line.Trim()

        if ([string]::IsNullOrWhiteSpace($trimmed)) {
            Add-BlankLine
            $i++
            continue
        }

        if ($trimmed -match '^```') {
            $i++
            $codeLines = @()
            while ($i -lt $lines.Count -and $lines[$i].Trim() -notmatch '^```') {
                $codeLines += $lines[$i]
                $i++
            }
            Add-CodeBlock -CodeLines $codeLines
            if ($i -lt $lines.Count) { $i++ }
            continue
        }

        if ($trimmed -match '^(#{1,3})\s+(.+)$') {
            Add-Heading -Level $matches[1].Length -Text $matches[2]
            $i++
            continue
        }

        if ($trimmed -match '^\|.*\|$') {
            $tableLines = @()
            while ($i -lt $lines.Count -and $lines[$i].Trim() -match '^\|.*\|$') {
                $tableLines += $lines[$i]
                $i++
            }
            Add-MarkdownTable -TableLines $tableLines
            continue
        }

        if ($trimmed -match '^- ') {
            $items = @()
            while ($i -lt $lines.Count -and $lines[$i].Trim() -match '^- ') {
                $items += $lines[$i].Trim().Substring(2)
                $i++
            }
            Add-BulletList -Items $items
            continue
        }

        if ($trimmed -match '^\d+\.\s+') {
            $items = @()
            while ($i -lt $lines.Count -and $lines[$i].Trim() -match '^\d+\.\s+') {
                $items += (($lines[$i].Trim() -replace '^\d+\.\s+', ''))
                $i++
            }
            Add-NumberedList -Items $items
            continue
        }

        if ($trimmed -match '^> ') {
            Add-Paragraph -Text ($trimmed.Substring(2)) -Italic $true
            $i++
            continue
        }

        if ($trimmed -match '^\!\[(.*?)\]\((.*?)\)$') {
            Add-Image -ImagePath $matches[2] -AltText $matches[1]
            $i++
            continue
        }

        Add-Paragraph -Text $line
        $i++
    }

    $doc.SaveAs([string]$outputPath, $wdFormatXMLDocument)
    Write-Output "Generated: $outputPath"
}
finally {
    if ($doc) {
        try {
            $doc.Close($false) | Out-Null
        }
        catch {
        }
    }
    if ($word) {
        try {
            $word.Quit() | Out-Null
        }
        catch {
        }
    }
}
