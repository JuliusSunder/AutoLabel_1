# AutoLabel Website Changelog

## [Unreleased] - 2026-01-03

### Added - Dashboard Onboarding Guide

#### Features
- **Interaktiver Onboarding-Guide** für neue Nutzer im Dashboard
  - 4-Schritt-Wizard: Willkommen → App Download → Email-Account → Erster Scan
  - Visueller Progress Bar und Schritt-Navigation
  - Jederzeit überspringbar mit "Guide überspringen" Button
  - Kontextbezogene Hinweise (z.B. Passwort-Warnung für OAuth-Nutzer)

- **Onboarding-Card im Dashboard**
  - Erscheint prominent für neue Nutzer (grüner Gradient)
  - "Guide me through" Button öffnet den interaktiven Guide
  - "Ich kenne mich schon aus" Link zum Überspringen

- **Persistierung des Onboarding-Status**
  - Neues `hasCompletedOnboarding` Flag im User-Model
  - API-Endpoint `/api/user/complete-onboarding` zum Markieren als abgeschlossen
  - Session API erweitert um Onboarding-Status

#### Dateien
- `website/app/components/OnboardingGuide.tsx` - Neue Komponente
- `website/app/api/user/complete-onboarding/route.ts` - Neue API-Route
- `website/app/dashboard/page.tsx` - Integration im Dashboard
- `website/app/api/auth/session/route.ts` - Erweitert um `hasCompletedOnboarding`
- `website/prisma/schema.prisma` - User Model erweitert
- `website/ONBOARDING_GUIDE.md` - Dokumentation

#### Datenbank-Migration erforderlich
```bash
cd website
npx prisma db push
```

#### User Experience
- Neue Nutzer sehen automatisch die Onboarding-Card nach dem ersten Login
- Der Guide erklärt Schritt für Schritt: Installation, Email-Setup, Ersten Scan
- Visuelle Elemente (Icons, Farben, Progress Bar) machen den Guide ansprechend
- Optional und nicht aufdringlich - kann jederzeit übersprungen werden

#### Technical Details
- TypeScript + React
- Tailwind CSS für Styling
- Modal-basierte UI mit Portal-Rendering
- State Management für Multi-Step-Navigation
- Prisma für Datenbank-Persistierung

---

## Frühere Versionen

Siehe Git History für Details zu früheren Implementierungen.

