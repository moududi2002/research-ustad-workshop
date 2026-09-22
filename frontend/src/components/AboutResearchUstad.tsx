//frontend/src/components/AboutResearchUstad.tsx
import { HiOutlineAcademicCap, HiOutlineHeart } from 'react-icons/hi2';
import { FiUsers, FiTarget, FiTrendingUp, FiGlobe } from 'react-icons/fi';

const values = [
  {
    icon: <FiUsers className="h-5 w-5" />,
    title: 'Mentorship',
    text: 'Guiding students and researchers at every step.',
  },
  {
    icon: <FiTarget className="h-5 w-5" />,
    title: 'Opportunities',
    text: 'Connecting you with research and academic openings.',
  },
  {
    icon: <FiTrendingUp className="h-5 w-5" />,
    title: 'Skill Development',
    text: 'Building practical, future-ready academic skills.',
  },
  {
    icon: <FiGlobe className="h-5 w-5" />,
    title: 'Collaboration',
    text: 'Fostering global academic partnerships.',
  },
];

export default function AboutResearchUstad() {
  return (
    <section className="bg-white py-20 sm:py-24">
      <div className="container-custom">
        <div className="grid items-center gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary-700">
              <HiOutlineAcademicCap className="h-3.5 w-3.5" />
              About Research Ustad
            </span>
            <h2 className="section-title mt-4">
              Empowering the Next Generation of Researchers
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink-600">
              Research Ustad is an academic and research-focused platform dedicated
              to empowering students and researchers through mentorship, research
              opportunities, skill development, and academic collaboration.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent-50 px-4 py-3 text-sm font-medium text-accent-800">
              <HiOutlineHeart className="h-4 w-4" />
              Built by researchers, for researchers.
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="grid gap-4 sm:grid-cols-2">
              {values.map((item) => (
                <div key={item.title} className="card">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                    {item.icon}
                  </div>
                  <h3 className="mt-4 font-display text-base font-bold text-ink-950">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-500">
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