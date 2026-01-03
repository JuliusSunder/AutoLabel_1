"use client";

import { useState } from "react";
import { X, Download, Mail, Scan, Check, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "./ui/Button";

interface OnboardingGuideProps {
  onComplete: () => void;
  onSkip: () => void;
  userEmail: string;
  hasPassword: boolean;
}

interface Step {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  details: React.ReactNode;
}

type Language = 'de' | 'en';

interface Translations {
  steps: {
    title: string;
    description: string;
    details: {
      welcome: {
        intro: string;
        whatYouNeed: string;
        item1: string;
        item2: string;
        item3: string;
      };
      download: {
        installation: string;
        step1: string;
        step2: string;
        step3: string;
        step4: string;
        warningNoPassword: string;
        loginInfo: string;
      };
      email: {
        addAccount: string;
        step1: string;
        step2: string;
        step3: string;
        step4: string;
        step5: string;
        tipTitle: string;
        tipText: string;
      };
      scan: {
        scanAndPrint: string;
        step1: string;
        step2: string;
        step3: string;
        step4: string;
        step5: string;
        doneTitle: string;
        doneText: string;
      };
    };
  }[];
  ui: {
    stepOf: string;
    completed: string;
    skipGuide: string;
    back: string;
    next: string;
    finishGuide: string;
  };
}

const translations: Record<Language, Translations> = {
  de: {
    steps: [
      {
        title: "Willkommen bei AutoLabel!",
        description: "Lass uns gemeinsam AutoLabel einrichten. Dieser Guide führt dich durch die wichtigsten Schritte.",
        details: {
          welcome: {
            intro: "AutoLabel automatisiert das Drucken von Versandetiketten für deine Online-Verkäufe. In wenigen Minuten bist du startklar!",
            whatYouNeed: "Was du brauchst:",
            item1: "Einen Windows-PC mit Drucker (4×6\" / 100×150mm empfohlen)",
            item2: "Zugriff auf dein Email-Postfach (z.B. Gmail, Outlook)",
            item3: "Ca. 5 Minuten Zeit für die Einrichtung",
          },
          download: { installation: "", step1: "", step2: "", step3: "", step4: "", warningNoPassword: "", loginInfo: "" },
          email: { addAccount: "", step1: "", step2: "", step3: "", step4: "", step5: "", tipTitle: "", tipText: "" },
          scan: { scanAndPrint: "", step1: "", step2: "", step3: "", step4: "", step5: "", doneTitle: "", doneText: "" },
        },
      },
      {
        title: "Schritt 1: App herunterladen",
        description: "Lade die AutoLabel Desktop-App herunter und installiere sie auf deinem Computer.",
        details: {
          welcome: { intro: "", whatYouNeed: "", item1: "", item2: "", item3: "" },
          download: {
            installation: "Installation:",
            step1: "Klicke auf den \"Download App\" Button unten im Dashboard",
            step2: "Öffne die heruntergeladene AutoLabel-Setup.exe",
            step3: "Folge dem Installationsassistenten (Windows SmartScreen: \"Weitere Informationen\" → \"Trotzdem ausführen\")",
            step4: "Starte AutoLabel nach der Installation",
            warningNoPassword: "⚠️ Wichtig: Du hast dich mit Google angemeldet. Bitte setze zuerst ein Passwort im Dashboard (siehe orangene Card), um dich in der Desktop-App anmelden zu können.",
            loginInfo: "✓ Login-Daten: Melde dich in der App mit deiner E-Mail ({email}) und deinem Passwort an.",
          },
          email: { addAccount: "", step1: "", step2: "", step3: "", step4: "", step5: "", tipTitle: "", tipText: "" },
          scan: { scanAndPrint: "", step1: "", step2: "", step3: "", step4: "", step5: "", doneTitle: "", doneText: "" },
        },
      },
      {
        title: "Schritt 2: Email-Account verbinden",
        description: "Verbinde dein Email-Postfach, damit AutoLabel deine Versandetiketten automatisch erkennen kann.",
        details: {
          welcome: { intro: "", whatYouNeed: "", item1: "", item2: "", item3: "" },
          download: { installation: "", step1: "", step2: "", step3: "", step4: "", warningNoPassword: "", loginInfo: "" },
          email: {
            addAccount: "Email-Account hinzufügen:",
            step1: "Öffne AutoLabel und gehe zu \"Accounts\" (linke Sidebar)",
            step2: "Klicke auf \"+ Add Account\"",
            step3: "Wähle deinen Email-Provider (Gmail, Outlook, etc.) oder \"Custom IMAP\"",
            step4: "Gib deine Email-Adresse und ein App-Passwort ein (nicht dein normales Passwort!)",
            step5: "Klicke auf \"Test Connection\" und dann \"Save\"",
            tipTitle: "💡 Tipp: App-Passwort erstellen",
            tipText: "Eine Anleitung für das Erstellen eines App-Passwortes findest du in der App.",
          },
          scan: { scanAndPrint: "", step1: "", step2: "", step3: "", step4: "", step5: "", doneTitle: "", doneText: "" },
        },
      },
      {
        title: "Schritt 3: Ersten Scan durchführen",
        description: "Scanne dein Email-Postfach nach Versandetiketten und drucke dein erstes Label!",
        details: {
          welcome: { intro: "", whatYouNeed: "", item1: "", item2: "", item3: "" },
          download: { installation: "", step1: "", step2: "", step3: "", step4: "", warningNoPassword: "", loginInfo: "" },
          email: { addAccount: "", step1: "", step2: "", step3: "", step4: "", step5: "", tipTitle: "", tipText: "" },
          scan: {
            scanAndPrint: "Label scannen und drucken:",
            step1: "Gehe zu \"History\" (linke Sidebar)",
            step2: "Klicke auf \"Scan Now\" um deine Emails nach Versandetiketten zu durchsuchen",
            step3: "Gefundene Labels werden automatisch angezeigt",
            step4: "Wähle ein oder mehrere Labels aus (Checkbox)",
            step5: "Klicke auf \"Quick Start\" für sofortigen Druck oder \"Prepare Labels\" für Vorschau",
            doneTitle: "🎉 Geschafft!",
            doneText: "Du bist jetzt bereit, AutoLabel zu nutzen! Die App scannt automatisch nach neuen Etiketten, wenn du sie öffnest. Du kannst jederzeit manuell scannen oder die Einstellungen anpassen.",
          },
        },
      },
    ],
    ui: {
      stepOf: "Schritt {current} von {total}",
      completed: "{percent}% abgeschlossen",
      skipGuide: "Guide überspringen",
      back: "Zurück",
      next: "Weiter",
      finishGuide: "Guide abschließen",
    },
  },
  en: {
    steps: [
      {
        title: "Welcome to AutoLabel!",
        description: "Let's set up AutoLabel together. This guide will walk you through the most important steps.",
        details: {
          welcome: {
            intro: "AutoLabel automates the printing of shipping labels for your online sales. You'll be ready in just a few minutes!",
            whatYouNeed: "What you need:",
            item1: "A Windows PC with a printer (4×6\" / 100×150mm recommended)",
            item2: "Access to your email inbox (e.g., Gmail, Outlook)",
            item3: "About 5 minutes for setup",
          },
          download: { installation: "", step1: "", step2: "", step3: "", step4: "", warningNoPassword: "", loginInfo: "" },
          email: { addAccount: "", step1: "", step2: "", step3: "", step4: "", step5: "", tipTitle: "", tipText: "" },
          scan: { scanAndPrint: "", step1: "", step2: "", step3: "", step4: "", step5: "", doneTitle: "", doneText: "" },
        },
      },
      {
        title: "Step 1: Download App",
        description: "Download the AutoLabel desktop app and install it on your computer.",
        details: {
          welcome: { intro: "", whatYouNeed: "", item1: "", item2: "", item3: "" },
          download: {
            installation: "Installation:",
            step1: "Click the \"Download App\" button at the bottom of the dashboard",
            step2: "Open the downloaded AutoLabel-Setup.exe",
            step3: "Follow the installation wizard (Windows SmartScreen: \"More info\" → \"Run anyway\")",
            step4: "Start AutoLabel after installation",
            warningNoPassword: "⚠️ Important: You signed in with Google. Please set a password first in the dashboard (see orange card) to be able to log in to the desktop app.",
            loginInfo: "✓ Login credentials: Log in to the app with your email ({email}) and your password.",
          },
          email: { addAccount: "", step1: "", step2: "", step3: "", step4: "", step5: "", tipTitle: "", tipText: "" },
          scan: { scanAndPrint: "", step1: "", step2: "", step3: "", step4: "", step5: "", doneTitle: "", doneText: "" },
        },
      },
      {
        title: "Step 2: Connect Email Account",
        description: "Connect your email inbox so AutoLabel can automatically detect your shipping labels.",
        details: {
          welcome: { intro: "", whatYouNeed: "", item1: "", item2: "", item3: "" },
          download: { installation: "", step1: "", step2: "", step3: "", step4: "", warningNoPassword: "", loginInfo: "" },
          email: {
            addAccount: "Add email account:",
            step1: "Open AutoLabel and go to \"Accounts\" (left sidebar)",
            step2: "Click \"+ Add Account\"",
            step3: "Select your email provider (Gmail, Outlook, etc.) or \"Custom IMAP\"",
            step4: "Enter your email address and an app password (not your regular password!)",
            step5: "Click \"Test Connection\" and then \"Save\"",
            tipTitle: "💡 Tip: Create App Password",
            tipText: "You can find instructions for creating an app password in the app.",
          },
          scan: { scanAndPrint: "", step1: "", step2: "", step3: "", step4: "", step5: "", doneTitle: "", doneText: "" },
        },
      },
      {
        title: "Step 3: Perform First Scan",
        description: "Scan your email inbox for shipping labels and print your first label!",
        details: {
          welcome: { intro: "", whatYouNeed: "", item1: "", item2: "", item3: "" },
          download: { installation: "", step1: "", step2: "", step3: "", step4: "", warningNoPassword: "", loginInfo: "" },
          email: { addAccount: "", step1: "", step2: "", step3: "", step4: "", step5: "", tipTitle: "", tipText: "" },
          scan: {
            scanAndPrint: "Scan and print labels:",
            step1: "Go to \"History\" (left sidebar)",
            step2: "Click \"Scan Now\" to search your emails for shipping labels",
            step3: "Found labels will be displayed automatically",
            step4: "Select one or more labels (checkbox)",
            step5: "Click \"Quick Start\" for immediate printing or \"Prepare Labels\" for preview",
            doneTitle: "🎉 Done!",
            doneText: "You're now ready to use AutoLabel! The app automatically scans for new labels when you open it. You can manually scan or adjust settings at any time.",
          },
        },
      },
    ],
    ui: {
      stepOf: "Step {current} of {total}",
      completed: "{percent}% completed",
      skipGuide: "Skip guide",
      back: "Back",
      next: "Next",
      finishGuide: "Finish guide",
    },
  },
};

export function OnboardingGuide({ onComplete, onSkip, userEmail, hasPassword }: OnboardingGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isOpen, setIsOpen] = useState(true);
  const [language, setLanguage] = useState<Language>('de');

  const t = translations[language];

  const getStepDetails = (stepIndex: number) => {
    const stepData = t.steps[stepIndex];
    const details = stepData.details;

    switch (stepIndex) {
      case 0: // Welcome
        return (
          <div className="space-y-4">
            <p className="text-gray-700">{details.welcome.intro}</p>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">{details.welcome.whatYouNeed}</h4>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{details.welcome.item1}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{details.welcome.item2}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{details.welcome.item3}</span>
                </li>
              </ul>
            </div>
          </div>
        );

      case 1: // Download
        return (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3">{details.download.installation}</h4>
              <ol className="space-y-3 text-sm text-gray-700">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  <span>{details.download.step1}</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  <span>{details.download.step2}</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  <span>{details.download.step3}</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                  <span>{details.download.step4}</span>
                </li>
              </ol>
            </div>
            {!hasPassword && (
              <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                <p className="text-sm text-orange-800">
                  <strong>{details.download.warningNoPassword}</strong>
                </p>
              </div>
            )}
            {hasPassword && (
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>{details.download.loginInfo.replace('{email}', userEmail)}</strong>
                </p>
              </div>
            )}
          </div>
        );

      case 2: // Email
        return (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3">{details.email.addAccount}</h4>
              <ol className="space-y-3 text-sm text-gray-700">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  <span>{details.email.step1}</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  <span>{details.email.step2}</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  <span>{details.email.step3}</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                  <span>{details.email.step4}</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold">5</span>
                  <span>{details.email.step5}</span>
                </li>
              </ol>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">{details.email.tipTitle}</h4>
              <p className="text-sm text-blue-800">{details.email.tipText}</p>
            </div>
          </div>
        );

      case 3: // Scan
        return (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3">{details.scan.scanAndPrint}</h4>
              <ol className="space-y-3 text-sm text-gray-700">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  <span>{details.scan.step1}</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  <span>{details.scan.step2}</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  <span>{details.scan.step3}</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                  <span>{details.scan.step4}</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">5</span>
                  <span>{details.scan.step5}</span>
                </li>
              </ol>
            </div>
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2">{details.scan.doneTitle}</h4>
              <p className="text-sm text-green-800">{details.scan.doneText}</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const steps: Step[] = t.steps.map((step, index) => ({
    id: index + 1,
    title: step.title,
    description: step.description,
    icon: [
      <Check className="w-8 h-8 text-green-500" key="check" />,
      <Download className="w-8 h-8 text-blue-500" key="download" />,
      <Mail className="w-8 h-8 text-purple-500" key="mail" />,
      <Scan className="w-8 h-8 text-green-500" key="scan" />,
    ][index],
    details: getStepDetails(index),
  }));

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsOpen(false);
    onComplete();
  };

  const handleSkip = () => {
    setIsOpen(false);
    onSkip();
  };

  const toggleLanguage = () => {
    setLanguage(language === 'de' ? 'en' : 'de');
  };

  if (!isOpen) return null;

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {currentStepData.icon}
              <h2 className="text-2xl font-bold text-gray-900">
                {currentStepData.title}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {/* Language Toggle Button */}
              <button
                onClick={toggleLanguage}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                aria-label="Toggle language"
              >
                {language === 'de' ? 'EN' : 'DE'}
              </button>
              <button
                onClick={handleSkip}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close guide"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
          <p className="text-gray-600">{currentStepData.description}</p>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>{t.ui.stepOf.replace('{current}', String(currentStep + 1)).replace('{total}', String(steps.length))}</span>
              <span>{t.ui.completed.replace('{percent}', String(Math.round(progress)))}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {currentStepData.details}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between gap-4">
            <Button
              onClick={handleSkip}
              variant="outline"
              className="text-gray-600"
            >
              {t.ui.skipGuide}
            </Button>
            
            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <Button
                  onClick={handlePrevious}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  {t.ui.back}
                </Button>
              )}
              <Button
                onClick={handleNext}
                variant="primary"
                className="flex items-center gap-2"
              >
                {currentStep < steps.length - 1 ? (
                  <>
                    {t.ui.next}
                    <ChevronRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    {t.ui.finishGuide}
                    <Check className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
