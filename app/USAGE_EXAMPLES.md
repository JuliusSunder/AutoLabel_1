# Usage Limits & License - Beispiele für UI-Integration

## License API verwenden

### 1. License Info abrufen

```typescript
// In einem React Component
const [license, setLicense] = useState<LicenseInfo | null>(null);

useEffect(() => {
  const fetchLicense = async () => {
    const licenseInfo = await window.autolabel.license.get();
    setLicense(licenseInfo);
  };
  
  fetchLicense();
}, []);

// Anzeige
{license && (
  <div>
    <p>Plan: {license.plan.toUpperCase()}</p>
    {license.licenseKey && (
      <p>License Key: {license.licenseKey}</p>
    )}
  </div>
)}
```

### 2. Usage Info anzeigen

```typescript
const [usage, setUsage] = useState<UsageInfo | null>(null);

useEffect(() => {
  const fetchUsage = async () => {
    const usageInfo = await window.autolabel.license.usage();
    setUsage(usageInfo);
  };
  
  fetchUsage();
}, []);

// Anzeige mit Progress Bar
{usage && (
  <div>
    <p>
      Labels verwendet: {usage.labelsUsed} / {usage.limit === -1 ? '∞' : usage.limit}
    </p>
    {usage.limit !== -1 && (
      <div className="progress-bar">
        <div 
          className="progress" 
          style={{ width: `${(usage.labelsUsed / usage.limit) * 100}%` }}
        />
      </div>
    )}
    {usage.remaining !== -1 && usage.remaining < 5 && (
      <p className="warning">
        ⚠️ Nur noch {usage.remaining} Labels verfügbar!
      </p>
    )}
  </div>
)}
```

### 3. License Key validieren

```typescript
const [licenseKey, setLicenseKey] = useState('');
const [validating, setValidating] = useState(false);
const [error, setError] = useState('');

const handleValidate = async () => {
  setValidating(true);
  setError('');
  
  const result = await window.autolabel.license.validate(licenseKey);
  
  if (result.success) {
    alert('License erfolgreich aktiviert!');
    // Refresh UI
    window.location.reload();
  } else {
    setError(result.error || 'Validierung fehlgeschlagen');
  }
  
  setValidating(false);
};

// UI
<div>
  <input
    type="text"
    value={licenseKey}
    onChange={(e) => setLicenseKey(e.target.value)}
    placeholder="License Key eingeben"
  />
  <button onClick={handleValidate} disabled={validating}>
    {validating ? 'Validiere...' : 'Aktivieren'}
  </button>
  {error && <p className="error">{error}</p>}
</div>
```

### 4. Batch Printing Button

```typescript
const [canBatch, setCanBatch] = useState(false);

useEffect(() => {
  const checkBatchPrinting = async () => {
    const allowed = await window.autolabel.license.canBatchPrint();
    setCanBatch(allowed);
  };
  
  checkBatchPrinting();
}, []);

// Button
<button 
  onClick={handleBatchPrint}
  disabled={!canBatch}
  title={!canBatch ? 'Batch Printing nur in Premium-Plänen verfügbar' : ''}
>
  Batch Printing
  {!canBatch && (
    <span className="badge">Premium</span>
  )}
</button>
```

### 5. Custom Footer Option

```typescript
const [canFooter, setCanFooter] = useState(false);
const [footerEnabled, setFooterEnabled] = useState(false);

useEffect(() => {
  const checkCustomFooter = async () => {
    const allowed = await window.autolabel.license.canCustomFooter();
    setCanFooter(allowed);
    if (!allowed) {
      setFooterEnabled(false); // Deaktivieren wenn nicht erlaubt
    }
  };
  
  checkCustomFooter();
}, []);

// Checkbox
<label>
  <input
    type="checkbox"
    checked={footerEnabled}
    onChange={(e) => setFooterEnabled(e.target.checked)}
    disabled={!canFooter}
  />
  Custom Footer hinzufügen
  {!canFooter && (
    <span className="info">
      (Nur in Premium-Plänen verfügbar)
    </span>
  )}
</label>
```

### 6. Labels erstellen mit Usage Check

```typescript
const handleCreateLabels = async (saleIds: string[]) => {
  try {
    // Erst prüfen ob erlaubt
    const check = await window.autolabel.license.canCreateLabels(saleIds.length);
    
    if (!check.allowed) {
      alert(check.reason || 'Limit erreicht');
      return;
    }
    
    // Labels erstellen
    const labels = await window.autolabel.labels.prepare({
      saleIds,
      footerConfig: footerEnabled ? getFooterConfig() : null,
    });
    
    alert(`${labels.length} Labels erfolgreich erstellt!`);
    
    // Usage aktualisieren
    const usage = await window.autolabel.license.usage();
    setUsage(usage);
    
  } catch (error) {
    alert(error.message);
  }
};
```

### 7. Plan Limits anzeigen

```typescript
const [limits, setLimits] = useState<LicenseLimits | null>(null);

useEffect(() => {
  const fetchLimits = async () => {
    const planLimits = await window.autolabel.license.getLimits();
    setLimits(planLimits);
  };
  
  fetchLimits();
}, []);

// Anzeige
{limits && (
  <div className="limits-card">
    <h3>Ihr Plan</h3>
    <ul>
      <li>
        Labels pro Monat: {limits.labelsPerMonth === -1 ? 'Unbegrenzt' : limits.labelsPerMonth}
      </li>
      <li>
        Batch Printing: {limits.batchPrinting ? '✓ Verfügbar' : '✗ Nicht verfügbar'}
      </li>
      <li>
        Custom Footer: {limits.customFooter ? '✓ Verfügbar' : '✗ Nicht verfügbar'}
      </li>
    </ul>
  </div>
)}
```

