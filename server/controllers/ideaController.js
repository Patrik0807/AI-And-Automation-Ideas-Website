const db = require('../config/db');
const ideaMutex = require('../utils/mutex');
const { deleteFiles } = require('../utils/fileHelper');

// Ordered pipeline stages
const PIPELINE_STAGES = [
  'Submitted',
  'Approved',
  'In Progress',
  'In Validation',
  'Implemented',
  'Rejected'
];

/**
 * Build a default pipeline from current status.
 * All stages up to and including currentStatus are marked completed.
 */
function buildDefaultPipeline(currentStatus, submissionDate) {
  const idx = PIPELINE_STAGES.indexOf(currentStatus);
  return PIPELINE_STAGES.map((stage, i) => ({
    status: stage,
    completed: i <= idx,
    completedAt: i <= idx ? (i === 0 ? submissionDate : null) : null,
    deadline: null
  }));
}

/** Parse statusPipeline JSON safely, auto-generate if missing. 
 *  Includes automatic backwards-compatibility to inject Rejected if an old idea lacks it.
 */
function parsePipeline(pipelineJson, currentStatus, submissionDate) {
  let pipeline = null;
  if (pipelineJson) {
    try { pipeline = JSON.parse(pipelineJson); } catch { /* fall through */ }
  }
  if (!pipeline) {
    pipeline = buildDefaultPipeline(currentStatus || 'Submitted', submissionDate || new Date().toISOString());
  }

  // Graceful migration step: append 'Rejected' safely into an existing legacy payload
  if (!pipeline.find(s => s.status === 'Rejected')) {
    pipeline.push({
      status: 'Rejected',
      completed: currentStatus === 'Rejected',
      completedAt: currentStatus === 'Rejected' ? new Date().toISOString() : null,
      deadline: null
    });
  }

  // On-the-fly migration: Rename Validation-related statuses to In Validation
  pipeline = pipeline.map(s => {
    if (s.status === 'Testing/Validating' || s.status === 'Validation Phase' || s.status === 'Validation') {
      return { ...s, status: 'In Validation' };
    }
    return s;
  });

  return pipeline;
}


