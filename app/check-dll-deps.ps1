# Check DLL dependencies using PowerShell
# This script checks what DLLs are required by gswin64c.exe and gsdll64.dll

$ErrorActionPreference = "Stop"

Write-Host "=== Checking Ghostscript DLL Dependencies ===" -ForegroundColor Cyan
Write-Host ""

$gsExe = ".\bin\Ghostscript\bin\gswin64c.exe"
$gsDll = ".\bin\Ghostscript\bin\gsdll64.dll"

function Get-DllDependencies {
    param([string]$FilePath)
    
    Write-Host "Analyzing: $FilePath" -ForegroundColor Yellow
    
    if (-not (Test-Path $FilePath)) {
        Write-Host "  ERROR: File not found!" -ForegroundColor Red
        return
    }
    
    try {
        # Load the PE file
        $bytes = [System.IO.File]::ReadAllBytes((Resolve-Path $FilePath))
        
        # Find DOS header
        if ($bytes[0] -ne 0x4D -or $bytes[1] -ne 0x5A) {
            Write-Host "  ERROR: Not a valid PE file (missing MZ signature)" -ForegroundColor Red
            return
        }
        
        # Get PE header offset
        $peOffset = [BitConverter]::ToInt32($bytes, 0x3C)
        
        # Verify PE signature
        if ($bytes[$peOffset] -ne 0x50 -or $bytes[$peOffset+1] -ne 0x45) {
            Write-Host "  ERROR: Not a valid PE file (missing PE signature)" -ForegroundColor Red
            return
        }
        
        # Get import directory RVA and size
        $importDirRva = [BitConverter]::ToInt32($bytes, $peOffset + 0x90)
        $importDirSize = [BitConverter]::ToInt32($bytes, $peOffset + 0x94)
        
        if ($importDirRva -eq 0) {
            Write-Host "  No import directory found" -ForegroundColor Gray
            return
        }
        
        # Find section containing import directory
        $numberOfSections = [BitConverter]::ToUInt16($bytes, $peOffset + 0x06)
        $sectionHeaderOffset = $peOffset + 0xF8
        
        $importOffset = 0
        for ($i = 0; $i -lt $numberOfSections; $i++) {
            $sectionOffset = $sectionHeaderOffset + ($i * 40)
            $virtualAddress = [BitConverter]::ToInt32($bytes, $sectionOffset + 12)
            $virtualSize = [BitConverter]::ToInt32($bytes, $sectionOffset + 8)
            $rawDataOffset = [BitConverter]::ToInt32($bytes, $sectionOffset + 20)
            
            if ($importDirRva -ge $virtualAddress -and $importDirRva -lt ($virtualAddress + $virtualSize)) {
                $importOffset = $rawDataOffset + ($importDirRva - $virtualAddress)
                break
            }
        }
        
        if ($importOffset -eq 0) {
            Write-Host "  ERROR: Could not find import section" -ForegroundColor Red
            return
        }
        
        # Read import descriptors
        $dependencies = @()
        $descriptorOffset = $importOffset
        
        while ($true) {
            $nameRva = [BitConverter]::ToInt32($bytes, $descriptorOffset + 12)
            
            if ($nameRva -eq 0) {
                break
            }
            
            # Find name in sections
            $nameOffset = 0
            for ($i = 0; $i -lt $numberOfSections; $i++) {
                $sectionOffset = $sectionHeaderOffset + ($i * 40)
                $virtualAddress = [BitConverter]::ToInt32($bytes, $sectionOffset + 12)
                $virtualSize = [BitConverter]::ToInt32($bytes, $sectionOffset + 8)
                $rawDataOffset = [BitConverter]::ToInt32($bytes, $sectionOffset + 20)
                
                if ($nameRva -ge $virtualAddress -and $nameRva -lt ($virtualAddress + $virtualSize)) {
                    $nameOffset = $rawDataOffset + ($nameRva - $virtualAddress)
                    break
                }
            }
            
            if ($nameOffset -gt 0) {
                # Read null-terminated string
                $name = ""
                $pos = $nameOffset
                while ($bytes[$pos] -ne 0) {
                    $name += [char]$bytes[$pos]
                    $pos++
                }
                $dependencies += $name
            }
            
            $descriptorOffset += 20
        }
        
        Write-Host "  Dependencies found:" -ForegroundColor Green
        foreach ($dep in $dependencies | Sort-Object) {
            $depPath = Join-Path "C:\Windows\System32" $dep
            $exists = Test-Path $depPath
            $status = if ($exists) { "[OK]" } else { "[MISSING?]" }
            $color = if ($exists) { "Green" } else { "Yellow" }
            Write-Host "    $status $dep" -ForegroundColor $color
        }
        
    } catch {
        Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
}

# Check both files
Get-DllDependencies -FilePath $gsExe
Get-DllDependencies -FilePath $gsDll

Write-Host "=== Analysis Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Common missing dependencies:" -ForegroundColor Yellow
Write-Host "  - VCRUNTIME140.dll (Visual C++ 2015-2022 Redistributable)" -ForegroundColor Gray
Write-Host "  - MSVCP140.dll (Visual C++ 2015-2022 Redistributable)" -ForegroundColor Gray
Write-Host "  - api-ms-win-crt-*.dll (Universal CRT)" -ForegroundColor Gray

