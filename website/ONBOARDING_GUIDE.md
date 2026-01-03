# Dashboard Onboarding Guide

## Übersicht

Der Dashboard Onboarding Guide ist ein interaktiver Schritt-für-Schritt-Assistent, der neue Nutzer durch die Einrichtung von AutoLabel führt.

## Features

### 1. Automatische Erkennung neuer Nutzer
- Nutzer mit `hasCompletedOnboarding: false` sehen automatisch die Onboarding-Card im Dashboard
- Die Card erscheint prominent oben im Dashboard mit einem "Guide me through" Button

### 2. Interaktiver Multi-Step-Guide
Der Guide führt durch 4 Hauptschritte:

**Schritt 1: Willkommen**
- Übersicht über AutoLabel
- Was wird benötigt (Windows-PC, Drucker, Email-Zugang)

**Schritt 2: App herunterladen**
- Detaillierte Installationsanleitung
- Windows SmartScreen Hinweise
- Login-Daten Übersicht
- Warnung für OAuth-Nutzer ohne Passwort

**Schritt 3: Email-Account verbinden**
- Anleitung zum Hinzufügen eines Email-Accounts
- Erklärung zu App-Passwörtern
- Provider-spezifische Hinweise (Gmail, Outlook)

**Schritt 4: Ersten Scan durchführen**
- Anleitung zum Scannen und Drucken
- Übersicht über weitere Features (Batch Printing, Custom Footer, Filter)

### 3. Progress Tracking
- Visueller Progress Bar
- Schritt-Navigation (Vor/Zurück)
- Jederzeit überspringbar

### 4. Persistierung
- `hasCompletedOnboarding` Flag in der Datenbank
- API-Endpoint zum Markieren als abgeschlossen: `/api/user/complete-onboarding`

## Implementierung

### Dateien

**Frontend:**
- `website/app/components/OnboardingGuide.tsx` - Hauptkomponente
- `website/app/dashboard/page.tsx` - Integration im Dashboard

**Backend:**
- `website/app/api/user/complete-onboarding/route.ts` - API zum Abschließen
- `website/app/api/auth/session/route.ts` - Erweitert um `hasCompletedOnboarding`

**Datenbank:**
- `website/prisma/schema.prisma` - User Model mit `hasCompletedOnboarding` Flag

### Datenbankschema

```prisma
model User {
  // ...
  hasCompletedOnboarding Boolean @default(false)
  // ...
}
```

## Setup

### 1. Datenbank Migration

Nach dem Hinzufügen des neuen Feldes muss die Datenbank aktualisiert werden:

```bash
cd website
npx prisma db push
```

Oder für Production mit Migrations:

```bash
cd website
npx prisma migrate dev --name add_onboarding_flag
```

### 2. Bestehende Nutzer

Bestehende Nutzer haben automatisch `hasCompletedOnboarding: false`. 

Um bestehenden Nutzern das Onboarding nicht anzuzeigen, kann man sie manuell auf `true` setzen:

```sql
UPDATE "User" SET "hasCompletedOnboarding" = true WHERE "createdAt" < '2026-01-03';
```

Oder über Prisma Studio:

```bash
cd website
npx prisma studio
```

## Verwendung

### Für Nutzer

1. Nach der Registrierung erscheint automatisch die grüne Onboarding-Card
2. Klick auf "Guide me through" öffnet den interaktiven Guide
3. Durchlaufen der 4 Schritte mit Vor/Zurück-Navigation
4. Abschluss mit "Guide abschließen" oder jederzeit überspringen

### Für Entwickler

**Onboarding-Status prüfen:**
```typescript
const userData = await fetch("/api/auth/session");
if (!userData.hasCompletedOnboarding) {
  // Zeige Onboarding
}
```

**Onboarding abschließen:**
```typescript
await fetch("/api/user/complete-onboarding", { method: "POST" });
```

**Onboarding zurücksetzen (für Tests):**
```typescript
// Direkt in der Datenbank
await prisma.user.update({
  where: { email: "test@example.com" },
  data: { hasCompletedOnboarding: false }
});
```

## Anpassungen

### Schritte hinzufügen/ändern

In `OnboardingGuide.tsx` das `steps` Array anpassen:

```typescript
const steps: Step[] = [
  {
    id: 1,
    title: "Neuer Schritt",
    description: "Beschreibung",
    icon: <Icon className="w-8 h-8" />,
    details: (
      <div>
        {/* Custom Content */}
      </div>
    ),
  },
  // ...
];
```

### Styling anpassen

Die Komponente verwendet Tailwind CSS. Farben und Styles können direkt in der Komponente angepasst werden.

### Bedingungen für Anzeige ändern

Aktuell wird das Onboarding für alle Nutzer mit `hasCompletedOnboarding: false` angezeigt.

Alternative Bedingungen (in `dashboard/page.tsx`):

```typescript
// Nur für Nutzer < 7 Tage alt
const isNewUser = new Date(userData.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
const shouldShowOnboarding = userData && !userData.hasCompletedOnboarding && isNewUser;

// Nur für Free-Plan Nutzer
const shouldShowOnboarding = userData && !userData.hasCompletedOnboarding && userData.subscription?.plan === 'free';
```

## Best Practices

1. **Nicht aufdringlich:** Der Guide ist optional und kann jederzeit übersprungen werden
2. **Visuell ansprechend:** Icons, Farben und Progress Bar machen den Guide attraktiv
3. **Kontextbezogen:** Warnung für OAuth-Nutzer ohne Passwort wird nur angezeigt wenn relevant
4. **Persistiert:** Der Status wird in der Datenbank gespeichert, nicht im localStorage

## Zukünftige Erweiterungen

- [ ] Onboarding-Guide auch in der Desktop-App (bereits vorhanden als "Quick Start")
- [ ] Analytics: Tracking welche Schritte übersprungen werden
- [ ] Personalisierung: Unterschiedliche Guides für Free/Plus/Pro Nutzer
- [ ] Video-Tutorials einbetten
- [ ] Interaktive Tooltips im Dashboard nach dem Onboarding