// GET /api/ideas
const getIdeas = (req, res) => {
  const { status, category, search, classification } = req.query;
  let query = 'SELECT * FROM ideas';
  let params = [];
  let conditions = [];

  if (status && status !== 'All') {
    conditions.push('status = ?');
    params.push(status);
  }
  if (category && category !== 'All') {
    conditions.push('category = ?');
    params.push(category);
  }
  if (classification && classification !== 'All') {
    conditions.push('LOWER(classification) = LOWER(?)');
    params.push(classification);
  }
  if (search) {
    conditions.push('(title LIKE ? OR description LIKE ? OR problemStatement LIKE ?)');
    params.push(`%${search}%`);
    params.push(`%${search}%`);
    params.push(`%${search}%`);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  query += ' ORDER BY datetime(createdAt) DESC';

  db.all(
    query,
    params,
    (err, rows) => {
      if (err) {
        return res.status(500).json({ message: err.message });
      }

  const normalized = rows.map((row) => ({
        ...row,
        _id: String(row.id),
        impact: row.impact ? JSON.parse(row.impact) : {},
        statusHistory: row.statusHistory ? JSON.parse(row.statusHistory) : [],
        statusPipeline: parsePipeline(row.statusPipeline, row.status, row.createdAt),
        images: row.images ? JSON.parse(row.images) : [],
        artefacts: row.artefacts ? JSON.parse(row.artefacts) : [],
        documents: row.documents ? JSON.parse(row.documents) : []
      }));


      res.json(normalized);
    }
  );
};

// @desc    Get single idea by ID
// GET /api/ideas/:id
const getIdea = (req, res) => {
  db.get(
    'SELECT * FROM ideas WHERE id = ?',
    [req.params.id],
    (err, row) => {
      if (err) {
        return res.status(500).json({ message: err.message });
      }

      if (!row) {
        return res.status(404).json({ message: 'Idea not found' });
      }

      res.json({
        ...row,
        _id: String(row.id),
        images: row.images ? JSON.parse(row.images) : [],
        artefacts: row.artefacts ? JSON.parse(row.artefacts) : [],
        documents: row.documents ? JSON.parse(row.documents) : [],
        impact: row.impact ? JSON.parse(row.impact) : {},
        statusHistory: row.statusHistory ? JSON.parse(row.statusHistory) : [],
        statusPipeline: parsePipeline(row.statusPipeline, row.status, row.createdAt),
      });

    }
  );
};

// @desc    Create new idea
// POST /api/ideas
const createIdea = (req, res) => {
  try {
    const {
      title,
      problemStatement,
      description,
      category,
      priority,
      technicalFeasibility,
      businessImpact,
      expectedDeliveryDate,
      assignedReviewer,
      outcomesAndBenefits,
      submittedByEmail,
      impact,
      hoursSaved,
      costSaved,
      classification,
      createdAt
    } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Parse impact JSON safely
    let parsedImpact = {};
    if (impact) {
      try {
        parsedImpact = JSON.parse(impact);
      } catch {
        parsedImpact = {};
      }
    }

    // Collect uploaded image paths (local storage)
    const imagePaths = req.files && req.files.images
      ? req.files.images.map((file) => `/uploads/ideas/${file.filename}`)
      : [];

    const artefactPaths = req.files && req.files.artefacts
      ? req.files.artefacts.map((file) => `/uploads/ideas/${file.filename}`)
      : [];
    
    const documentPaths = req.files && req.files.documents
      ? req.files.documents.map((file) => `/uploads/ideas/${file.filename}`)
      : [];

    // Determine submitter
    const submitterId = req.user ? req.user.id : null;

    const submissionDate = createdAt || new Date().toISOString();

    const initialHistory = [{
      status: 'Submitted',
      date: submissionDate,
      note: 'Idea submitted',
      updatedBy: submitterId
    }];

    // Initialize pipeline: Submitted completed, rest pending
    const initialPipeline = buildDefaultPipeline('Submitted', submissionDate);
    // Set completedAt for Submitted stage
    initialPipeline[0].completedAt = submissionDate;

    db.run(
      `
      INSERT INTO ideas (
        title,
        problemStatement,
        description,
        category,
        priority,
        technicalFeasibility,
        status,
        statusHistory,
        statusPipeline,
        impact,
        images,
        submittedByEmail,
        businessImpact,
        expectedDeliveryDate,
        assignedReviewer,
        outcomesAndBenefits,
        hoursSaved,
        costSaved,
        submittedBy,
        classification,
        artefacts,
        documents,
        createdAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        title,
        problemStatement,
        description,
        category,
        priority,
        technicalFeasibility,
        'Submitted',
        JSON.stringify(initialHistory),
        JSON.stringify(initialPipeline),
        JSON.stringify(parsedImpact),
        JSON.stringify(imagePaths),
        submittedByEmail,
        businessImpact || null,
        expectedDeliveryDate || null,
        assignedReviewer || null,
        outcomesAndBenefits || null,
        hoursSaved || 0,
        costSaved || 0,
        submitterId,
        classification || 'Automation',
        JSON.stringify(artefactPaths),
        JSON.stringify(documentPaths),
        submissionDate
      ],

      function (err) {
        if (err) {
          return res.status(500).json({ message: err.message });
        }

        res.status(201).json({
          id: this.lastID,
          _id: String(this.lastID),
          title,
          problemStatement,
          description,
          category,
          priority,
          technicalFeasibility,
          status: 'Submitted',
          statusHistory: initialHistory,
          statusPipeline: initialPipeline,
          impact: parsedImpact,
          images: imagePaths,
          submittedByEmail,
          businessImpact,
          expectedDeliveryDate,
          assignedReviewer,
          outcomesAndBenefits,
          hoursSaved: hoursSaved || 0,
          costSaved: costSaved || 0,
          submittedBy: submitterId,
          createdAt: submissionDate
        });

      }
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update idea details
// PUT /api/ideas/:id
const updateIdea = async (req, res) => {
  const { title, problemStatement, description, category, priority, technicalFeasibility, status, impact, deletedImages, businessImpact, expectedDeliveryDate, assignedReviewer, outcomesAndBenefits, hoursSaved, costSaved, createdAt } = req.body;

  // 1. Parse JSON fields
  let parsedImpact = {};
  if (impact) {
    try { parsedImpact = JSON.parse(impact); } catch { parsedImpact = {}; }
  }

  let parsedDeleted = [];
  if (deletedImages) {
    try { parsedDeleted = JSON.parse(deletedImages); } catch { parsedDeleted = []; }
  }

  try {
    await ideaMutex.runExclusive(req.params.id, async () => {
      return new Promise((resolve) => {
        // 2. Fetch existing idea to handle images
        db.get('SELECT * FROM ideas WHERE id = ?', [req.params.id], (err, row) => {
          if (err) { res.status(500).json({ message: err.message }); return resolve(); }
          if (!row) { res.status(404).json({ message: 'Idea not found' }); return resolve(); }

    let existingImages = [];
    if (row.images) {
      try { existingImages = JSON.parse(row.images); } catch { existingImages = []; }
    }

    // 3. Remove deleted images and purge them securely from physical disk
    let updatedImages = existingImages.filter(img => !parsedDeleted.includes(img));
    if (parsedDeleted.length > 0) {
      deleteFiles(parsedDeleted); // async background fire-and-forget
    }

    // 4. Append newly uploaded images
    const newImagePaths = req.files && req.files.images ? req.files.images.map((file) => `/uploads/ideas/${file.filename}`) : [];
    updatedImages = [...updatedImages, ...newImagePaths];

    // Handle Artefacts
    let existingArtefacts = [];
    if (row.artefacts) {
      try { existingArtefacts = JSON.parse(row.artefacts); } catch { existingArtefacts = []; }
    }
    const parsedDeletedArtefacts = req.body.deletedArtefacts ? JSON.parse(req.body.deletedArtefacts) : [];
    let updatedArtefacts = existingArtefacts.filter(art => !parsedDeletedArtefacts.includes(art));
    if (parsedDeletedArtefacts.length > 0) {
      deleteFiles(parsedDeletedArtefacts);
    }
    const newArtefactPaths = req.files && req.files.artefacts ? req.files.artefacts.map((file) => `/uploads/ideas/${file.filename}`) : [];
    updatedArtefacts = [...updatedArtefacts, ...newArtefactPaths];

    // Handle Documents
    let existingDocuments = [];
    if (row.documents) {
      try { existingDocuments = JSON.parse(row.documents); } catch { existingDocuments = []; }
    }
    const parsedDeletedDocuments = req.body.deletedDocuments ? JSON.parse(req.body.deletedDocuments) : [];
    let updatedDocuments = existingDocuments.filter(doc => !parsedDeletedDocuments.includes(doc));
    if (parsedDeletedDocuments.length > 0) {
      deleteFiles(parsedDeletedDocuments);
    }
    const newDocumentPaths = req.files && req.files.documents ? req.files.documents.map((file) => `/uploads/ideas/${file.filename}`) : [];
    updatedDocuments = [...updatedDocuments, ...newDocumentPaths];

    // Determine values to update (fallback to existing if not provided)
    const newTitle = title || row.title;
    const newClassification = req.body.classification || row.classification;
    const newProblemStatement = problemStatement || row.problemStatement;
    const newDescription = description || row.description;
    const newCategory = category || row.category;
    const newPriority = priority || row.priority;
    const newTechnicalFeasibility = technicalFeasibility || row.technicalFeasibility;
    const newBusinessImpact = businessImpact !== undefined ? businessImpact : row.businessImpact;
    const newExpectedDeliveryDate = expectedDeliveryDate !== undefined ? expectedDeliveryDate : row.expectedDeliveryDate;
    const newAssignedReviewer = assignedReviewer !== undefined ? assignedReviewer : row.assignedReviewer;
    const newOutcomesAndBenefits = outcomesAndBenefits !== undefined ? outcomesAndBenefits : row.outcomesAndBenefits;
    const newHoursSaved = hoursSaved !== undefined ? hoursSaved : row.hoursSaved;
    const newCostSaved = costSaved !== undefined ? costSaved : row.costSaved;
    const newStatus = status || row.status;
    const newImpact = impact ? JSON.stringify(parsedImpact) : row.impact;
    const newCreatedAt = createdAt || row.createdAt;

    // 5. Update DB
    db.run(
      `
      UPDATE ideas
      SET title = ?, problemStatement = ?, description = ?, category = ?, priority = ?, technicalFeasibility = ?, status = ?, impact = ?, images = ?, businessImpact = ?, expectedDeliveryDate = ?, assignedReviewer = ?, outcomesAndBenefits = ?, hoursSaved = ?, costSaved = ?, classification = ?, artefacts = ?, documents = ?, createdAt = ?
      WHERE id = ?
      `,
      [newTitle, newProblemStatement, newDescription, newCategory, newPriority, newTechnicalFeasibility, newStatus, newImpact, JSON.stringify(updatedImages), newBusinessImpact, newExpectedDeliveryDate, newAssignedReviewer, newOutcomesAndBenefits, newHoursSaved, newCostSaved, newClassification, JSON.stringify(updatedArtefacts), JSON.stringify(updatedDocuments), newCreatedAt, req.params.id],
      function (err) {
        if (err) return res.status(500).json({ message: err.message });

        res.json({
          ...row,
          _id: String(row.id),
          title: newTitle,
          problemStatement: newProblemStatement,
          description: newDescription,
          category: newCategory,
          priority: newPriority,
          technicalFeasibility: newTechnicalFeasibility,
          status: newStatus,
          impact: newImpact ? JSON.parse(newImpact) : {},
          images: updatedImages,
          businessImpact: newBusinessImpact,
          expectedDeliveryDate: newExpectedDeliveryDate,
          assignedReviewer: newAssignedReviewer,
          outcomesAndBenefits: newOutcomesAndBenefits,
          hoursSaved: newHoursSaved,
          costSaved: newCostSaved,
          createdAt: newCreatedAt,
          classification: newClassification,
          artefacts: updatedArtefacts,
          documents: updatedDocuments,
          statusHistory: row.statusHistory ? JSON.parse(row.statusHistory) : []
        });
        resolve();
      }
    );
        });
      });
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update idea status (admin only)
// PATCH /api/ideas/:id/status
const updateStatus = async (req, res) => {
  const { status, note, date } = req.body;

  const validStatuses = [
    'Submitted',
    'Approved',
    'In Progress',
    'In Validation',
    'Implemented',
    'Rejected'
  ];


  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  // Secure database mutation via sequential in-memory Mutex Locking
  try {
    await ideaMutex.runExclusive(req.params.id, async () => {
      return new Promise((resolve) => {
        // Step 1: Fetch existing statusHistory safely within lock boundary
        db.get(
          'SELECT * FROM ideas WHERE id = ?',
          [req.params.id],
          (err, row) => {
            if (err) { res.status(500).json({ message: err.message }); return resolve(); }
            if (!row) { res.status(404).json({ message: 'Idea not found' }); return resolve(); }

      // Step 2: Parse existing history or start empty
      let history = [];
      if (row.statusHistory) {
        try {
          history = JSON.parse(row.statusHistory);
        } catch {
          history = [];
        }
      }

      // Step 3: Append new entry
      history.push({
        status,
        date: date || new Date().toISOString(),
        note: note || `Status updated to ${status}`,
        updatedBy: req.user.id
      });

          // Also update pipeline: mark matching stage as completed and update main status
          let pipeline = parsePipeline(row.statusPipeline, row.status, row.createdAt);
          const pipelineIdx = pipeline.findIndex(s => s.status === status);
          if (pipelineIdx !== -1) {
            pipeline[pipelineIdx].completed = true;
            pipeline[pipelineIdx].completedAt = date || new Date().toISOString();
          }

          // Step 4: Save back to SQLite
          db.run(
            `UPDATE ideas SET status = ?, statusHistory = ?, statusPipeline = ? WHERE id = ?`,
            [status, JSON.stringify(history), JSON.stringify(pipeline), req.params.id],
            function (err) {
              if (err) {
                return res.status(500).json({ message: err.message });
              }

                res.json({
                  ...row,
                  _id: String(row.id),
                  status,
                  statusHistory: history,
                  statusPipeline: pipeline,
                  images: row.images ? JSON.parse(row.images) : [],
                  impact: row.impact ? JSON.parse(row.impact) : {}
                });
                resolve();
              }
            );
      });
    });
  });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete an idea and completely clean up physical ghosts
// DELETE /api/ideas/:id
const deleteIdea = async (req, res) => {
  try {
    await ideaMutex.runExclusive(req.params.id, async () => {
      return new Promise((resolve) => {
        db.get('SELECT images, artefacts FROM ideas WHERE id = ?', [req.params.id], (err, row) => {
          if (err) { res.status(500).json({ message: err.message }); return resolve(); }
          if (!row) { res.status(404).json({ message: 'Idea not found' }); return resolve(); }

          let images = [];
          try { images = JSON.parse(row.images || '[]'); } catch (e) {}
          let artefacts = [];
          try { artefacts = JSON.parse(row.artefacts || '[]'); } catch (e) {}
          
          const allFiles = [...images, ...artefacts];

          db.run('DELETE FROM ideas WHERE id = ?', [req.params.id], function (err) {
            if (err) { res.status(500).json({ message: err.message }); return resolve(); }
            if (this.changes === 0) { res.status(404).json({ message: 'Idea not found' }); return resolve(); }
            
            // Clean physical directory payload asynchronously
            if (allFiles.length > 0) {
              deleteFiles(allFiles);
            }
            
            res.json({ message: 'Idea deleted successfully' });
            resolve();
          });
        });
      });
    });
  } catch (error) {
     res.status(500).json({ message: error.message });
  }
};

// @desc    Get summary stats
// GET /api/ideas/stats/summary
const getStats = (req, res) => {
  const { category, search, classification } = req.query;
  let params = [];
  let conditions = [];

  if (category && category !== 'All') {
    conditions.push('category = ?');
    params.push(category);
  }
  if (classification && classification !== 'All') {
    conditions.push('LOWER(classification) = LOWER(?)');
    params.push(classification);
  }
  if (search) {
    conditions.push('(title LIKE ? OR description LIKE ? OR problemStatement LIKE ?)');
    params.push(`%${search}%`);
    params.push(`%${search}%`);
    params.push(`%${search}%`);
  }

  const whereClause = conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : '';

  const queryTotal = `SELECT COUNT(*) as total FROM ideas${whereClause}`;
  const queryByStatus = `SELECT status as _id, COUNT(*) as count FROM ideas${whereClause} GROUP BY status`;
  const queryByCategory = `SELECT category as _id, COUNT(*) as count FROM ideas${whereClause} GROUP BY category`;
  const queryImpact = `SELECT SUM(hoursSaved) as totalHours, SUM(costSaved) as totalCost FROM ideas${whereClause}`;

  db.get(queryTotal, params, (err, totalRow) => {
    if (err) {
      return res.status(500).json({ message: err.message });
    }

    db.all(queryByStatus, params, (err, byStatus) => {
      if (err) {
        return res.status(500).json({ message: err.message });
      }

      db.all(queryByCategory, params, (err, byCategory) => {
        if (err) {
          return res.status(500).json({ message: err.message });
        }

        db.get(queryImpact, params, (err, impactRow) => {
          if (err) {
            return res.status(500).json({ message: err.message });
          }

          res.json({
            total: totalRow?.total || 0,
            byStatus,
            byCategory,
            impact: {
              totalHours: impactRow?.totalHours || 0,
              totalCost: impactRow?.totalCost || 0
            }
          });
        });
      });
    });
  });
};

// @desc    Update pipeline stage (tick/untick + deadline)
// PATCH /api/ideas/:id/pipeline  (admin only)
const updatePipeline = async (req, res) => {
  const { stageIndex, completed, deadline } = req.body;

  if (stageIndex === undefined || stageIndex < 0 || stageIndex >= PIPELINE_STAGES.length) {
    return res.status(400).json({ message: 'Invalid stageIndex' });
  }

  try {
    await ideaMutex.runExclusive(req.params.id, async () => {
      return new Promise((resolve) => {
        db.get('SELECT * FROM ideas WHERE id = ?', [req.params.id], (err, row) => {
          if (err) { res.status(500).json({ message: err.message }); return resolve(); }
          if (!row) { res.status(404).json({ message: 'Idea not found' }); return resolve(); }

    const pipeline = parsePipeline(row.statusPipeline, row.status, row.createdAt);

    // Toggle completed
    if (completed !== undefined) {
      pipeline[stageIndex].completed = Boolean(completed);
      pipeline[stageIndex].completedAt = completed ? new Date().toISOString() : null;
    }

    // Update deadline (admin-only field, ISO string or null)
    if (deadline !== undefined) {
      pipeline[stageIndex].deadline = deadline || null;
    }

    // Derive overall idea status from last completed pipeline stage
    let newMainStatus = row.status;
    const lastCompletedIdx = pipeline.reduce((acc, s, i) => s.completed ? i : acc, -1);
    if (lastCompletedIdx >= 0) {
      newMainStatus = pipeline[lastCompletedIdx].status;
    }

    db.run(
      `UPDATE ideas SET status = ?, statusPipeline = ? WHERE id = ?`,
      [newMainStatus, JSON.stringify(pipeline), req.params.id],
      function (err) {
        if (err) return res.status(500).json({ message: err.message });
        res.json({
          ...row,
          _id: String(row.id),
          status: newMainStatus,
          statusPipeline: pipeline,
          statusHistory: row.statusHistory ? JSON.parse(row.statusHistory) : [],
          images: row.images ? JSON.parse(row.images) : [],
          impact: row.impact ? JSON.parse(row.impact) : {}
        });
        resolve();
      }
    );
        });
      });
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getIdeas,
  getIdea,
  createIdea,
  updateIdea,
  updateStatus,
  updatePipeline,
  deleteIdea,
  getStats
};

