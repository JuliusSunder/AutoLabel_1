import Link from "next/link";
import { Container } from "@/app/components/ui/Container";
import { Navigation } from "@/app/components/sections/Navigation";
import { Footer } from "@/app/components/sections/Footer";
import { BackButton } from "@/app/components/ui/BackButton";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Impressum - AutoLabel",
  description: "Legal information and contact details for AutoLabel. Company address and responsible party according to German law.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function ImpressumPage() {
  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pt-24 pb-20">
        <Container>
        <div className="max-w-4xl mx-auto">
          <BackButton />
          <h1 className="text-4xl font-bold text-gray-900 mb-8">
            Impressum
          </h1>
          
          <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6 text-gray-700">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Angaben gemäß § 5 TMG</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-semibold">AutoLabel</p>
                <p>49086 Osnabrück</p>
                <p>Deutschland</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Kontakt</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p>
                  E-Mail: <a href="mailto:AutoLabel@gmx.de" className="text-blue-600 hover:text-blue-700">AutoLabel@gmx.de</a>
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p>AutoLabel</p>
                <p>49086 Osnabrück</p>
                <p>Deutschland</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Haftungsausschluss</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Haftung für Inhalte</h3>
              <p>
                Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den 
                allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht 
                unter der Verpflichtung, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach 
                Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
              </p>
              <p className="mt-2">
                Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen 
                bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer 
                konkreten Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden Rechtsverletzungen werden wir 
                diese Inhalte umgehend entfernen.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Haftung für Links</h3>
              <p>
                Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. 
                Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten 
                Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich. Die verlinkten Seiten 
                wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum 
                Zeitpunkt der Verlinkung nicht erkennbar.
              </p>
              <p className="mt-2">
                Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete Anhaltspunkte einer 
                Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Links umgehend entfernen.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Urheberrecht</h3>
              <p>
                Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen 
                Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der 
                Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers. 
                Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen Gebrauch gestattet.
              </p>
              <p className="mt-2">
                Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden, werden die Urheberrechte Dritter 
                beachtet. Insbesondere werden Inhalte Dritter als solche gekennzeichnet. Sollten Sie trotzdem auf eine 
                Urheberrechtsverletzung aufmerksam werden, bitten wir um einen entsprechenden Hinweis. Bei Bekanntwerden von 
                Rechtsverletzungen werden wir derartige Inhalte umgehend entfernen.
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

