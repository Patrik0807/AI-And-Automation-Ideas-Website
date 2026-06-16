import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
  LogOut,
  User,
  ChevronDown,
  Shield,
  Menu,
  X,
  BarChart,
  Lightbulb,
  LayoutDashboard,
  ArrowRight,
  Atom,
  ClipboardList,
  Users,
} from 'lucide-react';



function ToyotaLogo({ className = '' }) {
  return (
    <img
      src="/assets/toyota-logo.png.png"
      alt="Toyota"
      className={`object-contain ${className}`}
    />
  );
}

const NAV_LINKS = [
  { to: '/ideas', label: 'Warehousing Ideas', icon: Lightbulb },
  { to: '/ideas-table', label: 'Table View', icon: LayoutDashboard },
  { to: '/insights', label: 'Insights', icon: BarChart },
  //{ to: '/voice-ideas', label: 'VOICE Ideas', icon: Atom },
  { to: '/team-structure', label: 'Core team', icon: Users },
];


export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfile, setShowProfile] = useState(false);
  const [showMobile, setShowMobile] = useState(false);
  const profileRef = useRef(null);

  // Close dropdowns on route change
  useEffect(() => {
    setShowProfile(false);
    setShowMobile(false);
  }, [location.pathname]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfile(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-white border-b-2 border-gray-100 shadow-sm">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-24 lg:h-28 transition-all duration-300">

          {/* ── Logo ── */}
          <Link to="/" className="flex items-center gap-4 group">
            {/* Keeping the larger logo as requested */}
            <ToyotaLogo className="block w-40 sm:w-52 h-auto group-hover:scale-105 transition-transform duration-200"/>
            {/* <ToyotaLogo className="w-16 h-16 sm:w-20 sm:h-20 group-hover:scale-105 transition-transform duration-200" />
            <div className="leading-tight">
              <p className="text-slate-900 font-black text-xl tracking-tight leading-none mb-0.5">TOYOTA</p>
              <p className="text-primary-600 text-[11px] sm:text-xs font-bold tracking-[0.2em] uppercase leading-none">
                Automated Logistics
              </p>
            </div> */}
          </Link>

          <div className="hidden md:flex items-center gap-3 ml-12 flex-1">
            {NAV_LINKS.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-[17px] font-extrabold transition-all duration-150
                  ${isActive(to)
                    ? 'bg-primary-50 text-primary-600 border border-primary-100 shadow-sm'
                    : 'text-black hover:text-slate-900 hover:bg-gray-50'
                  }`}
              >
                {Icon && <Icon className="w-5 h-5" />}
                {label}
              </Link>
            ))}
          </div>

          {/* ── Desktop User Menu ── */}
          <div className="hidden sm:flex items-center gap-3">
            {user ? (
              <>
                {user.role === 'admin' && (
                  <span className="flex items-center gap-1.5 bg-primary-50 border border-primary-100
                                    text-primary-600 text-xs font-semibold px-3 py-1.5 rounded-full">
                    <Shield className="w-3.5 h-3.5" />
                    Admin
                  </span>
                )}

                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setShowProfile(!showProfile)}
                    className="flex items-center gap-2.5 bg-white hover:bg-gray-50 border border-gray-200
                               text-slate-700 px-4 py-2.5 rounded-2xl transition-all duration-200"
                  >
                    <div className="w-9 h-9 bg-primary-50 border border-primary-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-primary-600" />
                    </div>
                    <span className="font-bold text-[15px] text-slate-800 tracking-tight">{user.name}</span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showProfile ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {showProfile && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.97 }}
                        className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl
                                   border border-gray-100 overflow-hidden"
                      >
                        <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-100">
                          <p className="font-semibold text-slate-800">{user.name}</p>
                          <p className="text-sm text-slate-500">{user.email}</p>
                          <p className="text-xs text-primary-600 font-medium mt-1 capitalize">
                            {user.role} • {user.department}
                          </p>
                        </div>
                        <div className="p-2">
                          {/* Admin-only: Action Points */}
                          {user.role === 'admin' && (
                            <Link
                              to="/action-points"
                              onClick={() => setShowProfile(false)}
                              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700
                                         hover:bg-primary-50 hover:text-primary-700 rounded-xl transition-colors"
                            >
                              <ClipboardList className="w-4 h-4 text-primary-500" />
                              Action Points
                            </Link>
                          )}
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600
                                       hover:bg-red-50 rounded-xl transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                          </button>
                        </div>

                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-slate-600 font-bold text-[15px] px-4 py-2 hover:text-primary-600 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/?openForm=true"
                  className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white text-[15px] font-bold px-6 py-2.5 rounded-xl transition-all shadow-md active:scale-95 border-2 border-primary-400"
                >
                  Get Started <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>

          {/* ── Mobile Menu Button ── */}
          <button
            onClick={() => setShowMobile(!showMobile)}
            className="sm:hidden text-slate-500 hover:text-slate-900 p-2 transition-colors"
          >
            {showMobile ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* ── Mobile Menu ── */}
      <AnimatePresence>
        {showMobile && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="sm:hidden bg-white border-t border-gray-100 overflow-hidden shadow-md"
          >
            <div className="px-4 py-4 space-y-2">
              {NAV_LINKS.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setShowMobile(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors
                    ${isActive(to) ? 'bg-primary-50 text-primary-600' : 'text-slate-500 hover:text-slate-900 hover:bg-gray-50'}`}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  {label}
                </Link>
              ))}

              {user ? (
                <div className="pt-3 mt-3 border-t border-gray-100">
                  <div className="flex items-center gap-3 px-4 py-2 text-slate-700">
                    <div className="w-8 h-8 bg-primary-50 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50
                               rounded-xl transition-colors text-sm font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="pt-3 mt-3 border-t border-gray-100 flex flex-col gap-2">
                  <Link
                    to="/login"
                    onClick={() => setShowMobile(false)}
                    className="flex justify-center px-4 py-3 text-slate-700 font-bold hover:bg-gray-50 rounded-xl transition-colors"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setShowMobile(false)}
                    className="flex justify-center bg-primary-600 text-white font-bold px-4 py-3 rounded-xl transition-colors"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
