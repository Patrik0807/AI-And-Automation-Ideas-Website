import axios from 'axios';

const MeetingNotesAPI = {
  getAll:  ()          => axios.get('/api/meeting-notes'),
  getOne:  (id)        => axios.get(`/api/meeting-notes/${id}`),
  create:  (data)      => axios.post('/api/meeting-notes', data),
  update:  (id, data)  => axios.put(`/api/meeting-notes/${id}`, data),
  remove:  (id)        => axios.delete(`/api/meeting-notes/${id}`),
};

export default MeetingNotesAPI;
