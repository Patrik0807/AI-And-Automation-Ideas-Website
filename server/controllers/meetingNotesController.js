const db = require('../config/db');

// GET /api/meeting-notes  — list all notes (id, title, updatedAt, createdAt only — no full content)
const getAll = (req, res) => {
  db.all(
    'SELECT id, title, createdAt, updatedAt FROM meeting_notes ORDER BY updatedAt DESC',
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json(rows);
    }
  );
};

// GET /api/meeting-notes/:id  — get single note with full content
const getOne = (req, res) => {
  db.get('SELECT * FROM meeting_notes WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ message: err.message });
    if (!row) return res.status(404).json({ message: 'Note not found' });
    res.json(row);
  });
};

// POST /api/meeting-notes  — create new note
const create = (req, res) => {
  const title = (req.body.title || 'Meeting Notes').trim() || 'Meeting Notes';
  const content = typeof req.body.content === 'string' ? req.body.content : '';
  const now = new Date().toISOString();

  db.run(
    'INSERT INTO meeting_notes (title, content, createdAt, updatedAt) VALUES (?, ?, ?, ?)',
    [title, content, now, now],
    function (err) {
      if (err) return res.status(500).json({ message: err.message });
      res.status(201).json({ id: this.lastID, title, content, createdAt: now, updatedAt: now });
    }
  );
};

// PUT /api/meeting-notes/:id  — update title and/or content
const update = (req, res) => {
  const { title, content } = req.body;
  const updatedAt = new Date().toISOString();

  // Fetch existing row first so we can keep unchanged fields
  db.get('SELECT * FROM meeting_notes WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ message: err.message });
    if (!row) return res.status(404).json({ message: 'Note not found' });

    const newTitle = title !== undefined ? (title.trim() || 'Meeting Notes') : row.title;
    const newContent = content !== undefined ? content : row.content;

    db.run(
      'UPDATE meeting_notes SET title = ?, content = ?, updatedAt = ? WHERE id = ?',
      [newTitle, newContent, updatedAt, req.params.id],
      function (err) {
        if (err) return res.status(500).json({ message: err.message });
        res.json({ id: row.id, title: newTitle, content: newContent, createdAt: row.createdAt, updatedAt });
      }
    );
  });
};

// DELETE /api/meeting-notes/:id
const remove = (req, res) => {
  db.run('DELETE FROM meeting_notes WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ message: err.message });
    if (this.changes === 0) return res.status(404).json({ message: 'Note not found' });
    res.json({ message: 'Deleted' });
  });
};

module.exports = { getAll, getOne, create, update, remove };
