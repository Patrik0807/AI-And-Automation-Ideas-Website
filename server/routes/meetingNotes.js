const express = require('express');
const router = express.Router();
const { getAll, getOne, create, update, remove } = require('../controllers/meetingNotesController');
const { protect, adminOnly } = require('../middleware/auth');

// All routes: must be logged in AND admin
router.get('/', protect, adminOnly, getAll);
router.get('/:id', protect, adminOnly, getOne);
router.post('/', protect, adminOnly, create);
router.put('/:id', protect, adminOnly, update);
router.delete('/:id', protect, adminOnly, remove);

module.exports = router;
