import Link from "next/link";
import { Container } from "@/app/components/ui/Container";
import { Navigation } from "@/app/components/sections/Navigation";
import { Footer } from "@/app/components/sections/Footer";
import { BackButton } from "@/app/components/ui/BackButton";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms and Conditions - AutoLabel",
  description: "Terms and conditions for using AutoLabel. Subscription terms, payment conditions, and usage rights.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function AGBPage() {
  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pt-24 pb-20">
        <Container>
        <div className="max-w-4xl mx-auto">
          <BackButton />
          <h1 className="text-4xl font-bold text-gray-900 mb-8">
            Allgemeine Geschäftsbedingungen (AGB)
          </h1>
          
          <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6 text-gray-700">
            <p className="text-sm text-gray-500">
              Stand: {new Date().toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Geltungsbereich</h2>
              <p>
                Diese Allgemeinen Geschäftsbedingungen (nachfolgend "AGB") gelten für alle Verträge über die 
                Nutzung der Software "AutoLabel" (nachfolgend "Software" oder "Dienstleistung") zwischen AutoLabel 
                (nachfolgend "Anbieter") und dem Nutzer (nachfolgend "Kunde").
              </p>
              <p className="mt-2">
                Abweichende, entgegenstehende oder ergänzende Allgemeine Geschäftsbedingungen des Kunden werden nicht 
                Vertragsbestandteil, es sei denn, ihrer Geltung wird ausdrücklich schriftlich zugestimmt.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Vertragsgegenstand</h2>
              <p>
                AutoLabel ist eine Software zur Automatisierung der Versandetikett-Verarbeitung. Die Software ermöglicht 
                es, E-Mails zu scannen, Versandetiketten zu normalisieren und in größeren Mengen zu drucken.
              </p>
              <p className="mt-2">
                Der Anbieter stellt dem Kunden die Software als Software-as-a-Service (SaaS) zur Verfügung. Der Kunde 
                erhält keinen Anspruch auf die Herausgabe des Quellcodes oder auf eine Installation der Software auf 
                eigenen Systemen.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Registrierung und Konto</h2>
              <p>
                Zur Nutzung der Software muss sich der Kunde registrieren und ein Konto erstellen. Der Kunde verpflichtet 
                sich, bei der Registrierung wahrheitsgemäße, vollständige und aktuelle Angaben zu machen.
              </p>
              <p className="mt-2">
                Der Kunde ist verpflichtet, seine Zugangsdaten geheim zu halten und Dritten keinen Zugang zu seinem Konto 
                zu gewähren. Der Kunde haftet für alle Handlungen, die unter Verwendung seiner Zugangsdaten erfolgen.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Verfügbare Pläne</h2>
              <p>Der Anbieter bietet folgende Nutzungspläne an:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li><strong>Free:</strong> Kostenloser Plan mit eingeschränkten Funktionen</li>
                <li><strong>Plus:</strong> Monatliches oder jährliches Abonnement mit erweiterten Funktionen</li>
                <li><strong>Pro:</strong> Monatliches oder jährliches Abonnement mit allen Funktionen</li>
              </ul>
              <p className="mt-4">
                Die genauen Preise, Funktionen und Limits der einzelnen Pläne sind auf der Website des Anbieters 
                veröffentlicht. Der Anbieter behält sich vor, die Preise und Pläne zu ändern. Bereits abgeschlossene 
                Verträge bleiben davon unberührt.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Zahlungsbedingungen</h2>
              <p>
                Die Zahlung erfolgt im Voraus für den gewählten Abrechnungszeitraum (monatlich oder jährlich). 
                Die Zahlung kann per Kreditkarte oder anderen vom Anbieter akzeptierten Zahlungsmethoden erfolgen.
              </p>
              <p className="mt-2">
                Bei Zahlungsverzug ist der Anbieter berechtigt, die Leistung zu verweigern und den Zugang zum Konto 
                zu sperren. Der Kunde bleibt zur Zahlung verpflichtet.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Kündigung</h2>
              <p>
                Der Kunde kann sein Konto jederzeit kündigen. Die Kündigung erfolgt über das Kundenkonto oder per 
                E-Mail an AutoLabel@gmx.de.
              </p>
              <p className="mt-2">
                Bei monatlichen Abonnements endet das Abonnement zum Ende des laufenden Abrechnungszeitraums. 
                Bei jährlichen Abonnements endet das Abonnement zum Ende des laufenden Abrechnungsjahres.
              </p>
              <p className="mt-2">
                Der Anbieter kann das Konto des Kunden mit einer Frist von 30 Tagen kündigen, wenn der Kunde gegen 
                diese AGB verstößt oder die Zahlung verweigert.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Verfügbarkeit und Störungen</h2>
              <p>
                Der Anbieter bemüht sich um eine hohe Verfügbarkeit der Software. Eine Verfügbarkeit von 100% kann 
                jedoch nicht garantiert werden. Geplante Wartungsarbeiten werden dem Kunden nach Möglichkeit im Voraus 
                angekündigt.
              </p>
              <p className="mt-2">
                Der Anbieter haftet nicht für Störungen, die auf höhere Gewalt, Fehler Dritter oder technische Probleme 
                zurückzuführen sind, die außerhalb des Einflussbereichs des Anbieters liegen.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Haftung</h2>
              <p>
                Der Anbieter haftet unbeschränkt für Vorsatz und grobe Fahrlässigkeit sowie nach Maßgabe des 
                Produkthaftungsgesetzes.
              </p>
              <p className="mt-2">
                Bei leichter Fahrlässigkeit haftet der Anbieter nur bei Verletzung einer wesentlichen Vertragspflicht, 
                deren Erfüllung die ordnungsgemäße Durchführung des Vertrages überhaupt erst ermöglicht und auf deren 
                Einhaltung der Kunde regelmäßig vertrauen darf (Kardinalpflicht). In diesem Fall ist die Haftung auf 
                die bei Vertragsschluss vorhersehbaren, vertragstypischen Schäden begrenzt.
              </p>
              <p className="mt-2">
                Die vorstehenden Haftungsbeschränkungen gelten nicht bei Verletzung des Lebens, des Körpers oder der 
                Gesundheit.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Datenschutz</h2>
              <p>
                Der Anbieter verarbeitet personenbezogene Daten des Kunden im Rahmen der gesetzlichen Bestimmungen. 
                Nähere Informationen finden Sie in unserer Datenschutzerklärung.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Änderungen der AGB</h2>
              <p>
                Der Anbieter behält sich vor, diese AGB zu ändern. Änderungen werden dem Kunden per E-Mail oder über 
                die Software mitgeteilt. Widerspricht der Kunde den geänderten AGB nicht innerhalb von 30 Tagen nach 
                Bekanntgabe, gelten die geänderten AGB als genehmigt.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Schlussbestimmungen</h2>
              <p>
                Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts.
              </p>
              <p className="mt-2">
                Sollten einzelne Bestimmungen dieser AGB unwirksam sein oder werden, bleibt die Wirksamkeit der 
                übrigen Bestimmungen unberührt.
              </p>
              <p className="mt-2">
                Erfüllungsort und Gerichtsstand für alle Streitigkeiten aus diesem Vertrag ist, soweit der Kunde 
                Kaufmann, juristische Person des öffentlichen Rechts oder öffentlich-rechtliches Sondervermögen ist, 
                der Sitz des Anbieters.
              </p>
            </section>
          </div>
        </div>
      </Container>
      </div>
      <Footer />
    </>
  );
}

