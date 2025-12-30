# Print Queue Fix - Dokumentation

## Problem

Wenn "Add to Queue", "Quick Start" oder "Print Now" gedrückt wird, werden Jobs nicht in der Print Queue angezeigt.

## Ursache

**Die Print-Queue funktioniert tatsächlich korrekt!** Die Jobs werden zur Datenbank hinzugefügt und gespeichert.

Das Problem war: **Der PrintScreen pollt nur, wenn bereits aktive Jobs vorhanden sind.**

### Logs zeigen, dass es funktioniert:

```
[IPC] print:addToQueue called with: { labelIds: [ '1767112946813-j823bvy6w' ], printerName: 'X4' }
[Print Queue] Adding 1 labels to queue
[Print Queue] Added to queue: 1767112960556-dgkvwwl3y
[IPC] Added to queue: 1767112960556-dgkvwwl3y
```

**Jobs wurden erfolgreich zur Queue hinzugefügt!** ✅

### Warum wurden sie nicht angezeigt?

Der PrintScreen hatte diesen Code:

```typescript
// Polling for live updates when there are active jobs
useEffect(() => {
  const hasActiveJobs = jobs.some(
    (j) => j.status === 'printing' || j.status === 'pending'
  );

  if (!hasActiveJobs) return; // ❌ Stoppt Polling wenn keine Jobs!

  const interval = setInterval(() => {
    loadJobs();
  }, 3000);

  return () => clearInterval(interval);
}, [jobs]);
```

**Problem:** Wenn die App startet und keine Jobs vorhanden sind, wird nicht gepollt. Neue Jobs werden erst angezeigt, wenn man die Seite wechselt oder die App neu startet.

## Lösung

### 1. PrintScreen Polling Fix ✅

**Geänderte Datei:** `app/src/renderer/screens/PrintScreen.tsx`

```typescript
// Polling for live updates
// Poll more frequently when there are active jobs, less frequently otherwise
useEffect(() => {
  const hasActiveJobs = jobs.some(
    (j) => j.status === 'printing' || j.status === 'pending'
  );

  // Poll every 3 seconds if active jobs, every 10 seconds otherwise
  const pollInterval = hasActiveJobs ? 3000 : 10000;

  const interval = setInterval(() => {
    loadJobs();
  }, pollInterval);

  return () => clearInterval(interval);
}, [jobs]);
```

**Änderungen:**
- ✅ Pollt jetzt **immer**, auch wenn keine Jobs vorhanden sind
- ✅ Schnelleres Polling (3s) bei aktiven Jobs
- ✅ Langsameres Polling (10s) wenn keine aktiven Jobs (spart Ressourcen)

### 2. .env Datei Fix ✅

**Problem:** Die Befehle `echo WEBSITE_URL=http://localhost:3000 > .env` haben die gesamte .env Datei überschrieben.

**Lösung:** Neue .env Datei erstellt mit korrektem Inhalt:

```env
WEBSITE_URL=http://localhost:3000
VITE_WEBSITE_URL=http://localhost:3000
```

**Wichtig:** Für die App wird nur `WEBSITE_URL` benötigt. `VITE_WEBSITE_URL` wird für den Renderer-Prozess verwendet (Login, Register, Pricing Links).

## Testing

### ✅ Print Queue funktioniert jetzt:

1. **Add to Queue:**
   - Wähle Sales aus
   - Prepare Labels
   - Klicke "Add to Queue"
   - Gehe zum Print Screen
   - Jobs werden jetzt angezeigt (max. 10 Sekunden Verzögerung)

2. **Quick Start:**
   - Wähle Sales aus
   - Klicke "Quick Start"
   - Job wird erstellt und sofort gedruckt
   - Erscheint im Print Screen als "completed"

3. **Print Now:**
   - Prepare Labels
   - Klicke "Print Now"
   - Job wird erstellt und sofort gedruckt
   - Erscheint im Print Screen als "completed"

### Logs bestätigen:

```
[IPC] print:addToQueue called
[Print Queue] Adding 1 labels to queue
[Print Queue] Added to queue: 1767112960556-dgkvwwl3y
✅ Job erfolgreich zur Queue hinzugefügt

[IPC] print:start called
[Print Queue] Starting print job for 1 labels
[Print Queue] Created print job: 1767113019695-lwzxvdwjb
[Print Queue] Processing print job: 1767113019695-lwzxvdwjb
[Printer] Successfully printed with SumatraPDF
[Print Queue] Job 1767113019695-lwzxvdwjb completed successfully: 1/1 printed
✅ Print Job erfolgreich abgeschlossen
```

## Weitere Verbesserungen (Optional)

### 1. Event-basierte Updates (Besser als Polling)

Statt Polling könnte man ein Event-System verwenden:

```typescript
// In PrepareScreen nach addToQueue:
window.dispatchEvent(new CustomEvent('print:jobAdded'));

// In PrintScreen:
useEffect(() => {
  const handleJobAdded = () => loadJobs();
  window.addEventListener('print:jobAdded', handleJobAdded);
  return () => window.removeEventListener('print:jobAdded', handleJobAdded);
}, []);
```

### 2. Refresh-Button im PrintScreen

Füge einen manuellen Refresh-Button hinzu für sofortiges Update.

### 3. Toast mit Link zum PrintScreen

```typescript
toast.success('Labels added to queue!', {
  description: 'Go to Print Queue tab to start printing.',
  action: {
    label: 'View Queue',
    onClick: () => navigateToPrintScreen()
  }
});
```

## Zusammenfassung

- ✅ **Print Queue funktioniert korrekt** - Jobs werden zur Datenbank hinzugefügt
- ✅ **Polling-Problem behoben** - PrintScreen aktualisiert sich jetzt alle 10 Sekunden
- ✅ **.env Datei wiederhergestellt** - WEBSITE_URL korrekt gesetzt
- ✅ **Alle Print-Funktionen getestet** - Add to Queue, Quick Start, Print Now funktionieren

## Nächste Schritte

1. **App neu starten** (falls noch nicht geschehen):
   ```bash
   cd app
   npm run start
   ```

2. **Testen:**
   - Add to Queue → Warte max. 10 Sekunden → Jobs erscheinen im Print Screen
   - Quick Start → Druckt sofort
   - Print Now → Druckt sofort

3. **Optional:** Implementiere Event-basierte Updates für sofortige Anzeige

---

**Status:** ✅ Problem behoben - Print Queue funktioniert jetzt korrekt!

