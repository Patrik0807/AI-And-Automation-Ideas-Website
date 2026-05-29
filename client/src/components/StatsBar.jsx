import { motion } from 'framer-motion';
import { Lightbulb, Hourglass, CheckCircle2, Clock, Rocket, XCircle } from 'lucide-react';

/** Cards must match the 4 valid Mongoose status enum values */
const statCards = [
  {
    key:      'total',
    label:    'Total Ideas',
    icon:     Lightbulb,
    iconColor: '#EB0A1E',   // Toyota Red
    bg:       'bg-primary-50',
    ring:     'border-primary-100',
  },
  {
    key:      'Submitted',
    label:    'Submitted',
    icon:     Hourglass,
    iconColor: '#3B82F6',
    bg:       'bg-blue-50',
    ring:     'border-blue-100',
  },
  {
    key:      'Approved',
    label:    'Approved',
    icon:     CheckCircle2,
    iconColor: '#10B981',
    bg:       'bg-emerald-50',
    ring:     'border-emerald-100',
  },
  {
    key:      'In Progress',
    label:    'In Progress',
    icon:     Clock,
    iconColor: '#F59E0B',
    bg:       'bg-amber-50',
    ring:     'border-amber-100',
  },
  {
    key:      'In Validation',
    label:    'In Validation',
    icon:     Clock,
    iconColor: '#8B5CF6', // purple-500
    bg:       'bg-purple-50',
    ring:     'border-purple-100',
  },
  {
    key:      'Implemented',
    label:    'Implemented',
    icon:     Rocket,
    iconColor: '#16A34A',
    bg:       'bg-green-50',
    ring:     'border-green-100',
  },
];

export default function StatsBar({ stats, onFilterSelect }) {
  const getCount = (key) => {
    if (key === 'total') return stats?.total ?? 0;
    const found = stats?.byStatus?.find((s) => s._id === key);
    return found?.count ?? 0;
  };

  const handleClick = (key) => {
    if (!onFilterSelect) return;
    onFilterSelect(key === 'total' ? 'All' : key);
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
      {statCards.map((card, index) => {
        const Icon  = card.icon;
        const count = getCount(card.key);

        return (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, duration: 0.4 }}
            onClick={() => handleClick(card.key)}
            className={`relative overflow-hidden bg-white rounded-2xl p-5 shadow-sm border ${card.ring}
                       hover:shadow-md hover:border-gray-300 transition-all duration-300 group cursor-pointer active:scale-95`}
          >
            {/* Decorative top-right blob */}
            <div
              className="absolute top-0 right-0 w-20 h-20 rounded-full -translate-y-8 translate-x-8
                         opacity-[0.06] group-hover:opacity-[0.12] group-hover:scale-110 transition-all duration-500"
              style={{ backgroundColor: card.iconColor }}
            />

            <div className="flex items-start justify-between relative">
              <div>
                <p className="text-sm text-slate-500 font-medium">{card.label}</p>
                <motion.p
                  key={count}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-3xl font-black text-slate-800 mt-1"
                >
                  {count}
                </motion.p>
              </div>
              <div className={`${card.bg} p-3 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
                <Icon className="w-5 h-5" style={{ color: card.iconColor }} />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
