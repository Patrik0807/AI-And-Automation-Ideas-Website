import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import StatusBadge from './StatusBadge';
import {
  ArrowRight,
  User,
  Lightbulb,
  Wrench
} from 'lucide-react';
import { isImage } from './IdeaForm';

const categoryColors = {
  'Project engineering': { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-l-blue-500' },
  'Sales engineering':   { bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-l-pink-500' },
  'ASRS':                { bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-l-violet-500' },
  'Integration':         { bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-l-cyan-500' },
  'IT Delivery':{ bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-l-indigo-500' },
  'Installation':        { bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-l-teal-500' },
  'Test and Deployment': { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-l-amber-500' },
  'Other':               { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-l-gray-400' }
};

export default function IdeaCard({ idea, index }) {
  const navigate = useNavigate();
  const catConfig = categoryColors[idea.category] || categoryColors.Other;
  
  // Find the first valid image for thumbnails, ignoring PDFs/Docs
  const displayImage = Array.isArray(idea.images) ? idea.images.find(img => isImage(img)) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.5, ease: 'easeOut' }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      onClick={() => navigate(`/ideas/${idea._id}`)}
      className="group p-6 rounded-[2rem] bg-white border border-gray-200 shadow-sm hover:shadow-2xl hover:border-gray-300 transition-all duration-300 relative overflow-hidden flex flex-col h-full cursor-pointer"
    >
      {/* Decorative Top-Right Mesh Overlay */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-500/10 to-transparent rounded-bl-[100px] pointer-events-none opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" />
      
      {/* Header: Top Section */}
      <div className="flex items-start justify-between mb-6 relative z-10 w-full">
        <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-gray-200 shadow-sm bg-gray-50">
          <img 
            src={displayImage || "/automation_illustration.png"} 
            alt="Idea thumbnail" 
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/automation_illustration.png";
            }}
          />
        </div>
        <div className="flex flex-col items-end gap-2.5">
          <StatusBadge status={idea.status} />
          {(idea.classification || 'Automation') && (
            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.1em] shadow-sm border
              ${(idea.classification || 'Automation') === 'AI' 
                ? 'bg-[#FDF2F8] text-[#C24180] border-[#FBCFE8]' 
                : 'bg-[#EDFDFD] text-[#2C7A7B] border-[#C4F1F9]'}`}>
              {idea.classification || 'Automation'}
            </div>
          )}
        </div>
      </div>

      {/* Tags: Category & Priority & Feasibility */}
      <div className="flex flex-wrap items-center gap-2 mb-4 relative z-10 w-full">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest shrink-0">
          {idea.category}
        </span>
        <span className="w-1 h-1 bg-slate-300 rounded-full shrink-0" />
        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider shrink-0
            ${idea.priority === 'High' ? 'bg-red-50 text-red-600 border border-red-100' :
              idea.priority === 'Medium' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
              'bg-slate-50 text-slate-600 border border-slate-200'}
          `}>
          {idea.priority}
        </span>
        <span className="text-slate-400 text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider border border-gray-100 bg-gray-50 flex items-center gap-1 shrink-0">
          <Wrench className="w-3 h-3 text-slate-400" />
          {idea.technicalFeasibility || 'Moderate'}
        </span>
      </div>

      {/* Main Content */}
      <h3 className="text-xl font-black text-slate-900 group-hover:text-primary-600 transition-colors line-clamp-2 mb-3 relative z-10">
        {idea.title}
      </h3>
      
      <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 mb-6 relative z-10 flex-1">
        {idea.description}
      </p>
      
      {/* Optional Large Thumbnail for Premium Vibe */}
      {/* {displayImage && (
        <div className="w-full h-36 rounded-2xl overflow-hidden mb-6 relative z-10 ring-1 ring-gray-100 shadow-sm">
          <img
            src={displayImage}
            alt={idea.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://placehold.co/800x400/f8fafc/64748b?text=Image+Unavailable';
            }}
          />
          {idea.images.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm">
              +{idea.images.length - 1} attachments
            </div>
          )}
        </div>
      )} */}

      {/* Impact Badges */}
      {/* {idea.impact && (idea.impact.timeSaved || idea.impact.costSaved) && (
        <div className="flex items-center gap-3 mb-6 relative z-10 pt-4 border-t border-gray-50">
          {idea.impact.timeSaved && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
              <Clock className="w-3.5 h-3.5 text-primary-500" />
              {idea.impact.timeSaved}
            </div>
          )}
          {idea.impact.costSaved && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
              <IndianRupee className="w-3.5 h-3.5 text-emerald-500" />
              {idea.impact.costSaved}
            </div>
          )}
        </div>
      )} */}

      {/* Footer / Submit Info */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100 relative z-10 mt-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-primary-50 border border-primary-100 rounded-full flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-primary-600" />
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {idea.submittedByEmail || 'Anonymous'}
          </span>
        </div>
        
        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-primary-600 transition-colors" />
        </div>
      </div>
    </motion.div>
  );
}
