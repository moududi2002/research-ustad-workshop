// /frontend/src/components/About.tsx
import { HiOutlineBookOpen, HiOutlineGlobeAlt } from 'react-icons/hi2';

export default function About() {
  return (
    <section id="about" className="scroll-mt-20 bg-white py-20 sm:py-24">
      <div className="container-custom">
        <div className="grid items-start gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary-700">
              <HiOutlineBookOpen className="h-3.5 w-3.5" />
              About the Workshop
            </span>
            <h2 className="section-title mt-4">
              Where Research Meets Global Opportunity
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink-600">
              This free workshop is designed for undergraduate students, graduates,
              higher study aspirants, and beginner researchers who want to
              understand how research experience can strengthen their academic
              profile and support their higher study journey.
            </p>
            <p className="mt-4 text-base leading-relaxed text-ink-600">
              Participants will gain practical insights into research,
              publications, academic networking, scholarships, and international
              academic opportunities.
            </p>
          </div>

          <div className="lg:col-span-7">
            <div className="grid gap-5 sm:grid-cols-2">
              {[
                {
                  icon: <HiOutlineBookOpen className="h-6 w-6" />,
                  title: 'Practical Research Insights',
                  text: 'Learn how research actually works — from idea to publication.',
                },
                {
                  icon: <HiOutlineGlobeAlt className="h-6 w-6" />,
                  title: 'Global Academic Pathways',
                  text: 'Discover scholarships, research assistantships, and international opportunities.',
                },
                {
                  icon: <HiOutlineBookOpen className="h-6 w-6" />,
                  title: 'Profile Building Strategy',
                  text: 'Build a structured academic profile that stands out to admissions committees.',
                },
                {
                  icon: <HiOutlineGlobeAlt className="h-6 w-6" />,
                  title: 'Networking Techniques',
                  text: 'Connect with mentors, faculty members, and researchers worldwide.',
                },
              ].map((item) => (
                <div key={item.title} className="card">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                    {item.icon}
                  </div>
                  <h3 className="mt-4 font-display text-base font-bold text-ink-950">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-500">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}