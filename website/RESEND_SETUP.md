# Resend E-Mail Setup - Schritt für Schritt

## Problem
Die Test-Domain `onboarding@resend.dev` funktioniert nicht mehr ohne Verifizierung.

## Lösung: Eigene Domain verifizieren

### Schritt 1: Domain zu Resend hinzufügen

1. Gehe zu https://resend.com/domains
2. Klicke auf **"Add Domain"**
3. Gib deine Domain ein (z.B. `autolabel.com` oder eine Subdomain wie `mail.autolabel.com`)
4. Klicke auf **"Add"**

### Schritt 2: DNS-Einträge hinzufügen

Resend zeigt dir die benötigten DNS-Einträge. Du musst diese in deinem DNS-Provider (z.B. Cloudflare, Namecheap, etc.) hinzufügen:

**Beispiel DNS-Einträge:**
```
Type: TXT
Name: @
Value: resend-domain-verification=abc123...
```

```
Type: MX
Name: @
Value: feedback-smtp.resend.com
Priority: 10
```

```
Type: TXT
Name: resend._domainkey
Value: p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC...
```

### Schritt 3: Domain verifizieren

1. Nach dem Hinzufügen der DNS-Einträge: Warte 5-10 Minuten
2. Gehe zurück zu https://resend.com/domains
3. Klicke auf **"Verify"** neben deiner Domain
4. Wenn alles korrekt ist, wird die Domain als **"Verified"** angezeigt

### Schritt 4: E-Mail-Adresse konfigurieren

Nach der Verifizierung kannst du eine E-Mail-Adresse wie `noreply@ihredomain.com` verwenden.

**In `.env.local`:**
```env
EMAIL_FROM="noreply@ihredomain.com"
```

## Alternative: Für lokales Testing ohne Domain

Falls du keine Domain hast oder schnell testen möchtest:

### Option A: Resend Test-Modus verwenden

Resend bietet manchmal einen Test-Modus. Prüfe im Dashboard, ob es eine Test-Option gibt.

### Option B: Temporär eine andere E-Mail-Service verwenden

Für lokales Testing kannst du auch andere Services wie:
- **Mailtrap** (für Development)
- **Ethereal Email** (kostenloser Test-Service)
- **MailHog** (lokaler SMTP-Server)

## Nach der Domain-Verifizierung

1. **Server neu starten:**
   ```bash
   cd website
   npm run dev
   ```

2. **Testen:**
   - Gehe zu `/forgot-password`
   - Gib deine E-Mail ein
   - Du solltest jetzt eine E-Mail erhalten

## Troubleshooting

### Domain wird nicht verifiziert?
- Prüfe, ob alle DNS-Einträge korrekt sind
- Warte länger (DNS kann bis zu 48 Stunden dauern, normalerweise 5-10 Minuten)
- Prüfe im Resend Dashboard, welche Einträge fehlen

### E-Mails kommen nicht an?
- Prüfe den Spam-Ordner
- Prüfe die Resend Logs: https://resend.com/emails
- Prüfe die Server-Logs auf Fehlermeldungen

