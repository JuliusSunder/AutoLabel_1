# Authentifizierungs-Tests - Checkliste

## ⚡ Schnell-Test (5 Minuten)

### Setup
- [ ] Server läuft (`npm run dev` in `website/`)
- [ ] Browser-Konsole ist offen (F12)
- [ ] Environment Variables sind gesetzt

### Test 1: Google OAuth (2 Min)
1. [ ] Gehe zu http://localhost:3000/login
2. [ ] Klicke "Sign in with Google"
3. [ ] Wähle einen Google-Account
4. [ ] ✅ Redirect zu `/dashboard` erfolgt
5. [ ] ✅ User-Daten werden angezeigt
6. [ ] ✅ Console zeigt keine Fehler

### Test 2: Credentials Login (3 Min)
1. [ ] Gehe zu http://localhost:3000/register
2. [ ] Registriere mit Email/Passwort
3. [ ] Öffne Email und klicke Verifizierungs-Link
4. [ ] Gehe zu http://localhost:3000/login
5. [ ] Logge dich ein
6. [ ] ✅ Redirect zu `/dashboard` erfolgt
7. [ ] ✅ User-Daten werden angezeigt
8. [ ] ✅ Console zeigt keine Fehler

---

## 🔍 Detaillierter Test (15 Minuten)

### Vorbereitung
```bash
cd website
npm run dev
```

Öffne Browser-Konsole (F12) und gehe zu http://localhost:3000

---

### Test-Gruppe 1: Google OAuth

#### Test 1.1: Neuer Google User
**Ziel:** Neuer User kann sich mit Google registrieren

**Schritte:**
1. [ ] Gehe zu `/register`
2. [ ] Klicke "Sign up with Google"
3. [ ] Wähle einen Google-Account (der noch nicht registriert ist)

**Erwartetes Ergebnis:**
- [ ] Redirect zu `/dashboard`
- [ ] User ist eingeloggt
- [ ] Console zeigt: `[Register] Google sign-up initiated`
- [ ] Console zeigt: `[Auth] New Google user will be created`
- [ ] Console zeigt: `[Auth] Auto-verified OAuth user email`
- [ ] Dashboard zeigt User-Daten
- [ ] Subscription ist "Free"

**Bei Fehler prüfen:**
- [ ] GOOGLE_CLIENT_ID und GOOGLE_CLIENT_SECRET in .env
- [ ] Redirect URI in Google Cloud Console: `http://localhost:3000/api/auth/callback/google`
- [ ] Console-Fehler kopieren und analysieren

---

#### Test 1.2: Bestehender Google User
**Ziel:** Bestehender User kann sich mit Google einloggen

**Schritte:**
1. [ ] Gehe zu `/login`
2. [ ] Klicke "Sign in with Google"
3. [ ] Wähle den gleichen Google-Account wie in Test 1.1

**Erwartetes Ergebnis:**
- [ ] Redirect zu `/dashboard`
- [ ] User ist eingeloggt
- [ ] Console zeigt: `[Login] Google sign-in initiated`
- [ ] Console zeigt: `[Auth] Verified existing Google user`
- [ ] Dashboard zeigt User-Daten

**Bei Fehler prüfen:**
- [ ] Ist der User in der Datenbank?
- [ ] Ist emailVerified gesetzt?
- [ ] Console-Fehler analysieren

---

#### Test 1.3: Google OAuth mehrfach hintereinander
**Ziel:** OAuth funktioniert zuverlässig, auch bei mehrfachen Versuchen

**Schritte:**
1. [ ] Logge dich aus
2. [ ] Gehe zu `/login`
3. [ ] Klicke "Sign in with Google"
4. [ ] Wähle Account
5. [ ] Warte bis Dashboard lädt
6. [ ] Logge dich aus
7. [ ] Wiederhole Schritte 2-5 noch 2x

**Erwartetes Ergebnis:**
- [ ] Alle 3 Versuche funktionieren
- [ ] Keine Fehler in der Console
- [ ] Kein "stuck" auf Google-Seite

**Bei Fehler prüfen:**
- [ ] Werden Sessions korrekt beendet?
- [ ] Gibt es Cookie-Probleme?
- [ ] Console-Fehler analysieren

---

### Test-Gruppe 2: Credentials Login

#### Test 2.1: Neue Registrierung
**Ziel:** Neuer User kann sich mit Email/Passwort registrieren

**Schritte:**
1. [ ] Gehe zu `/register`
2. [ ] Gib Name, Email, Passwort ein
3. [ ] Klicke "Sign Up"

