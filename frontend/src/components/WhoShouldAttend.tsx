//frontend/src/components/WhoShouldAttend.tsx
import {
  HiOutlineUserGroup,
  HiOutlineAcademicCap,
  HiOutlineBriefcase,
  HiOutlineBeaker,
  HiOutlineDocumentText,
  HiOutlineGlobeAlt,
  HiOutlineLightBulb,
} from 'react-icons/hi2';

const audiences = [
  {
    icon: <HiOutlineAcademicCap className="h-6 w-6" />,
    label: 'Undergraduate Students',
  },
  { icon: <HiOutlineAcademicCap className="h-6 w-6" />, label: "Master's Students" },
  { icon: <HiOutlineBriefcase className="h-6 w-6" />, label: 'Recent Graduates' },
  { icon: <HiOutlineBeaker className="h-6 w-6" />, label: 'Research Beginners' },
  { icon: <HiOutlineDocumentText className="h-6 w-6" />, label: 'Thesis Students' },
  { icon: <HiOutlineGlobeAlt className="h-6 w-6" />, label: 'Higher Study Applicants' },
  { icon: <HiOutlineLightBulb className="h-6 w-6" />, label: 'Aspiring Researchers' },
];

export default function WhoShouldAttend() {
  return (
    <section className="bg-white py-20 sm:py-24">
      <div className="container-custom">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent-700">
            <HiOutlineUserGroup className="h-3.5 w-3.5" />
            Who Should Attend
          </span>
          <h2 className="section-title mt-4">
            This Workshop Is Built For You
          </h2>
          <p className="section-subtitle mx-auto">
            Whether you are just starting or already on your research journey, this
            session will meet you where you are.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {audiences.map((item) => (
            <div
              key={item.label}
              className="group flex flex-col items-center gap-3 rounded-2xl border border-ink-100 bg-white p-6 text-center shadow-soft transition-all hover:-translate-y-1 hover:border-primary-200 hover:shadow-card"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600 transition-colors group-hover:bg-primary-600 group-hover:text-white">
                {item.icon}
              </div>
              <span className="text-sm font-semibold text-ink-800">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}