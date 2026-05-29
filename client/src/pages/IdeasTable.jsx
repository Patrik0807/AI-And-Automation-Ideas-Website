import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

import {
  Download,
  Search,
  Filter,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  TrendingUp,
  Calendar,
  Clock
} from 'lucide-react';
import Papa from 'papaparse';
import { format } from 'date-fns';

const STATUS_COLORS = {
  'Submitted':          'bg-amber-50 text-amber-600 border-amber-100',
  'Approved':           'bg-emerald-50 text-emerald-600 border-emerald-100',
  'In Progress':        'bg-blue-50 text-blue-600 border-blue-100',
  'In Validation':      'bg-purple-50 text-purple-600 border-purple-100',
  'Implemented':        'bg-slate-50 text-slate-500 border-slate-200',
  'Rejected':           'bg-rose-50 text-rose-600 border-rose-100',
};

const SORT_OPTIONS = [
  { label: 'Latest Submission', key: 'createdAt', direction: 'desc', icon: Clock },
  { label: 'Earliest Submission', key: 'createdAt', direction: 'asc', icon: Calendar },
  { label: 'Highest Priority', key: 'priority', direction: 'desc', icon: TrendingUp },
  { label: 'Lowest Priority', key: 'priority', direction: 'asc', icon: AlertCircle },
  { label: 'Status-wise', key: 'status', direction: 'asc', icon: Filter },
];

export default function IdeasTable() {
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState(SORT_OPTIONS[0]);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchIdeas();
  }, []);

  const fetchIdeas = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/ideas');
      setIdeas(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch ideas. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const sortedAndFilteredIdeas = useMemo(() => {
    let filtered = ideas.filter(idea => {
      const formattedId = idea.customId || `WS-${String(idea._id).toUpperCase().slice(-6)}`;
      return (
        idea.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formattedId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });

    return filtered.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (sortConfig.key === 'priority') {
        const priorityMap = { 'High': 3, 'Medium': 2, 'Low': 1 };
        aValue = priorityMap[a.priority] || 0;
        bValue = priorityMap[b.priority] || 0;
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [ideas, searchTerm, sortConfig]);

  const exportToCSV = () => {
    // 1. Prepare clean data summary for export
    const exportData = sortedAndFilteredIdeas.map(i => ({
      "ID": i.customId || `WS-${i._id.toString().slice(-6).toUpperCase()}`,
      "Classification": i.classification || "Automation",
      "Function": i.category,
      "Title": i.title,
      "Problem Statement": i.problemStatement || "N/A",
      "Proposed Solution": i.description,
      "Status": i.status,
      "Submitted Date": format(new Date(i.createdAt), 'yyyy-MM-dd'),
      "Priority": i.priority,
      "Technical Feasibility": i.technicalFeasibility,
      "Business Impact": i.businessImpact || "N/A",
      "Assigned Reviewer": i.assignedReviewer || "N/A",
      "Outcomes & Benefits": i.outcomesAndBenefits || "N/A"
    }));

    // 2. Generate CSV string with proper quoting using PapaParse
    const csv = Papa.unparse(exportData);

    // 3. Create Blob with UTF-8 BOM (essential for Excel to recognize it correctly)
    const blob = new Blob(["\ufeff", csv], { type: 'text/csv;charset=utf-8;' });

    // 4. Force download using standard browser anchor method
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `automation_ideas_${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin mb-4" />
        <p className="text-slate-500 font-medium tracking-wide">Gathering industrial insights...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20">
      {/* Header Section */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          {/* <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-1 bg-primary-600 rounded-full" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-primary-600">Warehousing Domain</span>
          </div> */}
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Ideas Inventory
          </h1>
          <p className="text-slate-500 mt-2 font-bold text-base">
            An overview of all submitted ideas across the TAL ecosystem.
          </p>
        </div>

        <button
          onClick={exportToCSV}
          disabled={ideas.length === 0}
          className="flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl
                     font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 disabled:opacity-50 active:scale-95"
        >
          <Download className="w-5 h-5" />
          Export to CSV
        </button>
      </div>

      {/* Control Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-8">
        <div className="md:col-span-8 relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ID or Title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-white border border-gray-100 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-medium text-slate-700 shadow-sm"
          />
        </div>

        <div className="md:col-span-4 relative">
          <button
            onClick={() => setShowSortDropdown(!showSortDropdown)}
            className="w-full flex items-center justify-between px-6 py-4 bg-white border border-gray-100 rounded-2xl font-bold text-slate-700 hover:border-primary-500 transition-all shadow-sm"
          >
            <div className="flex items-center gap-2">
              <sortConfig.icon className="w-4 h-4 text-primary-500" />
              <span>{sortConfig.label}</span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {showSortDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowSortDropdown(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 left-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-20 overflow-hidden"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => {
                        setSortConfig(opt);
                        setShowSortDropdown(false);
                      }}
                      className={`w-full flex items-center gap-3 px-6 py-3.5 text-sm font-bold text-left transition-colors
                        ${sortConfig.label === opt.label ? 'text-primary-600 bg-primary-50' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      <opt.icon className={`w-4 h-4 ${sortConfig.label === opt.label ? 'text-primary-600' : 'text-slate-400'}`} />
                      {opt.label}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
               <tr className="bg-[#df0a1c] border-b border-slate-600 text-base font-semibold uppercase tracking-wide text-white">
                <th className="px-6 py-6 w-24">ID</th>
                <th className="px-6 py-6 w-24">Class</th>
                <th className="px-8 py-6 w-48">Function</th>
                <th className="px-8 py-6 min-w-[300px]">Idea Title</th>
                <th className="px-8 py-6 w-40">Status</th>
                <th className="px-6 py-6 w-32">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sortedAndFilteredIdeas.map((idea, idx) => (
                <tr
                  key={idea._id}
                  onClick={() => navigate(`/ideas/${idea._id}`)}
                  className={`group transition-colors cursor-pointer ${idx % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'} hover:bg-primary-50 border-b border-gray-100`}
                >
                  <td className="px-6 py-6 whitespace-nowrap min-w-fit">
                    <span className="font-mono text-sm font-black text-primary-600 bg-primary-50 px-3 py-1.5 rounded-lg border border-primary-100 block w-fit">
                      {idea.customId || `WS-${idea._id.toString().slice(-6).toUpperCase()}`}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest border
                      ${idea.classification === 'AI' 
                        ? 'bg-[#FDF2F8] text-[#C24180] border-[#FBCFE8]' 
                        : 'bg-[#EDFDFD] text-[#2C7A7B] border-[#C4F1F9]'}`}>
                      {idea.classification === 'AI' ? 'AI' : 'Automation'}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg whitespace-nowrap">
                      {idea.category}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <p className="font-bold text-slate-900 group-hover:text-primary-700 transition-colors line-clamp-1">
                      {idea.title}
                    </p>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`inline-flex items-center px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${STATUS_COLORS[idea.status] || 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                      {idea.status}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-slate-900 font-bold text-sm">
                        {format(new Date(idea.createdAt), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {sortedAndFilteredIdeas.length === 0 && (
            <div className="p-32 flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <AlertCircle className="w-12 h-12 text-slate-200" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">No Ideas Found</h3>
              <p className="text-slate-500 max-w-xs mx-auto font-medium leading-relaxed">
                Try adjusting your search terms or wait for new submissions.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* <div className="mt-8 flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
        <span>TAL Automation Hub v2.0</span>
        <span>Confidential Inventory &copy; {new Date().getFullYear()}</span>
      </div> */}
    </div>
  );
}
