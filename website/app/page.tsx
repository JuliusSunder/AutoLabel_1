import { Navigation } from './components/sections/Navigation';
import { Hero } from './components/sections/Hero';
import { PowerfulWorkflow } from './components/sections/PowerfulWorkflow';
import { Testimonials } from './components/sections/Testimonials';
import { Pricing } from './components/sections/Pricing';
import { FAQ } from './components/sections/FAQ';
import { Footer } from './components/sections/Footer';
import { ScrollToTop } from './components/ui/ScrollToTop';
import { StructuredData } from './components/seo/StructuredData';

export default function Home() {
  return (
    <>
      <StructuredData />
      <Navigation />
      <main className="min-h-screen">
        <Hero />
        <PowerfulWorkflow />
        <Testimonials />
        <Pricing />
        <FAQ />
        <Footer />
      </main>
      <ScrollToTop />
    </>
  );
}
