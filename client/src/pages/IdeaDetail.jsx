import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import API from '../api/ideas';
import StatusBadge from '../components/StatusBadge';
import toast from 'react-hot-toast';
import {
  ArrowLeft, AlertTriangle, Image, ShieldAlert, Tag, CalendarDays,
  Trash2, TrendingUp, Send, User, Edit, Wrench, FileText, Clock,
  Target, File as FileIcon, CheckCircle2, Circle, FlaskConical,
  CalendarClock, Pencil, Check, X as XIcon, Loader2, ChevronDown
} from 'lucide-react';
import IdeaForm, { isImage } from '../components/IdeaForm';


/** Valid idea statuses (includes new Validation Phase stage) */
const allStatuses = [
  'Submitted', 'Approved', 'In Progress', 'In Validation', 'Implemented', 'Rejected',
];

/** Pipeline stage icons */
const STAGE_ICONS = {
  'Submitted':          FileText,
  'Approved':           CheckCircle2,
  'In Progress':        Clock,
  'In Validation':      FlaskConical,
  'Implemented':        TrendingUp,
  'Rejected':           XIcon,
};


export default function IdeaDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [idea, setIdea] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  // Pipeline state
  const [pipeline, setPipeline] = useState([]);
  const [pipelineLoading, setPipelineLoading] = useState(null); // stageIndex being saved
  const [deadlineEdit, setDeadlineEdit] = useState(null);  // { index, value }



  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!id) return;
    fetchIdea();
  }, [id]);

  const fetchIdea = async () => {
    try {
      const { data } = await API.getIdea(id);
      setIdea(data);
      setPipeline(Array.isArray(data.statusPipeline) ? data.statusPipeline : []);
    } catch (error) {
      toast.error('Failed to load idea');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  /** Admin: toggle a pipeline stage completed / uncompleted */
  const handlePipelineTick = useCallback(async (stageIndex) => {
    const stage = pipeline[stageIndex];
    if (!stage) return;
    const newCompleted = !stage.completed;

    // Optimistic update
    const prev = [...pipeline];
    const updated = pipeline.map((s, i) =>
      i === stageIndex ? { ...s, completed: newCompleted, completedAt: newCompleted ? new Date().toISOString() : null } : s
    );
    setPipeline(updated);
    setPipelineLoading(stageIndex);

    try {
      const { data } = await API.updatePipeline(id, { stageIndex, completed: newCompleted });
      setPipeline(data.statusPipeline);
      setIdea(prev2 => ({ ...prev2, status: data.status, statusPipeline: data.statusPipeline }));
      toast.success(newCompleted ? `✅ ${stage.status} completed` : `↩ ${stage.status} unchecked`);
    } catch (err) {
      setPipeline(prev); // rollback
      toast.error(err.response?.data?.message || 'Failed to update pipeline');
    } finally {
      setPipelineLoading(null);
    }
  }, [id, pipeline]);

  /** Admin: save a deadline for a pipeline stage */
  const handleDeadlineSave = useCallback(async (stageIndex, deadline) => {
    setPipelineLoading(stageIndex);
    try {
      const { data } = await API.updatePipeline(id, { stageIndex, deadline: deadline || null });
      setPipeline(data.statusPipeline);
      setDeadlineEdit(null);
      toast.success('Deadline updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save deadline');
    } finally {
      setPipelineLoading(null);
    }
  }, [id]);



  const handleDelete = async () => {
    setDeleting(true);
    try {
      await API.deleteIdea(id);
      toast.success('Idea deleted successfully');
      navigate('/ideas');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete idea');
    } finally {
      setDeleting(false);
    }
  };


  const getProgress = () => {
    // If the pipeline determines a rejection, forcefully drop scaling to exactly 0 to represent termination
    if (idea?.status === 'Rejected' || pipeline.some(s => s.status === 'Rejected' && s.completed)) {
      return 0;
    }

    // Measure active completed phases excluding Rejected completely 
    const activeTimeline = pipeline.filter(s => s.status !== 'Rejected');
    if (activeTimeline.length > 0) {
      const completedCount = activeTimeline.filter(s => s.completed).length;
      return Math.round((completedCount / activeTimeline.length) * 100);
    }
    
    return 0;
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-primary-500 rounded-full animate-spin" />
          <p className="text-slate-500 font-medium">Loading idea...</p>
        </div>
      </div>
    );
  }

  if (!idea) return null;

  const isAdmin = user?.role === 'admin';
  const isOwner = false; // As per user request, only Admin can edit/delete/status update

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary-500/5 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-12 relative z-10">
          <button
            onClick={() => navigate('/ideas')}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-semibold text-sm">Back to Ideas</span>
          </button>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
              <div className="flex-1">
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3 tracking-tight">
                  {idea.title}
                </h1>
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge status={idea.status} size="lg" />
                  <span className="text-slate-600 text-sm flex items-center gap-1.5 font-medium">
                    {idea.category}
                  </span>

                  {idea.classification && (
                    <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border shadow-sm
                      ${idea.classification === 'AI' 
                        ? 'bg-violet-50 text-violet-700 border-violet-100 shadow-violet-100' 
                        : 'bg-emerald-50 text-emerald-700 border-emerald-100 shadow-emerald-100'}`}>
                      {idea.classification}
                    </span>
                  )}
                  <span
                    className={`inline-flex items-center text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider
                      ${
                        idea?.priority === 'High'
                          ? 'bg-red-50 text-red-600 border border-red-200'
                          : idea?.priority === 'Medium'
                          ? 'bg-amber-50 text-amber-600 border border-amber-200'
                          : 'bg-slate-50 text-slate-600 border border-slate-200'
                        }`}
                  >
                    {idea.priority} Priority
                  </span>
                  
                  <span className="text-slate-600 bg-white border border-slate-200 text-[10px] uppercase tracking-wider flex items-center gap-1.5 font-bold px-3 py-1 rounded-full">
                    <Wrench className="w-3 h-3 text-slate-400" />
                    {idea.technicalFeasibility || 'Moderate'}
                  </span>
                  
                  {idea.businessImpact && (
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border
                        ${idea.businessImpact === 'High' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' :
                          idea.businessImpact === 'Medium' ? 'bg-purple-50 text-purple-600 border-purple-200' :
                          'bg-slate-50 text-slate-600 border-slate-200'}
                      `}>
                      Business Impact: {idea.businessImpact}
                    </span>
                  )}

                  {/* Inline Dropdowns mapping exactly to user request */}


                  <span className="text-slate-500 text-sm flex items-center gap-1.5 font-medium ml-2">
                    <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                    {new Date(idea.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>

              {/* Action Buttons — admin only */}
              <div className="flex gap-2">
                {isAdmin && (
                  <>
                    <button
                      onClick={() => setShowEditForm(true)}
                      className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700
                                 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm font-semibold"
                    >
                      <Edit className="w-4 h-4" />
                      Edit Idea
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600
                                 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm font-semibold border border-red-100"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </>
                )}
              </div>

            </div>
          </motion.div>

          {/* Progress Bar */}
          <div className="mt-8 mb-4">
            <div className="flex justify-between text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">
              <span>Progress</span>
              <span className="text-primary-600">{Math.round(getProgress())}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${getProgress()}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className={`h-full rounded-full ${
                  idea.status === 'Rejected'
                    ? 'bg-red-500'
                    : 'bg-primary-500'
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 relative z-10">
        {/* ── Pipeline replaces the old status update panel ── */}


        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column — Main Info */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Problem Statement */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
            >
              <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Target className="w-5 h-5 text-primary-500" />
                Problem Statement
              </h2>
              <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                {idea.problemStatement || <span className="text-slate-400 italic">Not provided for this legacy idea.</span>}
              </p>
            </motion.div>

            {/* Business Impact Section */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
            >
              <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                Business Impact
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Impact Level</p>
                  <p className={`text-lg font-black ${
                    idea.businessImpact === 'High' ? 'text-indigo-600' :
                    idea.businessImpact === 'Medium' ? 'text-purple-600' : 'text-slate-600'
                  }`}>
                    {idea.businessImpact || 'Not Specified'}
                  </p>
                </div>
                {(idea.hoursSaved > 0 || idea.costSaved > 0) && (
                  <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Estimated Savings</p>
                    <p className="text-lg font-black text-emerald-700">
                      {idea.hoursSaved > 0 && `${idea.hoursSaved} Hrs`}
                      {idea.hoursSaved > 0 && idea.costSaved > 0 && '  •  '}
                      {idea.costSaved > 0 && `€${idea.costSaved}`}
                    </p>
                  </div>
                )}
              </div>
              {idea.outcomesAndBenefits && (
                <div className="mt-4 p-4 bg-primary-50 rounded-xl border border-primary-100">
                  <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{idea.outcomesAndBenefits}</p>
                </div>
              )}
            </motion.div>

            {/* Description / Proposed Solution */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
            >
              <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-500" />
                Proposed Solution
              </h2>
              <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                {idea.description}
              </p>
            </motion.div>

            {/* Attached Documents Section (Combined Images + Docs) */}
            {((Array.isArray(idea.images) && idea.images.length > 0) || (Array.isArray(idea.documents) && idea.documents.length > 0)) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
              >
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <FileIcon className="w-5 h-5 text-primary-500" />
                  Attached Documents
                  <span className="text-sm font-normal text-slate-400">
                    ({(idea.images?.length || 0) + (idea.documents?.length || 0)})
                  </span>
                </h2>
                
                {/* Images Grid */}
                {Array.isArray(idea.images) && idea.images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                    {idea.images.map((img, i) => (
                      <motion.div
                        key={`img-${i}`}
                        whileHover={{ scale: 1.02 }}
                        className="aspect-video rounded-xl overflow-hidden border border-gray-200
                                   cursor-pointer hover:shadow-md transition-shadow bg-gray-50 flex items-center justify-center"
                        onClick={() => setSelectedImage(img)}
                      >
                        <img
                          src={img}
                          alt={`Attachment ${i + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://placehold.co/800x400/f8fafc/64748b?text=Image+Unavailable';
                          }}
                        />
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Non-Image Documents List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Array.isArray(idea.documents) && idea.documents.map((file, i) => {
                    const fileName = file.split('/').pop();
                    const actualIsImg = isImage(file);
                    
                    // If it's an image, we already showed it in the grid above (if it was in images array)
                    // But if it's in the documents array, we show it here as a document or a mini-thumb
                    return (
                      <a
                        key={`doc-${i}`}
                        href={file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 bg-slate-50 hover:bg-primary-50 hover:border-primary-200 transition-all group"
                      >
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-100 text-primary-500 group-hover:scale-110 transition-transform overflow-hidden">
                          {actualIsImg ? (
                            <img src={file} className="w-full h-full object-cover" />
                          ) : (
                            <FileIcon className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-700 truncate">{fileName}</p>
                          <p className="text-[10px] font-bold text-primary-600 uppercase tracking-widest">View Document</p>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Solution Assets Section */}
            {Array.isArray(idea.artefacts) && idea.artefacts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
              >
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <FileIcon className="w-5 h-5 text-indigo-500" />
                  Solution Assets
                  <span className="text-sm font-normal text-slate-400">
                    ({idea.artefacts.length})
                  </span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {idea.artefacts.map((file, i) => {
                    const fileName = file.split('/').pop();
                    const actualIsImg = isImage(file);
                    return (
                      <a
                        key={`art-${i}`}
                        href={file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 transition-all group"
                      >
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-100 text-indigo-500 group-hover:scale-110 transition-transform overflow-hidden">
                          {actualIsImg ? (
                            <img src={file} className="w-full h-full object-cover" />
                          ) : (
                            <FileIcon className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-700 truncate">{fileName}</p>
                          <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Download Asset</p>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </motion.div>
            )}




            {/* Submitted By */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
            >
              <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                <User className="w-5 h-5 text-primary-500" />
                Submitted By
              </h2>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {(idea.submittedByEmail || '?').charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-slate-800">
                    {idea.submittedByEmail || 'Anonymous'}
                  </p>

                  {idea.expectedDeliveryDate && (
                    <span className="text-sm font-semibold text-primary-600 flex items-center gap-1.5 mt-1 bg-primary-50 px-2 py-0.5 rounded-lg border border-primary-100 w-fit">
                      <CalendarDays className="w-3.5 h-3.5" />
                      Delivery: {new Date(idea.expectedDeliveryDate).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric'
                      })}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Assigned Reviewer (if exists) */}
            {idea.assignedReviewer && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-6"
              >
                <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-primary-500" />
                  Assigned Reviewer
                </h2>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold">
                    {idea.assignedReviewer.charAt(0).toUpperCase()}
                  </div>
                  <p className="font-semibold text-slate-800">{idea.assignedReviewer}</p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Right Column — Pipeline + Illustration */}
          <div className="space-y-6 lg:sticky lg:top-28 lg:self-start">

            {/* ── Status Pipeline Card ─────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
            >
              <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-primary-500" />
                Project Pipeline
              </h2>

              {/* Pipeline stages */}
              <div className="space-y-0">
                {pipeline
                  .filter(stage => isAdmin || stage.status !== 'Rejected')
                  .map((stage, idx) => {
                  const StageIcon = STAGE_ICONS[stage.status] || CheckCircle2;
                  const isCompleted = stage.completed;
                  // Sequential active: NOT completed AND previous one IS completed AND stage is NOT Rejected
                  // ALSO: if "Implemented" is already completed, nothing else can be active
                  const implementedCompleted = pipeline.find(s => s.status === 'Implemented')?.completed;
                  const isActive = !isCompleted && 
                                   !implementedCompleted && 
                                   stage.status !== 'Rejected' && 
                                   pipeline.slice(0, idx).every(s => s.completed);
                  const isEditingDeadline = deadlineEdit?.index === idx;
                  const filteredPipeline = pipeline.filter(stage => isAdmin || stage.status !== 'Rejected');
                  const isLast = idx === filteredPipeline.length - 1;
                  const savingThis = pipelineLoading === idx;

                  return (
                    <div key={stage.status} className="relative">
                      {/* Vertical connector line */}
                      {!isLast && (
                        <div className={`absolute left-[19px] top-10 w-0.5 h-[calc(100%-8px)] ${
                          isCompleted ? 'bg-primary-300' : 'bg-gray-200'
                        }`} />
                      )}

                      <div className="flex gap-3 pb-4">
                        {/* Stage icon — clickable for admin */}
                        <button
                          onClick={() => isAdmin && handlePipelineTick(idx)}
                          disabled={!isAdmin || savingThis}
                          title={isAdmin ? (isCompleted ? 'Click to unmark' : 'Click to mark complete') : ''}
                          className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center
                            justify-center border-2 transition-all duration-200
                            ${ isCompleted
                                ? 'bg-primary-500 border-primary-500 text-white shadow-md shadow-primary-500/30'
                                : isActive
                                ? 'bg-amber-50 border-amber-400 text-amber-600 animate-pulse'
                                : 'bg-gray-50 border-gray-200 text-gray-400'
                            } ${ isAdmin ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-default'
                            }`}
                        >
                          {savingThis ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : isCompleted ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <StageIcon className="w-4 h-4" />
                          )}
                        </button>

                        {/* Stage content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`font-bold text-sm ${
                              isCompleted ? 'text-slate-800' : isActive ? 'text-amber-700' : 'text-slate-400'
                            }`}>
                              {stage.status}
                            </span>
                            {isActive && (
                              <span className="text-[10px] font-black uppercase tracking-wider
                                               bg-amber-50 text-amber-600 border border-amber-200
                                               px-1.5 py-0.5 rounded-full">
                                Active
                              </span>
                            )}
                          </div>

                          {/* Completion date */}
                          {isCompleted && stage.completedAt && (
                            <p className="text-[11px] text-slate-400 font-medium">
                              Done {new Date(stage.completedAt).toLocaleDateString('en-IN', {
                                day: 'numeric', month: 'short', year: 'numeric'
                              })}
                            </p>
                          )}

                          {/* Deadline — admin only */}
                          {isAdmin && (
                            <div className="mt-1">
                              {isEditingDeadline ? (
                                <div className="flex items-center gap-1.5 mt-1">
                                  <input
                                    type="date"
                                    value={deadlineEdit.value}
                                    onChange={e => setDeadlineEdit({ index: idx, value: e.target.value })}
                                    className="text-xs border border-gray-200 rounded-lg px-2 py-1
                                               focus:outline-none focus:border-primary-400 font-medium"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => handleDeadlineSave(idx, deadlineEdit.value)}
                                    disabled={savingThis}
                                    className="w-6 h-6 bg-primary-500 text-white rounded-lg flex items-center
                                               justify-center hover:bg-primary-600 transition-colors"
                                  >
                                    {savingThis ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                  </button>
                                  <button
                                    onClick={() => setDeadlineEdit(null)}
                                    className="w-6 h-6 bg-gray-100 text-gray-500 rounded-lg flex items-center
                                               justify-center hover:bg-gray-200 transition-colors"
                                  >
                                    <XIcon className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setDeadlineEdit({
                                    index: idx,
                                    value: stage.deadline
                                      ? stage.deadline.slice(0, 10)
                                      : ''
                                  })}
                                  className="flex items-center gap-1 text-[11px] mt-0.5
                                             text-slate-400 hover:text-primary-600 transition-colors group"
                                  title="Set deadline"
                                >
                                  <Pencil className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100" />
                                  {stage.deadline ? (
                                    <span className="font-semibold text-amber-700">
                                      Deadline: {new Date(stage.deadline).toLocaleDateString('en-IN', {
                                        day: 'numeric', month: 'short', year: 'numeric'
                                      })}
                                    </span>
                                  ) : (
                                    <span className="italic">Set deadline…</span>
                                  )}
                                </button>
                              )}
                            </div>
                          )}


                        </div>
                      </div>
                    </div>
                  );
                })}

                {pipeline.length === 0 && (
                  <p className="text-slate-400 text-sm font-medium italic py-4 text-center">
                    Pipeline loading…
                  </p>
                )}
              </div>
            </motion.div>

            {/* Side Illustration */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="relative rounded-2xl overflow-hidden aspect-[4/5] shadow-xl border-4 border-white"
            >
              <img
                src={(Array.isArray(idea.images) && idea.images.find(img => isImage(img))) || "/automation_illustration.png"}
                alt="Idea Visual"
                className="w-full h-full object-cover"
                onError={(e) => { e.target.onerror = null; e.target.src = "/automation_illustration.png"; }}
              />
              <div className="absolute inset-0 bg-transparent from-slate-900/60 via-transparent to-transparent flex flex-col justify-end p-6">
                <p className="text-white font-bold text-lg leading-tight">
                  {Array.isArray(idea.images) && idea.images.some(img => isImage(img))
                    ? ""
                    : "Driving efficiency through digital transformation."}
                </p>
              </div>
            </motion.div>
          </div>

        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              onClick={() => setShowDeleteConfirm(false)}
            />
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-red-100 p-3 rounded-xl">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Delete Idea?</h3>
                  <p className="text-sm text-slate-500">
                    This action cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 bg-red-500 text-white font-semibold px-6 py-3 rounded-xl
                             hover:bg-red-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cursor-pointer"
          >
            <motion.img
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              src={selectedImage}
              alt="Full view"
              className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <IdeaForm
        isOpen={showEditForm}
        onClose={() => setShowEditForm(false)}
        initialData={idea}
        onCreated={(updated) => {
          setIdea(updated);
          setShowEditForm(false);
        }}
      />
    </div>
  );
}
