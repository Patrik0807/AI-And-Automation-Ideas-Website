import axios from 'axios';

const API = {
  // Ideas
  getIdeas: (params = {}) => axios.get('/api/ideas', { params }),
  getIdea: (id) => axios.get(`/api/ideas/${id}`),
  createIdea: (formData) =>
    axios.post('/api/ideas', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  updateIdea: (id, data) => {
    // If data is already FormData (full edit), send as-is
    // If data is a plain object (inline field update), wrap in FormData
    if (data instanceof FormData) {
      return axios.put(`/api/ideas/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => { if (v !== undefined && v !== null) fd.append(k, v); });
    return axios.put(`/api/ideas/${id}`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  updateStatus: (id, data) => axios.patch(`/api/ideas/${id}/status`, data),
  updatePipeline: (id, data) => axios.patch(`/api/ideas/${id}/pipeline`, data),
  deleteIdea: (id) => axios.delete(`/api/ideas/${id}`),
  getStats: (params = {}) => axios.get('/api/ideas/stats/summary', { params })
};


export default API;
