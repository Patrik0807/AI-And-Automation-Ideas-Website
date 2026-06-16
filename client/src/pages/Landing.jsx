import { useRef, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  ArrowRight,
  Lightbulb,
  Rocket,
  Target,
  BarChart3,
  TrendingUp,
  CheckCircle2,
  ChevronRight,
  Zap,
  Shield,
  GitMerge,
  ChevronDown
} from 'lucide-react';
import IdeaForm from '../components/IdeaForm';

/* ─── Toyota Logo SVG ─────────────────────────────────────────── */
function ToyotaLogo({ className = 'w-10 h-10', color = '#EB0A1E' }) {
  return (
    <svg viewBox="0 0 100 60" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="50" cy="30" rx="48" ry="28" stroke={color} strokeWidth="5" fill="none" />
      <ellipse cx="50" cy="30" rx="20" ry="28" stroke={color} strokeWidth="5" fill="none" />
      <ellipse cx="50" cy="14" rx="30" ry="10" stroke={color} strokeWidth="5" fill="none" />
    </svg>
  );
}

/* ─── Fade-in section wrapper ────────────────────────────────── */
function FadeSection({ children, className = '', delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, ease: 'easeOut', delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Section label pill ─────────────────────────────────────── */
function SectionLabel({ text }) {
  return (
    <span className="inline-flex items-center gap-2 bg-primary-50 border-2 border-primary-100 text-primary-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-4 shadow-sm">
      <span className="w-2 h-2 rounded-full bg-primary-600 animate-pulse" />
      {text}
    </span>
  );
}

export default function Landing() {
  const [showForm, setShowForm] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (location.state?.openForm || params.get('openForm') === 'true') {
      setShowForm(true);
      // Clean up the URL and state so it doesn't re-open on refresh
      navigate('.', { replace: true, state: {} });
    }
  }, [location, navigate]);

  const handleIdeaCreated = () => {
    // Form closes itself via onClose; nothing extra needed on Landing
  };

  /* ── WHY cards data ─────────────────────────────────────────── */
  const whyCards = [
    {
      icon: TrendingUp,
      title: 'Enhance Customer Satisfaction',
      desc: 'Enable automation in business processes to deliver faster, more reliable outcomes and optimize business value.',
    },
    {
      icon: Target,
      title: 'Improve Scalability & Flexibility',
      desc: 'Build solutions that adapt easily across different operations and growing demands for modern logistics.',
    },
    {
      icon: Zap,
      title: 'Optimize Costs',
      desc: 'Reduce operational expenses by minimizing manual effort and improving resource efficiency across the board.',
    },
  ];

  /* ── HOW steps ──────────────────────────────────────────────── */
  const howSteps = [
    {
      step: '01',
      title: 'Collect Ideas',
      desc: 'Define a clear roadmap to gather automation ideas from across the organization.',
    },
    {
      step: '02',
      title: 'Evaluate Impact',
      desc: 'Analyze business value, feasibility, and potential outcomes of each idea through a structured review.',
    },
    {
      step: '03',
      title: 'Collaborate & Implement',
      desc: 'Work closely with technical teams to develop and deploy automation solutions in a collaborative environment.',
    },
    {
      step: '04',
      title: 'Monitor Progress',
      desc: 'Track implementation status and ensure continuous improvement through defined monitoring mechanisms.',
    },
  ];

  /* ── WHAT cards ─────────────────────────────────────────────── */
  const whatCards = [
    {
      icon: Target,
      title: 'Lower Operational Costs',
      desc: 'Achieve cost efficiency through automation and optimized resource utilization.',
      accent: 'bg-primary-100 text-primary-600',
    },
    {
      icon: Rocket,
      title: 'Faster & Scalable Solutions',
      desc: 'Deliver quick, flexible, and scalable automation across multiple departments.',
      accent: 'bg-emerald-100 text-emerald-600',
    },
    {
      icon: BarChart3,
      title: 'Improved Competitiveness',
      desc: 'Enable innovation and efficiency to stay ahead in a competitive environment.',
      accent: 'bg-blue-100 text-blue-600',
    },
  ];

  /* ── APPROACH stages (Vertical) ─────────────────────────────── */
  const approachStages = [
    { label: 'Ideation', desc: 'Capture and prioritize ideas from all levels.' },
    { label: 'Planning', desc: 'Design the workflow and architecture framework.' },
    { label: 'Build', desc: 'Engineering teams develop the requested solution.' },
    { label: 'Deploy', desc: 'Roll out and train across the target facilities.' },
    { label: 'Optimise', desc: 'Monitor, continuously measure, and improve.' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col overflow-x-hidden selection:bg-primary-100 selection:text-primary-900">

      {/* 🏹 HERO SECTION */}
      <section className="relative pt-24 pb-20 lg:pt-32 lg:pb-32 overflow-hidden bg-white">
        {/* Subtle background abstract elements */}
        <div className="absolute top-0 inset-x-0 h-full w-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-40"></div>
        <div className="absolute top-[-10%] right-[-15%] w-[50%] h-[80%] bg-primary-500/5 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] left-[-10%] w-[40%] h-[60%] bg-slate-300/20 rounded-full blur-[100px]" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-center max-w-4xl mx-auto"
          >
            {/* Logo emphasis */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-white shadow-xl shadow-slate-200 border-2 border-gray-100 rounded-3xl flex items-center justify-center animate-float">
                <ToyotaLogo className="w-10 h-10" color="#EB0A1E" />
              </div>
            </div>

            {/* Project Full Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-tight tracking-tight">
              Toyota Automated Logistics <br />
              <span className="text-primary-600">AI & Automation</span>
            </h1>

            <p className="mt-8 text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto font-medium">
              A premium internal platform designed to capture and track AI and automation ideas from the warehouse domain, transforming raw concepts into measurable business value.
            </p>

            {/* CTAs — only Submit Idea shown; Explore Insights removed */}
            <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center justify-center gap-2 bg-primary-500 text-white font-bold px-10 py-4 rounded-xl hover:bg-primary-600 transition-colors shadow-lg shadow-primary-500/25 active:scale-95 text-base border-2 border-primary-400"
              >
                Submit Idea <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 🛡️ WHY SECTION */}
      <section id="why" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeSection className="text-center mb-16">
            <SectionLabel text="Why We Need This" />
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mt-2">
              Driving Digital Transformation
            </h2>
          </FadeSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {whyCards.map((card, i) => {
              const Icon = card.icon;
              return (
                <FadeSection key={i} delay={i * 0.1}>
                  <div className="group p-8 rounded-[2rem] border-2 border-gray-100 bg-white shadow-sm hover:shadow-xl hover:border-gray-300 transition-all duration-300">
                    <div className="w-14 h-14 bg-gray-50 border-2 border-gray-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary-50 transition-all duration-300">
                      <Icon className="w-7 h-7 text-slate-700 group-hover:text-primary-600 transition-colors duration-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">{card.title}</h3>
                    <p className="text-slate-500 leading-relaxed text-sm font-medium">{card.desc}</p>
                  </div>
                </FadeSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════ HOW ══════════════════════════════════ */}
      <section id="how" className="py-24 bg-white border-b-2 border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeSection className="text-center mb-16">
            <SectionLabel text="How It works" />
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mt-2">
              A Structured & Collaborative Approach
            </h2>
          </FadeSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {howSteps.map((item, i) => (
              <FadeSection key={i} delay={i * 0.1}>
                <div className="relative bg-white rounded-3xl p-8 border-2 border-gray-100 shadow-sm hover:shadow-lg hover:border-gray-300 transition-all duration-300 h-full">
                  {/* Step number */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gray-50 border-2 border-gray-100 text-primary-600 font-black text-lg flex items-center justify-center">
                      {item.step}
                    </div>
                    {/* Connector arrow (not on last) */}
                    {i < howSteps.length - 1 && (
                      <ChevronRight className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-300 hidden lg:block" />
                    )}
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-3">{item.title}</h4>
                  <p className="text-slate-500 text-sm leading-relaxed font-medium">{item.desc}</p>
                </div>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ WHAT ═════════════════════════════════ */}
      <section id="what" className="py-24 bg-gray-50 border-b-2 border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeSection className="text-center mb-16">
            <SectionLabel text="What The System Does" />
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mt-2">
              Business Outcomes
            </h2>
          </FadeSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {whatCards.map((card, i) => {
              const Icon = card.icon;
              return (
                <FadeSection key={i} delay={i * 0.12}>
                  <div className="relative overflow-hidden rounded-[2rem] border-2 border-gray-100 bg-white p-8 shadow-sm hover:shadow-md transition-all duration-300 hover:border-primary-200">
                    <div className={`${card.accent} w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-sm border-2 border-white/50`}>
                      <Icon className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">{card.title}</h3>
                    <p className="text-slate-500 leading-relaxed text-sm font-medium">{card.desc}</p>
                  </div>
                </FadeSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* 🏁 FINAL CTA */}
      <section className="py-24 bg-gray-50 border-t-2 border-gray-200 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
          <FadeSection>
            <h2 className="text-4xl font-black text-slate-900 mb-6">
              Ready to submit a new idea?
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center justify-center gap-2 bg-primary-500 text-white font-bold px-10 py-4 rounded-xl hover:bg-primary-600 transition-colors shadow-lg shadow-primary-500/25 active:scale-95 text-base border-2 border-primary-400"
              >
                Submit Idea <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </FadeSection>
        </div>
      </section>

      <footer className="bg-white border-t-2 border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              <ToyotaLogo className="w-8 h-8" color="#EB0A1E" />
              <div>
                <Link to="https://toyota-automated-logistics.com/" target="_blank" className="text-slate-900 font-black text-sm tracking-tight">TOYOTA</Link>
                <p className="text-primary-600 text-[10px] font-bold tracking-[0.2em] uppercase">Automated Logistics India</p>
              </div>
            </div>

            <div className="flex gap-6 text-sm font-semibold text-slate-500">
              <button
                onClick={() => setShowForm(true)}
                className="hover:text-primary-600 transition-colors"
              >
                Submit Idea
              </button>
              <Link to="/login" className="hover:text-primary-600 transition-colors">Admin Login</Link>
            </div>

            <p className="text-xs font-semibold text-slate-400">
              © {new Date().getFullYear()} Toyota Automated Logistics.
            </p>
          </div>
        </div>
      </footer>

      {/* IdeaForm Modal — rendered directly on Landing page */}
      <IdeaForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onCreated={handleIdeaCreated}
      />
    </div>
  );
}
