# AutoLabel Installation Guide

## 📥 Installation

### System Requirements

- **Operating System:** Windows 10/11 (64-bit)
- **RAM:** Minimum 4 GB
- **Disk Space:** 200 MB
- **Internet:** Required for email scanning

---

## 🚀 Installation Steps

### 1. Download Installer

Download `AutoLabel-1.0.0 Setup.exe` from:
- GitHub Releases
- Official Website
- Direct Download Link

### 2. Run Installer

Double-click `AutoLabel-1.0.0 Setup.exe` to start installation.

---

## ⚠️ Windows SmartScreen Warning

### What to Expect

Beim ersten Start zeigt Windows möglicherweise diese Sicherheitswarnung:

```
Windows protected your PC
Microsoft Defender SmartScreen prevented an unrecognized app from starting.
Running this app might put your PC at risk.

[More info]  [Don't run]
```

### Why This Happens

**Dies ist NORMAL und SICHER!**

AutoLabel verwendet ein **Self-Signed Certificate** für Testing/Development. Windows zeigt diese Warnung bei allen Self-Signed Certificates.

**Die App ist sicher** - das Certificate wurde von uns selbst signiert.

### How to Proceed

1. **Klicken Sie auf "More info"**
   
   ![SmartScreen Step 1](https://via.placeholder.com/400x200?text=Click+More+Info)

2. **Klicken Sie auf "Run anyway"**
   
   ![SmartScreen Step 2](https://via.placeholder.com/400x200?text=Click+Run+Anyway)

3. **Installation startet automatisch**

---

## 📦 Installation Process

### 1. Welcome Screen

- AutoLabel-Logo wird angezeigt
- Klicken Sie auf "Next" oder "Install"

### 2. Installation Progress

- Fortschrittsbalken zeigt Installation
- Dateien werden kopiert
- Shortcuts werden erstellt

### 3. Installation Complete

- "Installation Complete" Meldung
- Option: "Launch AutoLabel"
- Klicken Sie auf "Finish"

---

## ✅ Post-Installation

### Verify Installation

Nach erfolgreicher Installation finden Sie:

1. **Startmenü-Eintrag**
   - Windows-Taste drücken
   - "AutoLabel" eingeben
   - AutoLabel-Icon erscheint

2. **Desktop-Icon** (optional)
   - AutoLabel-Logo auf Desktop
   - Doppelklick zum Starten

3. **Installationsordner**
   - `C:\Users\{YourUsername}\AppData\Local\AutoLabel`
   - Enthält App-Dateien und Datenbank

### First Launch

1. **App starten**
   - Startmenü → AutoLabel
   - Oder Desktop-Icon doppelklicken

2. **Initial Setup**
   - Email-Konto konfigurieren
   - Drucker auswählen
   - Label-Einstellungen anpassen

---

## 🔧 Troubleshooting

### SmartScreen lässt sich nicht umgehen

**Problem:** "Run anyway" Button erscheint nicht

**Lösung:**
1. Rechtsklick auf `AutoLabel-1.0.0 Setup.exe`
2. **Properties** → **General** Tab
3. Häkchen bei "Unblock" setzen
4. **OK** klicken
5. Installer erneut ausführen

### Installation schlägt fehl

**Problem:** Installation bricht ab

**Lösung:**
1. Alte Version deinstallieren (falls vorhanden)
2. Windows neu starten
3. Installer als Administrator ausführen:
   - Rechtsklick auf `AutoLabel-1.0.0 Setup.exe`
   - "Run as administrator"

### App startet nicht

**Problem:** App öffnet sich nicht nach Installation

**Lösung:**
1. Windows Defender Firewall prüfen
2. Antivirus-Software prüfen (AutoLabel zur Whitelist hinzufügen)
3. Event Viewer prüfen (Windows-Taste + X → Event Viewer)

---

## 🔄 Update Installation

### Updating AutoLabel

1. **Alte Version deinstallieren** (optional)
   - Systemsteuerung → Programme
   - "AutoLabel" auswählen
   - "Uninstall" klicken

2. **Neue Version installieren**
   - Neuen Installer herunterladen
   - Installation wie oben beschrieben

3. **Daten bleiben erhalten**
   - User-Daten und Einstellungen werden beibehalten
   - Datenbank wird automatisch migriert

---

## 🗑️ Deinstallation

### Uninstall AutoLabel

1. **Windows 10:**
   - Einstellungen → Apps → Apps & Features
   - "AutoLabel" suchen
   - "Uninstall" klicken

2. **Windows 11:**
   - Einstellungen → Apps → Installed Apps
   - "AutoLabel" suchen
   - ⋮ (Drei Punkte) → "Uninstall"

3. **Systemsteuerung:**
   - Systemsteuerung → Programme und Features
   - "AutoLabel" auswählen
   - "Uninstall" klicken

### What Gets Removed

- ✅ App-Dateien
- ✅ Startmenü-Eintrag
- ✅ Desktop-Icon
- ⚠️ User-Daten bleiben erhalten (optional löschen)

### Remove User Data (optional)

Wenn Sie alle Daten löschen möchten:

1. **Öffnen Sie:**
   - `C:\Users\{YourUsername}\AppData\Local\AutoLabel`

2. **Löschen Sie:**
   - `autolabel.db` (Datenbank)
   - `config.json` (Einstellungen)
   - `logs/` (Log-Dateien)

---

## 🔐 Security & Privacy

### Is AutoLabel Safe?

✅ **Ja, AutoLabel ist sicher!**

- **Open Source** - Code ist öffentlich einsehbar
- **No Telemetry** - Keine Daten werden gesammelt
- **Local Database** - Alle Daten bleiben lokal
- **No Cloud** - Keine Cloud-Verbindung
- **Signed Installer** - Digital signiert (Self-Signed)

### What Data is Stored?

AutoLabel speichert lokal:
- Email-Konfiguration (verschlüsselt)
- Label-Daten
- Druckverlauf
- App-Einstellungen

**Keine Daten werden an externe Server gesendet!**

### Permissions

AutoLabel benötigt:
- **Email-Zugriff** - Zum Scannen von Labels
- **Drucker-Zugriff** - Zum Drucken von Labels
- **Dateisystem** - Zum Speichern der Datenbank

---

## 📞 Support

### Need Help?

- **Documentation:** [SELF_SIGNED_CERTIFICATE.md](SELF_SIGNED_CERTIFICATE.md)
- **GitHub Issues:** [github.com/autolabel/issues](https://github.com)
- **Email:** support@autolabel.app

### Common Questions

**Q: Warum zeigt Windows eine Warnung?**
A: AutoLabel verwendet ein Self-Signed Certificate. Dies ist normal für Testing/Development. Die App ist sicher.

**Q: Ist AutoLabel kostenlos?**
A: Ja, AutoLabel ist Open Source und kostenlos.

**Q: Funktioniert AutoLabel offline?**
A: Nein, AutoLabel benötigt Internet zum Email-Scannen.

**Q: Welche Email-Provider werden unterstützt?**
A: Gmail, Outlook, Yahoo, ProtonMail, GMX, Web.de und alle IMAP-fähigen Provider.

---

## 📄 Production Certificate (Future)

### Upgrade to Professional Certificate

**Für zukünftige Versionen:**

Wir planen ein Upgrade auf ein professionelles Code Signing Certificate:

- ✅ **Keine SmartScreen Warnung**
- ✅ **Sofortige Installation**
- ✅ **Professionelles Aussehen**
- ✅ **Vertrauenswürdige CA**

**Kosten:** ~$200-400/Jahr

**Timeline:** Wenn AutoLabel erfolgreich ist und Budget vorhanden ist.

---

## ✅ Installation Complete!

Herzlichen Glückwunsch! AutoLabel ist jetzt installiert und einsatzbereit.

**Next Steps:**
1. App starten
2. Email-Konto konfigurieren
3. Drucker auswählen
4. Ersten Label drucken

**Viel Erfolg mit AutoLabel! 🚀**

