# Stripe CLI Installation für Windows

## Problem
Die Stripe CLI ist nicht im PATH verfügbar. Du musst sie installieren.

## Lösung: Stripe CLI installieren

### Option 1: Mit Scoop (Empfohlen, wenn Scoop installiert ist)

```powershell
scoop install stripe
```

### Option 2: Manueller Download (Einfachste Methode)

1. **Gehe zu:** https://github.com/stripe/stripe-cli/releases/latest
2. **Lade herunter:** `stripe_X.X.X_windows_x86_64.zip` (neueste Version)
3. **Entpacke die ZIP-Datei** (z.B. nach `C:\stripe\`)
4. **Füge zum PATH hinzu:**

**Windows 10/11:**
- Drücke `Win + X` → "System"
- Klicke auf "Erweiterte Systemeinstellungen"
- Klicke auf "Umgebungsvariablen"
- Unter "Systemvariablen" wähle "Path" → "Bearbeiten"
- Klicke "Neu" → Füge den Pfad hinzu: `C:\stripe\` (oder wo du es entpackt hast)
- Klicke "OK" auf allen Fenstern
- **WICHTIG:** Starte PowerShell/CMD neu!

**Oder per PowerShell (als Administrator):**
```powershell
# Pfad anpassen falls nötig
$stripePath = "C:\stripe"
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";$stripePath", [EnvironmentVariableTarget]::Machine)
```

### Option 3: Mit Chocolatey (wenn installiert)

```powershell
choco install stripe-cli
```

## Nach der Installation testen

**Neue PowerShell öffnen** (wichtig: alte schließen und neue öffnen!) und testen:

```powershell
stripe --version
```

Du solltest eine Versionsnummer sehen, z.B.:
```
stripe version 1.x.x
```

## Dann Webhook starten

```powershell
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## Alternative: Ohne PATH (temporär)

Falls du die Stripe CLI nicht zum PATH hinzufügen willst, kannst du den vollständigen Pfad verwenden:

```powershell
# Beispiel (Pfad anpassen!)
C:\stripe\stripe.exe listen --forward-to localhost:3000/api/stripe/webhook
```

## Troubleshooting

### "stripe: command not found" nach Installation

1. **Prüfe ob Datei existiert:**
   ```powershell
   Test-Path "C:\stripe\stripe.exe"
   ```

2. **Prüfe PATH:**
   ```powershell
   $env:Path -split ';' | Select-String stripe
   ```

3. **PowerShell neu starten** (wichtig!)

### Installation funktioniert nicht

**Manuelle Installation:**
1. Lade ZIP von GitHub herunter
2. Entpacke in einen Ordner (z.B. `C:\stripe\`)
3. Füge manuell zum PATH hinzu
4. PowerShell neu starten

## Schnellste Lösung

1. **Download:** https://github.com/stripe/stripe-cli/releases/latest
2. **Entpacke** nach `C:\stripe\`
3. **Füge zum PATH hinzu** (siehe oben)
4. **PowerShell neu starten**
5. **Test:** `stripe --version`

**Dann kannst du den Webhook starten!** 🚀

