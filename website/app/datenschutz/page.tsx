import Link from "next/link";
import { Container } from "@/app/components/ui/Container";
import { Navigation } from "@/app/components/sections/Navigation";
import { Footer } from "@/app/components/sections/Footer";
import { BackButton } from "@/app/components/ui/BackButton";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - AutoLabel",
  description: "Privacy policy for AutoLabel. Learn how we handle your data, email credentials, and payment information securely.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function DatenschutzPage() {
  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pt-24 pb-20">
        <Container>
        <div className="max-w-4xl mx-auto">
          <BackButton />
          <h1 className="text-4xl font-bold text-gray-900 mb-8">
            Datenschutzerklärung
          </h1>
          
          <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6 text-gray-700">
            <p className="text-sm text-gray-500">
              Stand: {new Date().toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Datenschutz auf einen Blick</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Allgemeine Hinweise</h3>
              <p>
                Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten 
                passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie 
                persönlich identifiziert werden können.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Datenerfassung auf dieser Website</h3>
              <p className="font-semibold mb-2">Wer ist verantwortlich für die Datenerfassung auf dieser Website?</p>
              <p>
                Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen Kontaktdaten 
                können Sie dem Abschnitt „Hinweis zur Verantwortlichen Stelle" in dieser Datenschutzerklärung entnehmen.
              </p>

              <p className="font-semibold mt-4 mb-2">Wie erfassen wir Ihre Daten?</p>
              <p>
                Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen. Hierbei kann es sich z. B. 
                um Daten handeln, die Sie in ein Kontaktformular eingeben oder bei der Registrierung angeben.
              </p>
              <p className="mt-2">
                Andere Daten werden automatisch oder nach Ihrer Einwilligung beim Besuch der Website durch unsere 
                IT-Systeme erfasst. Das sind vor allem technische Daten (z. B. Internetbrowser, Betriebssystem oder 
                Uhrzeit des Seitenaufrufs). Die Erfassung dieser Daten erfolgt automatisch, sobald Sie diese Website betreten.
              </p>

              <p className="font-semibold mt-4 mb-2">Wofür nutzen wir Ihre Daten?</p>
              <p>
                Ein Teil der Daten wird erhoben, um eine fehlerfreie Bereitstellung der Website zu gewährleisten. 
                Andere Daten können zur Analyse Ihres Nutzerverhaltens verwendet werden.
              </p>

              <p className="font-semibold mt-4 mb-2">Welche Rechte haben Sie bezüglich Ihrer Daten?</p>
              <p>
                Sie haben jederzeit das Recht, unentgeltlich Auskunft über Herkunft, Empfänger und Zweck Ihrer 
                gespeicherten personenbezogenen Daten zu erhalten. Sie haben außerdem ein Recht, die Berichtigung oder 
                Löschung dieser Daten zu verlangen. Wenn Sie eine Einwilligung zur Datenverarbeitung erteilt haben, 
                können Sie diese Einwilligung jederzeit für die Zukunft widerrufen. Außerdem haben Sie das Recht, unter 
                bestimmten Umständen die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen. 
                Des Weiteren steht Ihnen ein Beschwerderecht bei der zuständigen Aufsichtsbehörde zu.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Hosting</h2>
              <p>
                Diese Website wird bei einem externen Dienstleister gehostet (Hoster). Die personenbezogenen Daten, 
                die auf dieser Website erfasst werden, werden auf den Servern des Hosters gespeichert.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Allgemeine Hinweise und Pflichtinformationen</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Datenschutz</h3>
              <p>
                Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln Ihre 
                personenbezogenen Daten vertraulich und entsprechend den gesetzlichen Datenschutzbestimmungen sowie 
                dieser Datenschutzerklärung.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Hinweis zur verantwortlichen Stelle</h3>
              <p className="font-semibold mb-2">Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:</p>
              <div className="bg-gray-50 p-4 rounded-lg mt-2">
                <p>AutoLabel</p>
                <p>49086 Osnabrück</p>
                <p>Deutschland</p>
                <p className="mt-2">
                  E-Mail: <a href="mailto:AutoLabel@gmx.de" className="text-blue-600 hover:text-blue-700">AutoLabel@gmx.de</a>
                </p>
              </div>
              <p className="mt-4">
                Verantwortliche Stelle ist die natürliche oder juristische Person, die allein oder gemeinsam mit anderen 
                über die Zwecke und Mittel der Verarbeitung von personenbezogenen Daten (z. B. Namen, E-Mail-Adressen o. Ä.) entscheidet.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Speicherdauer</h3>
              <p>
                Soweit innerhalb dieser Datenschutzerklärung keine speziellere Speicherdauer genannt wurde, verbleiben 
                Ihre personenbezogenen Daten bei uns, bis der Zweck für die Datenverarbeitung entfällt. Wenn Sie ein 
                berechtigtes Löschersuchen geltend machen oder eine Einwilligung zur Datenverarbeitung widerrufen, werden 
                Ihre Daten gelöscht, sofern wir keine anderen rechtlich zulässigen Gründe für die Speicherung Ihrer 
                personenbezogenen Daten haben.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Widerruf Ihrer Einwilligung zur Datenverarbeitung</h3>
              <p>
                Viele Datenverarbeitungsvorgänge sind nur mit Ihrer ausdrücklichen Einwilligung möglich. Sie können eine 
                bereits erteilte Einwilligung jederzeit widerrufen. Die Rechtmäßigkeit der bis zum Widerruf erfolgten 
                Datenverarbeitung bleibt vom Widerruf unberührt.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Widerspruchsrecht gegen die Datenerhebung in besonderen Fällen</h3>
              <p>
                Wenn die Datenverarbeitung auf Grundlage von Art. 6 Abs. 1 lit. e oder f DSGVO erfolgt, haben Sie 
                jederzeit das Recht, aus Gründen, die sich aus Ihrer besonderen Situation ergeben, gegen die Verarbeitung 
                Ihrer personenbezogenen Daten Widerspruch einzulegen.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Beschwerderecht bei der zuständigen Aufsichtsbehörde</h3>
              <p>
                Im Falle von Verstößen gegen die DSGVO steht den Betroffenen ein Beschwerderecht bei einer Aufsichtsbehörde, 
                insbesondere in dem Mitgliedstaat ihres gewöhnlichen Aufenthalts, ihres Arbeitsplatzes oder des Orts des 
                mutmaßlichen Verstoßes zu. Das Beschwerderecht besteht unbeschadet anderweitiger verwaltungsrechtlicher oder 
                gerichtlicher Rechtsbehelfe.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Datenerfassung auf dieser Website</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Registrierung</h3>
              <p>
                Sie können sich auf dieser Website registrieren, um zusätzliche Funktionen auf der Seite zu nutzen. 
                Die dazu eingegebenen Daten verwenden wir nur zum Zwecke der Nutzung des jeweiligen Angebotes oder 
                Dienstes, für den Sie sich registriert haben.
              </p>
              <p className="mt-2">
                <strong>Erhobene Daten:</strong>
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>E-Mail-Adresse (erforderlich)</li>
                <li>Name (optional)</li>
                <li>Passwort (verschlüsselt gespeichert)</li>
              </ul>
              <p className="mt-4">
                Die bei der Registrierung eingegebenen Daten werden für die Zwecke der Nutzung unseres Angebotes 
                verwendet. Die Daten werden solange gespeichert, wie Sie bei uns registriert sind und werden danach 
                gelöscht, sofern gesetzliche Aufbewahrungspflichten nicht entgegenstehen.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Zahlungsabwicklung</h3>
              <p>
                Für die Zahlungsabwicklung verwenden wir den Dienstleister Stripe. Bei der Zahlungsabwicklung werden 
                folgende Daten an Stripe übermittelt:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>E-Mail-Adresse</li>
                <li>Name (falls angegeben)</li>
                <li>Zahlungsinformationen (werden direkt an Stripe übermittelt, nicht auf unseren Servern gespeichert)</li>
              </ul>
              <p className="mt-4">
                Die Datenverarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO zur Erfüllung des Vertrags. 
                Weitere Informationen zur Datenverarbeitung durch Stripe finden Sie in der Datenschutzerklärung von Stripe: 
                <a href="https://stripe.com/de/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 ml-1">
                  https://stripe.com/de/privacy
                </a>
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">E-Mail-Versand</h3>
              <p>
                Für den Versand von E-Mails verwenden wir den Dienstleister Resend. Bei der E-Mail-Übermittlung werden 
                folgende Daten an Resend übermittelt:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>E-Mail-Adresse</li>
                <li>Name (falls angegeben)</li>
              </ul>
              <p className="mt-4">
                Die Datenverarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO zur Erfüllung des Vertrags 
                sowie Art. 6 Abs. 1 lit. f DSGVO zur Wahrung unserer berechtigten Interessen. Weitere Informationen zur 
                Datenverarbeitung durch Resend finden Sie in der Datenschutzerklärung von Resend: 
                <a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 ml-1">
                  https://resend.com/legal/privacy-policy
                </a>
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Cookies</h3>
              <p>
                Diese Website verwendet Cookies. Cookies sind kleine Textdateien, die auf Ihrem Endgerät gespeichert werden. 
                Wir verwenden nur technisch notwendige Cookies, die für die Funktion der Website erforderlich sind.
              </p>
              <p className="mt-2">
                Sie können Ihre Cookie-Einstellungen jederzeit über das Cookie-Banner anpassen.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Ihre Rechte</h2>
              <p>Sie haben folgende Rechte:</p>
              <ul className="list-disc list-inside mt-2 space-y-2">
                <li><strong>Auskunftsrecht:</strong> Sie haben das Recht, Auskunft über Ihre gespeicherten personenbezogenen Daten zu erhalten.</li>
                <li><strong>Berichtigungsrecht:</strong> Sie haben das Recht, die Berichtigung unrichtiger Daten zu verlangen.</li>
                <li><strong>Löschungsrecht:</strong> Sie haben das Recht, die Löschung Ihrer Daten zu verlangen.</li>
                <li><strong>Einschränkungsrecht:</strong> Sie haben das Recht, die Einschränkung der Verarbeitung zu verlangen.</li>
                <li><strong>Datenübertragbarkeit:</strong> Sie haben das Recht, Ihre Daten in einem strukturierten, gängigen und maschinenlesbaren Format zu erhalten.</li>
                <li><strong>Widerspruchsrecht:</strong> Sie haben das Recht, der Verarbeitung Ihrer Daten zu widersprechen.</li>
              </ul>
              <p className="mt-4">
                Um Ihre Rechte auszuüben, kontaktieren Sie uns bitte unter: 
                <a href="mailto:AutoLabel@gmx.de" className="text-blue-600 hover:text-blue-700 ml-1">AutoLabel@gmx.de</a>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Änderungen dieser Datenschutzerklärung</h2>
              <p>
                Wir behalten uns vor, diese Datenschutzerklärung anzupassen, damit sie stets den aktuellen rechtlichen 
                Anforderungen entspricht oder um Änderungen unserer Leistungen in der Datenschutzerklärung umzusetzen. 
                Für Ihren erneuten Besuch gilt dann die neue Datenschutzerklärung.
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

