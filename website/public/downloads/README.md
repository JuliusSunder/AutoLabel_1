# Downloads Ordner

Dieser Ordner ist für lokale Development-Downloads gedacht.

## Setup für lokales Testing

Kopiere deine `AutoLabel-Setup.exe` in diesen Ordner:

```bash
cp /pfad/zu/AutoLabel-Setup.exe website/public/downloads/
```

Die Datei wird dann unter `http://localhost:3000/downloads/AutoLabel-Setup.exe` verfügbar sein.

## Wichtig

- **.exe Dateien werden NICHT ins Git-Repository committed** (siehe `.gitignore`)
- Für Production solltest du einen richtigen File-Hosting-Service verwenden (siehe `DOWNLOAD_SETUP.md`)

## Environment Variable setzen

In deiner `.env.local` Datei:

```env
APP_DOWNLOAD_URL="http://localhost:3000/downloads/AutoLabel-Setup.exe"
```