**Erwartetes Ergebnis:**
- [ ] Redirect zu `/login?registered=true`
- [ ] Success-Message: "Registration successful! Please check your email..."
- [ ] Email mit Verifizierungs-Link erhalten

**Bei Fehler prüfen:**
- [ ] RESEND_API_KEY in .env
- [ ] EMAIL_FROM in .env
- [ ] Domain in Resend verifiziert?
- [ ] Console-Fehler analysieren

---

#### Test 2.2: Login ohne Email-Verifizierung
**Ziel:** Nicht verifizierte User können sich nicht einloggen

**Schritte:**
1. [ ] Gehe zu `/login`
2. [ ] Gib Email und Passwort vom registrierten User ein (OHNE Email zu verifizieren)
3. [ ] Klicke "Sign In"

**Erwartetes Ergebnis:**
- [ ] Fehler-Message: "Please verify your email address..."
- [ ] Button "Resend verification email" erscheint
- [ ] User ist NICHT eingeloggt
- [ ] Kein Redirect zu `/dashboard`

**Bei Fehler prüfen:**
- [ ] Ist emailVerified in DB null?
- [ ] Console-Fehler analysieren

---

#### Test 2.3: Email-Verifizierung
**Ziel:** Email-Verifizierung funktioniert

**Schritte:**
1. [ ] Öffne die Verifizierungs-Email
2. [ ] Klicke auf den Verifizierungs-Link

**Erwartetes Ergebnis:**
- [ ] Redirect zu `/verify-email?token=...`
- [ ] Success-Message: "Email verified successfully!"
- [ ] Link zu `/login`

**Bei Fehler prüfen:**
- [ ] Token in URL vorhanden?
- [ ] Token in Datenbank vorhanden?
- [ ] Token abgelaufen? (24h Gültigkeit)

---

#### Test 2.4: Login nach Email-Verifizierung
**Ziel:** Verifizierte User können sich einloggen

**Schritte:**
1. [ ] Gehe zu `/login`
2. [ ] Gib Email und Passwort ein
3. [ ] Klicke "Sign In"

**Erwartetes Ergebnis:**
- [ ] Redirect zu `/dashboard`
- [ ] User ist eingeloggt
- [ ] Console zeigt: `[Auth] Credentials sign-in successful`
- [ ] Console zeigt: `[Login] Sign-in result: { ok: true, ... }`
- [ ] Dashboard zeigt User-Daten

**Bei Fehler prüfen:**
- [ ] Ist emailVerified in DB gesetzt?
- [ ] Ist Passwort korrekt?
- [ ] Console-Fehler analysieren

---

#### Test 2.5: Login mit falschem Passwort
**Ziel:** Falsches Passwort wird abgelehnt

**Schritte:**
1. [ ] Gehe zu `/login`
2. [ ] Gib Email ein
3. [ ] Gib falsches Passwort ein
4. [ ] Klicke "Sign In"

**Erwartetes Ergebnis:**
- [ ] Fehler-Message: "Invalid email or password"
- [ ] User ist NICHT eingeloggt
- [ ] Kein Redirect zu `/dashboard`

---

#### Test 2.6: Login mehrfach hintereinander
**Ziel:** Credentials Login funktioniert zuverlässig

**Schritte:**
1. [ ] Logge dich ein
2. [ ] Logge dich aus
3. [ ] Wiederhole 5x

**Erwartetes Ergebnis:**
- [ ] Alle 5 Versuche funktionieren
- [ ] Keine Fehler in der Console
- [ ] Keine Race Conditions

**Bei Fehler prüfen:**
- [ ] Werden Sessions korrekt beendet?
- [ ] Console-Fehler analysieren

---

### Test-Gruppe 3: Session & Persistenz

#### Test 3.1: Session-Persistenz
**Ziel:** Session bleibt nach Reload erhalten

**Schritte:**
1. [ ] Logge dich ein (Google oder Credentials)
2. [ ] Gehe zu `/dashboard`
3. [ ] Drücke F5 (Reload)

**Erwartetes Ergebnis:**
- [ ] User bleibt eingeloggt
- [ ] Dashboard zeigt weiterhin User-Daten
- [ ] Kein Redirect zu `/login`

---

#### Test 3.2: Protected Routes
**Ziel:** Nicht eingeloggte User werden zu `/login` weitergeleitet

**Schritte:**
1. [ ] Logge dich aus
2. [ ] Gehe direkt zu `/dashboard`

