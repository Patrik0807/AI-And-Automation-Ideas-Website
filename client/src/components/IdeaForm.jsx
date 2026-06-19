import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lightbulb, Send, ImagePlus, Trash2, File as FileIcon, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import API from '../api/ideas';

const categories = ['Project engineering', 'Sales engineering', 'ASRS', 'Integration', 'IT Delivery', 'Installation', 'Test and Deployment', 'Other'];

// Helper to determine if a URL/file is an image
export const isImage = (fileName) => {
  if (!fileName) return false;
  return /\.(jpg|jpeg|png|webp|avif|gif|svg)$/.test(fileName.toLowerCase());
};

export default function IdeaForm({ isOpen, onClose, onCreated, initialData }) {
  const [form, setForm] = useState({
    title: '',
    problemStatement: '',
    description: '',
    category: '',
    priority: 'Medium',
    technicalFeasibility: 'Moderate',
    businessImpact: 'Medium',
    expectedDeliveryDate: '',
    assignedReviewer: '',
    outcomesAndBenefits: '',
    hoursSaved: '',
    costSaved: '',
    submittedByEmail: '',
    classification: 'AI',
    createdAt: new Date().toISOString().split('T')[0]
  });

  const { user } = useAuth();

  // Images
  const [images, setImages] = useState([]);
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [deletedImages, setDeletedImages] = useState([]);

  // Solution Assets (Technical)
  const [artefacts, setArtefacts] = useState([]);
  const [newArtefactFiles, setNewArtefactFiles] = useState([]);
  const [deletedArtefacts, setDeletedArtefacts] = useState([]);

  // Documents (PDF/DOC)
  const [documents, setDocuments] = useState([]);
  const [newDocumentFiles, setNewDocumentFiles] = useState([]);
  const [deletedDocuments, setDeletedDocuments] = useState([]);

  const [loading, setLoading] = useState(false);
  const imageInputRef = useRef(null);
  const artefactInputRef = useRef(null);
  const documentInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setForm({
          title: initialData.title || '',
          problemStatement: initialData.problemStatement || '',
          description: initialData.description || '',
          category: initialData.category || '',
          priority: initialData.priority || 'Medium',
          technicalFeasibility: initialData.technicalFeasibility || 'Moderate',
          businessImpact: initialData.businessImpact || 'Medium',
          expectedDeliveryDate: initialData.expectedDeliveryDate || '',
          assignedReviewer: initialData.assignedReviewer || '',
          outcomesAndBenefits: initialData.outcomesAndBenefits || '',
          hoursSaved: initialData.hoursSaved || '',
          costSaved: initialData.costSaved || '',
          submittedByEmail: initialData.submittedByEmail || '',
          classification: initialData.classification || 'Automation',
          createdAt: initialData.createdAt ? initialData.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]
        });

        setImages(initialData.images || []);
        setArtefacts(initialData.artefacts || []);
        setDocuments(initialData.documents || []);
        setNewImageFiles([]);
        setNewArtefactFiles([]);
        setNewDocumentFiles([]);
        setDeletedImages([]);
        setDeletedArtefacts([]);
        setDeletedDocuments([]);
      } else {
        setForm({
          title: '',
          problemStatement: '',
          description: '',
          category: '',
          priority: 'Medium',
          technicalFeasibility: 'Moderate',
          businessImpact: 'Medium',
          expectedDeliveryDate: '',
          assignedReviewer: '',
          outcomesAndBenefits: '',
          hoursSaved: '',
          costSaved: '',
          submittedByEmail: user?.email || '',
          classification: 'AI',
          createdAt: new Date().toISOString().split('T')[0]
        });
        setImages([]);
        setArtefacts([]);
        setDocuments([]);
        setNewImageFiles([]);
        setNewArtefactFiles([]);
        setNewDocumentFiles([]);
        setDeletedImages([]);
        setDeletedArtefacts([]);
        setDeletedDocuments([]);
      }
    }
  }, [initialData, isOpen, user]);

  const handleDocumentSelect = (e) => {
    const files = Array.from(e.target.files);
    setNewDocumentFiles(prev => [...prev, ...files]);
    // Previews: use ObjectURL for images, name for others
    const previews = files.map(f => f.type.startsWith('image/') ? URL.createObjectURL(f) : f.name);
    setDocuments(prev => [...prev, ...previews]);
  };

  const handleArtefactSelect = (e) => {
    const files = Array.from(e.target.files);
    setNewArtefactFiles(prev => [...prev, ...files]);
    const previews = files.map(f => f.type.startsWith('image/') ? URL.createObjectURL(f) : f.name);
    setArtefacts(prev => [...prev, ...previews]);
  };

  const removeImage = (index) => {
    const removed = images[index];
    if (initialData?.images?.includes(removed)) {
      setDeletedImages(prev => [...prev, removed]);
    } else {
      setNewImageFiles(prev => prev.filter((_, i) => i !== (index - (initialData?.images?.length || 0))));
    }
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeArtefact = (index) => {
    const removed = artefacts[index];
    if (initialData?.artefacts?.includes(removed)) {
      setDeletedArtefacts(prev => [...prev, removed]);
    } else {
      setNewArtefactFiles(prev => prev.filter((_, i) => i !== (index - (initialData?.artefacts?.length || 0))));
    }
    setArtefacts(prev => prev.filter((_, i) => i !== index));
  };

  const removeDocument = (index) => {
    const removed = documents[index];
    if (initialData?.documents?.includes(removed)) {
      setDeletedDocuments(prev => [...prev, removed]);
    } else {
      setNewDocumentFiles(prev => prev.filter((_, i) => i !== (index - (initialData?.documents?.length || 0))));
    }
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.category || (!user && !form.submittedByEmail)) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      Object.keys(form).forEach(key => formData.append(key, form[key]));

      // Append files
      newImageFiles.forEach(file => formData.append('images', file));
      newArtefactFiles.forEach(file => formData.append('artefacts', file));
      newDocumentFiles.forEach(file => formData.append('documents', file));

      // Deleted tracks
      formData.append('deletedImages', JSON.stringify(deletedImages));
      formData.append('deletedArtefacts', JSON.stringify(deletedArtefacts));
      formData.append('deletedDocuments', JSON.stringify(deletedDocuments));

      let responseData;
      if (initialData) {
        const res = await API.updateIdea(initialData._id, formData);
        responseData = res.data;
        toast.success('🎉 Idea updated successfully!');
      } else {
        const res = await API.createIdea(formData);
        responseData = res.data;
        const displayId = responseData.customId || `WS-${String(responseData._id || responseData.id).toUpperCase().slice(-6)}`;
        toast.success(`🎉 Idea submitted successfully with ID: ${displayId}`, { duration: 6000 });
      }

      onCreated(responseData);
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit idea');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-primary-500 to-primary-600 p-6 rounded-t-3xl z-10">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white/80 hover:text-white
                           bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Lightbulb className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {initialData ? 'Edit Idea' : 'Submit New Idea'}
                  </h2>
                  <p className="text-primary-100 text-sm">
                    {initialData ? 'Update details and project artefacts' : 'Capture your innovation details'}
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Category */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Function <span className="text-red-500">*</span></label>
                  <select name="category" value={form.category} onChange={handleChange} className="select-field" required>
                    <option value="">Select a category</option>
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                {/* Classification */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Classification <span className="text-red-500">*</span></label>
                  <div className="flex gap-2">
                    {['AI', 'Automation'].map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setForm({ ...form, classification: type })}
                        className={`flex-1 py-2 rounded-xl border-2 font-bold transition-all ${form.classification === type ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-100 bg-gray-50 text-slate-500'}`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Idea Title <span className="text-red-500">*</span></label>
                <input name="title" value={form.title} onChange={handleChange} placeholder="e.g. ASRS Optimization" className="input-field" required />
              </div>

              {/* Submitter & Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Your Email <span className="text-red-500">*</span></label>
                  <input type="email" name="submittedByEmail" value={form.submittedByEmail} onChange={handleChange} className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Submitted On</label>
                  <input type="date" name="createdAt" value={form.createdAt} onChange={handleChange} className="input-field" required />
                </div>
              </div>

              {/* Problem & Solution */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Problem Statement <span className="text-red-500">*</span></label>
                  <textarea name="problemStatement" value={form.problemStatement} onChange={handleChange} className="input-field min-h-[80px]" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Proposed Solution <span className="text-red-500">*</span></label>
                  <textarea name="description" value={form.description} onChange={handleChange} className="input-field min-h-[120px]" required />
                </div>
              </div>

              {/* Impact Metrics */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-gray-100 space-y-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Impact & Benefits</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Hours Saved</label>
                    <input type="number" name="hoursSaved" value={form.hoursSaved} onChange={handleChange} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Cost Saved (€)</label>
                    <input type="number" name="costSaved" value={form.costSaved} onChange={handleChange} className="input-field" />
                  </div>
                </div>
                <textarea name="outcomesAndBenefits" value={form.outcomesAndBenefits} onChange={handleChange} placeholder="Detailed outcomes..." className="input-field" />
              </div>

              {/* Attached Documents (Formerly Images + Docs) */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Attached Documents <span className="text-xs text-slate-400 font-normal">(Images, PDFs, Docs)</span></label>
                <input ref={documentInputRef} type="file" multiple onChange={handleDocumentSelect} className="hidden" />
                <div onClick={() => documentInputRef.current?.click()} className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center cursor-pointer hover:border-primary-400 transition-colors bg-gray-50 group">
                  <Upload className="w-8 h-8 text-gray-400 group-hover:text-primary-500 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">Upload Images & Documentation</p>
                </div>
                {/* Legacy Images (if any) */}
                {images.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-3 mb-3">
                    {images.map((src, i) => (
                      <div key={i} className="relative aspect-video rounded-xl overflow-hidden border bg-white group/img">
                        {isImage(src) ? (
                          <img src={src} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-400">
                            <FileIcon className="w-6 h-6" />
                          </div>
                        )}
                        <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-lg opacity-0 group-hover/img:opacity-100 transition-opacity shadow-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    ))}
                  </div>
                )}
                {/* New Documents Section */}
                {documents.length > 0 && (
                  <div className="space-y-2 mt-3">
                    {documents.map((val, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-slate-50 border rounded-xl group/item">
                        <div className="flex items-center gap-3 overflow-hidden">
                          {isImage(val) ? (
                            <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 shrink-0">
                              <img src={val} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <FileIcon className="w-5 h-5 text-primary-500 shrink-0" />
                          )}
                          <span className="text-xs font-bold text-slate-700 truncate">{val.split('/').pop()}</span>
                        </div>
                        <button type="button" onClick={() => removeDocument(i)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg opacity-0 group-hover/item:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Solution Assets (Technical) */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Solution Assets <span className="text-xs text-slate-400 font-normal">(ZIP, EXE, PY, etc.)</span></label>
                <input ref={artefactInputRef} type="file" multiple onChange={handleArtefactSelect} className="hidden" />
                <div onClick={() => artefactInputRef.current?.click()} className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center cursor-pointer hover:border-indigo-400 transition-colors bg-gray-50 group">
                  <Upload className="w-8 h-8 text-gray-400 group-hover:text-indigo-500 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">Upload Technical Assets</p>
                </div>
                {artefacts.length > 0 && (
                  <div className="space-y-2 mt-3">
                    {artefacts.map((val, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-slate-50 border rounded-xl group/item">
                        <div className="flex items-center gap-3 overflow-hidden">
                          {isImage(val) ? (
                            <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 shrink-0">
                              <img src={val} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <FileIcon className="w-5 h-5 text-indigo-500 shrink-0" />
                          )}
                          <span className="text-xs font-bold text-slate-700 truncate">{val.split('/').pop()}</span>
                        </div>
                        <button type="button" onClick={() => removeArtefact(i)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg opacity-0 group-hover/item:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Send className="w-4 h-4" /> {initialData ? 'Save Changes' : 'Submit Idea'}</>}
                </button>
              </div>

            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}