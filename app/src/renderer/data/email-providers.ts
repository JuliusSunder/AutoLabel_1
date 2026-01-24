/**
 * Email Provider Compatibility Data
 * Contains IMAP configurations and setup instructions for various email providers
 */

export interface EmailProviderInfo {
  id: string;
  name: string;
  category: 'compatible' | 'forwarding' | 'paid';
  imap?: {
    host: string;
    port: number;
    tls: boolean;
  };
  requiresAppPassword: boolean;
  forwardingAvailable: boolean;
  forwardingPaid?: boolean;
  instructions: {
    imapSetup?: string[];
    appPassword?: string[];
    forwarding?: string[];
  };
  notes?: string;
  officialHelpUrl?: string;
}

export const EMAIL_PROVIDERS: EmailProviderInfo[] = [
  {
    id: 'gmail',
    name: 'Gmail',
    category: 'compatible',
    imap: {
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
    },
    requiresAppPassword: true,
    forwardingAvailable: true,
    instructions: {
      imapSetup: [
        'Melden Sie sich bei Gmail an',
        'Klicken Sie auf das Zahnrad-Symbol (Einstellungen) oben rechts',
        'Wählen Sie "Alle Einstellungen anzeigen"',
        'Gehen Sie zum Tab "Weiterleitung und POP/IMAP"',
        'Aktivieren Sie "IMAP aktivieren"',
        'Klicken Sie auf "Änderungen speichern"',
      ],
      appPassword: [
        'Öffnen Sie Ihr Google-Konto (myaccount.google.com)',
        'Gehen Sie zu "Sicherheit"',
        'Klicken Sie auf "2-Faktor-Authentifizierung" (muss aktiviert sein)',
        'Scrollen Sie nach unten zu "App-Passwörter" und klicken Sie darauf',
        'Geben Sie einen beliebigen App-Namen ein (z.B. "AutoLabel")',
        'Klicken Sie auf "Erstellen"',
        'Kopieren Sie das angezeigte 16-stellige Passwort',
        'Verwenden Sie dieses Passwort in AutoLabel statt Ihres normalen Passworts',
      ],
      forwarding: [
        'Gehen Sie zu Gmail Einstellungen → "Weiterleitung und POP/IMAP"',
        'Klicken Sie auf "Weiterleitungsadresse hinzufügen"',
        'Geben Sie die Ziel-E-Mail-Adresse ein',
        'Bestätigen Sie die Weiterleitung über die Bestätigungs-E-Mail',
        'Wählen Sie "Kopie der eingehenden Nachricht weiterleiten an..."',
        'Klicken Sie auf "Änderungen speichern"',
      ],
    },
    notes: 'Gmail ist sehr zuverlässig und weit verbreitet. App-Passwort ist zwingend erforderlich bei aktivierter 2FA.',
    officialHelpUrl: 'https://support.google.com/mail/answer/7126229',
  },
  {
    id: 'outlook',
    name: 'Outlook.com / Hotmail',
    category: 'compatible',
    imap: {
      host: 'outlook.office365.com',
      port: 993,
      tls: true,
    },
    requiresAppPassword: true,
    forwardingAvailable: true,
    instructions: {
      imapSetup: [
        'IMAP ist bei Outlook.com standardmäßig aktiviert',
        'Keine zusätzliche Konfiguration in Outlook erforderlich',
        'Sie benötigen nur ein App-Passwort, wenn 2FA aktiviert ist',
      ],
      appPassword: [
        'Öffnen Sie account.microsoft.com',
        'Gehen Sie zu "Sicherheit" → "Erweiterte Sicherheitsoptionen"',
        'Klicken Sie auf "Neues App-Kennwort erstellen"',
        'Kopieren Sie das generierte Passwort',
        'Verwenden Sie dieses Passwort in AutoLabel',
        'WICHTIG: Entfernen Sie alle Leerzeichen und Bindestriche aus dem Passwort!',
      ],
      forwarding: [
        'Melden Sie sich bei Outlook.com an',
        'Klicken Sie auf Einstellungen (Zahnrad) → "Alle Outlook-Einstellungen anzeigen"',
        'Gehen Sie zu "E-Mail" → "Weiterleitung"',
        'Aktivieren Sie "Weiterleitung aktivieren"',
        'Geben Sie die Ziel-E-Mail-Adresse ein',
        'Klicken Sie auf "Speichern"',
      ],
    },
    notes: 'Bei Outlook müssen Leerzeichen/Bindestriche aus App-Passwörtern entfernt werden. AutoLabel macht dies automatisch.',
    officialHelpUrl: 'https://support.microsoft.com/de-de/office/pop-imap-und-smtp-einstellungen-8361e398-8af4-4e97-b147-6c6c4ac95353',
  },
  {
    id: 'icloud',
    name: 'iCloud Mail',
    category: 'compatible',
    imap: {
      host: 'imap.mail.me.com',
      port: 993,
      tls: true,
    },
    requiresAppPassword: true,
    forwardingAvailable: false,
    instructions: {
      imapSetup: [
        'IMAP ist bei iCloud Mail standardmäßig aktiv',
        'Du brauchst ein app-spezifisches Passwort von Apple',
      ],
      appPassword: [
        'Gehe zu appleid.apple.com und melde dich an',
        'Öffne "Anmelden und Sicherheit"',
        'Wähle "Anwendungsspezifische Passwörter"',
        'Klicke auf "Passwort generieren" oder "+"',
        'Gib einen Namen ein (z.B. "AutoLabel")',
        'Kopiere das 16-stellige Passwort (xxxx-xxxx-xxxx-xxxx)',
        'Verwende dieses Passwort in AutoLabel (nicht dein normales Apple-ID-Passwort)',
      ],
    },
    notes: 'Für iCloud brauchst du immer ein app-spezifisches Passwort. 2FA muss aktiviert sein.',
    officialHelpUrl: 'https://support.apple.com/de-de/102654',
  },
  {
    id: 'yahoo',
    name: 'Yahoo Mail',
    category: 'compatible',
    imap: {
      host: 'imap.mail.yahoo.com',
      port: 993,
      tls: true,
    },
    requiresAppPassword: true,
    forwardingAvailable: true,
    forwardingPaid: true,
    instructions: {
      imapSetup: [
        'Melden Sie sich bei Yahoo Mail an',
        'Klicken Sie auf Ihr Profil-Symbol oben rechts',
        'Wählen Sie "Kontoinfo"',
        'Gehen Sie zu "Kontosicherheit"',
        'Aktivieren Sie "Apps von Drittanbietern, die Kennwörter verwenden"',
      ],
      appPassword: [
        'Gehen Sie zu account.yahoo.com',
        'Klicken Sie auf "Kontosicherheit"',
        'Scrollen Sie zu "App-Passwörter generieren"',
        'Wählen Sie eine App aus (z.B. "Andere App")',
        'Geben Sie "AutoLabel" als Namen ein',
        'Klicken Sie auf "Generieren"',
        'Kopieren Sie das generierte Passwort',
        'Verwenden Sie dieses in AutoLabel',
      ],
      forwarding: [
        'E-Mail-Weiterleitung ist nur mit Yahoo Mail Plus (kostenpflichtig) verfügbar',
        'Kostenlose Alternative: IMAP-Zugriff verwenden',
      ],
    },
    notes: 'Yahoo Mail Plus ($5/Monat) erforderlich für E-Mail-Weiterleitung. IMAP ist kostenlos verfügbar.',
    officialHelpUrl: 'https://help.yahoo.com/kb/SLN4075.html',
  },
  {
    id: 'gmx',
    name: 'GMX',
    category: 'compatible',
    imap: {
      host: 'imap.gmx.net',
      port: 993,
      tls: true,
    },
    requiresAppPassword: false,
    forwardingAvailable: true,
    instructions: {
      imapSetup: [
        'Melden Sie sich bei GMX an (www.gmx.net)',
        'Klicken Sie oben rechts auf "Einstellungen"',
        'Wählen Sie im linken Menü "E-Mail" → "POP3/IMAP Abruf"',
        'Aktivieren Sie das Kontrollkästchen "POP3 und IMAP Zugriff erlauben"',
        'Klicken Sie auf "Speichern"',
        'Verwenden Sie Ihr normales GMX-Passwort in AutoLabel',
      ],
      forwarding: [
        'Melden Sie sich bei GMX an',
        'Klicken Sie auf "Einstellungen"',
        'Wählen Sie "E-Mail" → "Filterregeln & Ordner"',
        'Klicken Sie auf "Neue Regel"',
        'Wählen Sie als Bedingung "Alle Nachrichten"',
        'Wählen Sie als Aktion "Weiterleiten an"',
        'Geben Sie die Ziel-E-Mail-Adresse ein',
        'Speichern Sie die Regel',
      ],
    },
    notes: 'GMX ist einfach zu konfigurieren - kein App-Passwort erforderlich. IMAP muss einmalig in den Einstellungen aktiviert werden.',
    officialHelpUrl: 'https://hilfe.gmx.net/pop-imap/imap/index.html',
  },
  {
    id: 'webde',
    name: 'Web.de',
    category: 'compatible',
    imap: {
      host: 'imap.web.de',
      port: 993,
      tls: true,
    },
    requiresAppPassword: false,
    forwardingAvailable: true,
    instructions: {
      imapSetup: [
        'IMAP ist bei Web.de standardmäßig aktiviert',
        'Keine zusätzliche Konfiguration erforderlich',
        'Verwenden Sie Ihr normales Web.de-Passwort',
      ],
      forwarding: [
        'Melden Sie sich bei Web.de an',
        'Klicken Sie auf "Einstellungen" (Zahnrad-Symbol)',
        'Wählen Sie "E-Mail" → "Automatische Weiterleitung"',
        'Aktivieren Sie "Weiterleitung aktivieren"',
        'Geben Sie die Ziel-E-Mail-Adresse ein',
        'Bestätigen Sie die Weiterleitung über die Bestätigungs-E-Mail',
        'Klicken Sie auf "Speichern"',
      ],
    },
    notes: 'Web.de ist wie GMX sehr benutzerfreundlich. Kein App-Passwort erforderlich.',
    officialHelpUrl: 'https://hilfe.web.de/pop-imap/imap.html',
  },
  {
    id: 'tonline',
    name: 'T-Online',
    category: 'compatible',
    imap: {
      host: 'secureimap.t-online.de',
      port: 993,
      tls: true,
    },
    requiresAppPassword: false,
    forwardingAvailable: true,
    instructions: {
      imapSetup: [
        'IMAP ist bei T-Online standardmäßig aktiviert',
        'Keine zusätzliche Konfiguration erforderlich',
        'Verwenden Sie Ihr normales T-Online-Passwort',
      ],
      forwarding: [
        'Melden Sie sich bei T-Online E-Mail-Center an',
        'Klicken Sie auf "Menü" → "Einstellungen"',
        'Wählen Sie "E-Mail" → "Weiterleitung"',
        'Aktivieren Sie "Alle E-Mails weiterleiten"',
        'Geben Sie die Ziel-E-Mail-Adresse ein',
        'Klicken Sie auf "Speichern"',
      ],
    },
    notes: 'T-Online ist ein zuverlässiger deutscher Anbieter. Einfache Konfiguration ohne App-Passwort.',
    officialHelpUrl: 'https://www.telekom.de/hilfe/festnetz-internet-tv/e-mail',
  },
  {
    id: 'freenet',
    name: 'Freenet',
    category: 'compatible',
    imap: {
      host: 'mx.freenet.de',
      port: 993,
      tls: true,
    },
    requiresAppPassword: false,
    forwardingAvailable: true,
    instructions: {
      imapSetup: [
        'IMAP ist bei Freenet standardmäßig aktiviert',
        'Keine zusätzliche Konfiguration erforderlich',
        'Verwenden Sie Ihr normales Freenet-Passwort',
      ],
      forwarding: [
        'Melden Sie sich bei Freenet Mail an',
        'Klicken Sie auf "Einstellungen"',
        'Wählen Sie "E-Mail-Weiterleitung"',
        'Geben Sie die Ziel-E-Mail-Adresse ein',
        'Klicken Sie auf "Speichern"',
      ],
    },
    notes: 'Freenet bietet grundlegende IMAP-Funktionen ohne komplizierte Einrichtung.',
  },
  {
    id: 'protonmail',
    name: 'ProtonMail',
    category: 'paid',
    imap: {
      host: 'imap.protonmail.com',
      port: 993,
      tls: true,
    },
    requiresAppPassword: true,
    forwardingAvailable: true,
    forwardingPaid: false,
    instructions: {
      imapSetup: [
        'ProtonMail Bridge herunterladen (nur für Plus/Professional/Visionary Accounts)',
        'Bridge installieren und mit Ihrem ProtonMail-Account anmelden',
        'Bridge generiert automatisch IMAP-Zugangsdaten',
        'Verwenden Sie die von Bridge bereitgestellten IMAP-Einstellungen',
        'WICHTIG: Bridge muss im Hintergrund laufen, damit IMAP funktioniert',
      ],
      appPassword: [
        'Öffnen Sie ProtonMail Bridge',
        'Wählen Sie Ihren Account aus',
        'Klicken Sie auf "Configure" → "IMAP/SMTP"',
        'Kopieren Sie das automatisch generierte Passwort',
        'Verwenden Sie dieses Passwort in AutoLabel',
      ],
      forwarding: [
        'Melden Sie sich bei ProtonMail an',
        'Gehen Sie zu "Einstellungen" → "Filter"',
        'Erstellen Sie einen neuen Filter',
        'Wählen Sie als Bedingung "Alle Nachrichten"',
        'Wählen Sie als Aktion "Weiterleiten an"',
        'Geben Sie die Ziel-E-Mail-Adresse ein (z.B. Gmail oder Web.de)',
        'Speichern Sie den Filter',
      ],
    },
    notes: 'ProtonMail Bridge ist kostenpflichtig (Plus ab €3.99/Monat). Alternative: Kostenlose Weiterleitung zu Gmail/Web.de einrichten.',
    officialHelpUrl: 'https://protonmail.com/bridge',
  },
  {
    id: 'tutanota',
    name: 'Tutanota',
    category: 'paid',
    imap: {
      host: 'imap.tutanota.com',
      port: 993,
      tls: true,
    },
    requiresAppPassword: false,
    forwardingAvailable: false,
    instructions: {
      imapSetup: [
        'Tutanota bietet aktuell keinen IMAP-Zugriff an',
        'Dies ist aus Sicherheitsgründen nicht verfügbar',
        'IMAP-Unterstützung ist für die Zukunft geplant, aber noch nicht verfügbar',
      ],
      forwarding: [
        'E-Mail-Weiterleitung ist bei Tutanota nicht verfügbar',
        'Alternative: Richten Sie einen separaten E-Mail-Account ein',
        'Verwenden Sie Gmail, Web.de oder einen anderen kompatiblen Anbieter',
        'Nutzen Sie diesen Account für Ihre Shop-Bestellungen',
      ],
    },
    notes: 'Tutanota bietet derzeit keine IMAP- oder Weiterleitungsfunktion. Empfehlung: Separaten kostenlosen E-Mail-Account (Gmail, Web.de) für Shop-Bestellungen verwenden.',
  },
];

/**
 * Get providers by category
 */
export function getProvidersByCategory(category: EmailProviderInfo['category']): EmailProviderInfo[] {
  return EMAIL_PROVIDERS.filter(p => p.category === category);
}

/**
 * Get provider by ID
 */
export function getProviderById(id: string): EmailProviderInfo | undefined {
  return EMAIL_PROVIDERS.find(p => p.id === id);
}

/**
 * Get category display info
 */
export function getCategoryInfo(category: EmailProviderInfo['category']): {
  icon: string;
  label: string;
  description: string;
} {
  switch (category) {
    case 'compatible':
      return {
        icon: '✅',
        label: 'Directly Compatible',
        description: 'IMAP available for free - recommended!',
      };
    case 'forwarding':
      return {
        icon: '🔄',
        label: 'Forwarding Available',
        description: 'No direct IMAP access, but email forwarding available',
      };
    case 'paid':
      return {
        icon: '💰',
        label: 'Paid Compatible',
        description: 'IMAP or forwarding only available with paid plan',
      };
  }
}