**Erwartetes Ergebnis:**
- [ ] Redirect zu `/login`
- [ ] User ist NICHT auf `/dashboard`

---

#### Test 3.3: Logout
**Ziel:** Logout funktioniert korrekt

**Schritte:**
1. [ ] Logge dich ein
2. [ ] Gehe zu `/dashboard`
3. [ ] Klicke "Logout"

**Erwartetes Ergebnis:**
- [ ] Redirect zu `/`
- [ ] User ist ausgeloggt
- [ ] Bei Besuch von `/dashboard` → Redirect zu `/login`

---

### Test-Gruppe 4: Edge Cases

#### Test 4.1: Doppelte Registrierung
**Ziel:** Bereits registrierte Email wird abgelehnt

**Schritte:**
1. [ ] Gehe zu `/register`
2. [ ] Gib Email ein, die bereits registriert ist
3. [ ] Klicke "Sign Up"

**Erwartetes Ergebnis:**
- [ ] Fehler-Message: "Email already registered" oder ähnlich
- [ ] Kein neuer User wird erstellt

---

#### Test 4.2: Resend Verification Email
**Ziel:** Verifizierungs-Email kann erneut gesendet werden

**Schritte:**
1. [ ] Registriere neuen User (ohne Email zu verifizieren)
2. [ ] Versuche Login
3. [ ] Klicke "Resend verification email"

**Erwartetes Ergebnis:**
- [ ] Success-Message: "Verification email has been sent..."
- [ ] Neue Email wird empfangen

---

#### Test 4.3: Abgelaufener Verification Token
**Ziel:** Abgelaufene Tokens werden abgelehnt

**Schritte:**
1. [ ] Erstelle einen User
2. [ ] Warte 24+ Stunden (oder manipuliere DB)
3. [ ] Klicke auf Verifizierungs-Link

**Erwartetes Ergebnis:**
- [ ] Fehler-Message: "Verification token has expired"
- [ ] User kann neue Email anfordern

---

## 📊 Test-Ergebnisse

### Zusammenfassung
- [ ] Alle Tests bestanden
- [ ] Einige Tests fehlgeschlagen (siehe unten)

### Fehlgeschlagene Tests
```
Test-ID: ___________
Fehler: _____________________________________________
Console-Log: ________________________________________
```

---

## 🐛 Bekannte Probleme

### Problem 1: Google OAuth zeigt Accounts, aber loggt nicht ein
**Status:** ✅ BEHOBEN
**Fix:** Verbesserte signIn Callback Logik mit User-Existenz-Prüfung

### Problem 2: Credentials Login manchmal erfolgreich, manchmal nicht
**Status:** ✅ BEHOBEN
**Fix:** Entfernung der doppelten Email-Verifizierungs-Prüfung

---

## 📝 Notizen

### Console-Logs die du sehen solltest:

**Bei Google OAuth:**
```
[Login] Google sign-in initiated
[Auth] Google OAuth sign-in attempt { email: "..." }
[Auth] Verified existing Google user { email: "..." }
[Auth] JWT created { userId: "...", email: "..." }
```

**Bei Credentials Login:**
```
[Auth] Credentials sign-in successful { email: "..." }
[Auth] JWT created { userId: "...", email: "..." }
[Login] Sign-in result: { ok: true, error: null, ... }
```

**Bei neuer User-Erstellung:**
```
[Auth] Creating new user { email: "..." }
[Auth] Auto-verified OAuth user email { email: "..." }
[Auth] User created successfully { userId: "..." }
```

---

## 🚀 Nach erfolgreichen Tests

1. [ ] Alle Tests dokumentieren
2. [ ] Production Deployment vorbereiten
3. [ ] Environment Variables für Production setzen
4. [ ] Google OAuth Redirect URIs für Production Domain hinzufügen
5. [ ] Monitoring/Error-Tracking einrichten (optional)

---

## 📞 Bei Problemen

1. **Prüfe Console-Logs** - Alle Events werden geloggt
2. **Prüfe Network-Tab** - API-Requests analysieren
3. **Prüfe Datenbank** - User, emailVerified, Accounts prüfen
4. **Prüfe .env** - Alle Variables korrekt?
5. **Siehe AUTH_FIXES_SUMMARY.md** - Detaillierte Informationen

---

## ✅ Test abgeschlossen

Datum: ___________
Tester: ___________
Ergebnis: [ ] Bestanden [ ] Fehlgeschlagen
Notizen: _____________________________________________

