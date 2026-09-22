//frontend/src/app/page.tsx
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import About from '@/components/About';
import Promise from '@/components/Promise';
import WhoShouldAttend from '@/components/WhoShouldAttend';
import Agenda from '@/components/Agenda';
import Outcomes from '@/components/Outcomes';
import Certificate from '@/components/Certificate';
import AboutResearchUstad from '@/components/AboutResearchUstad';
import CTASection from '@/components/CTASection';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <About />
        <Promise />
        <WhoShouldAttend />
        <Agenda />
        <Outcomes />
        <Certificate />
        <AboutResearchUstad />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}