### 8. Upgrade-Hinweis anzeigen

```typescript
const [showUpgrade, setShowUpgrade] = useState(false);

useEffect(() => {
  const checkUpgrade = async () => {
    const license = await window.autolabel.license.get();
    const usage = await window.autolabel.license.usage();
    
    // Zeige Upgrade-Hinweis wenn Free Plan und > 80% verwendet
    if (license.plan === 'free' && usage.limit !== -1) {
      const percentUsed = (usage.labelsUsed / usage.limit) * 100;
      setShowUpgrade(percentUsed > 80);
    }
  };
  
  checkUpgrade();
}, []);

// Banner
{showUpgrade && (
  <div className="upgrade-banner">
    <p>
      ⚠️ Sie haben fast Ihr monatliches Limit erreicht!
    </p>
    <button onClick={() => window.open('https://autolabel.com/#pricing')}>
      Jetzt upgraden
    </button>
  </div>
)}
```

### 9. License entfernen (Downgrade zu Free)

```typescript
const handleRemoveLicense = async () => {
  const confirmed = confirm(
    'Möchten Sie wirklich auf den Free Plan downgraden? ' +
    'Sie verlieren Zugriff auf Premium-Features.'
  );
  
  if (!confirmed) return;
  
  const result = await window.autolabel.license.remove();
  
  if (result.success) {
    alert('License entfernt. Sie nutzen jetzt den Free Plan.');
    window.location.reload();
  } else {
    alert('Fehler beim Entfernen der License');
  }
};
```

### 10. Usage Reset (nur für Testing)

```typescript
// Nur für Development/Testing!
const handleResetUsage = async () => {
  if (process.env.NODE_ENV !== 'development') {
    alert('Nur in Development verfügbar');
    return;
  }
  
  const result = await window.autolabel.license.resetUsage();
  
  if (result.success) {
    alert('Usage zurückgesetzt');
    // Refresh usage
    const usage = await window.autolabel.license.usage();
    setUsage(usage);
  }
};
```

## TypeScript Declarations

Für TypeScript-Support in Renderer-Komponenten:

```typescript
// src/renderer/types/global.d.ts
import type { AutoLabelAPI } from '../../shared/types';

declare global {
  interface Window {
    autolabel: AutoLabelAPI;
  }
}

export {};
```

## Error Handling Best Practices

```typescript
const handleLicenseOperation = async () => {
  try {
    const result = await window.autolabel.license.validate(key);
    
    if (!result.success) {
      // Benutzerfreundliche Fehlermeldung
      showError(result.error || 'Ein Fehler ist aufgetreten');
      return;
    }
    
    // Erfolg
    showSuccess('License aktiviert!');
    
  } catch (error) {
    // Unerwarteter Fehler
    console.error('License operation failed:', error);
    showError('Ein unerwarteter Fehler ist aufgetreten');
    
    // Optional: Error an Server senden
    await window.autolabel.log.error(
      'License operation failed',
      error,
      { operation: 'validate' }
    );
  }
};
```

## Reaktive Updates

```typescript
// Custom Hook für License Info
function useLicense() {
  const [license, setLicense] = useState<LicenseInfo | null>(null);
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [loading, setLoading] = useState(true);
  
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [licenseInfo, usageInfo] = await Promise.all([
        window.autolabel.license.get(),
        window.autolabel.license.usage(),
      ]);
      setLicense(licenseInfo);
      setUsage(usageInfo);
    } catch (error) {
      console.error('Failed to fetch license info:', error);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    refresh();
  }, [refresh]);
  
  return { license, usage, loading, refresh };
}

// Verwendung
function MyComponent() {
  const { license, usage, loading, refresh } = useLicense();
  
  const handleCreateLabels = async () => {
    // ... labels erstellen
    await refresh(); // Usage aktualisieren
  };
  
  if (loading) return <div>Lädt...</div>;
  
  return (
    <div>
      <p>Plan: {license?.plan}</p>
      <p>Usage: {usage?.labelsUsed} / {usage?.limit}</p>
    </div>
  );
}
```

## Styling-Beispiele

```css
/* Usage Progress Bar */
.progress-bar {
  width: 100%;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.progress {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
  transition: width 0.3s ease;
}

.progress.warning {
  background: linear-gradient(90deg, #FF9800, #FFC107);
}

.progress.danger {
  background: linear-gradient(90deg, #F44336, #E91E63);
}

/* Premium Badge */
.badge {
  display: inline-block;
  padding: 2px 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  font-size: 10px;
  font-weight: bold;
  margin-left: 8px;
  text-transform: uppercase;
}

/* Upgrade Banner */
.upgrade-banner {
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.upgrade-banner button {
  background: white;
  color: #667eea;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
}
```

Diese Beispiele zeigen, wie die License API in der UI verwendet werden kann. Alle API-Aufrufe sind asynchron und sollten mit entsprechendem Error Handling versehen werden.

