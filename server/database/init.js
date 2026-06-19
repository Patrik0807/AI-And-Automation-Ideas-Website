const db = require('../config/db');

/**
 * DATABASE INITIALIZATION
 * This script ensures all tables and columns exist for the SQLite migration.
 * Since SQLite ALTER TABLE is limited, we use a try-catch/if-error pattern
 * to add columns for existing databases.
 */

// 1. Create Base Tables
db.serialize(() => {
  // Ideas Table
  db.run(`
    CREATE TABLE IF NOT EXISTS ideas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      problemStatement TEXT,
      description TEXT,
      category TEXT,
      priority TEXT,
      technicalFeasibility TEXT,
      businessImpact TEXT,
      status TEXT DEFAULT 'Submitted',
      statusHistory TEXT,
      impact TEXT,
      images TEXT,
      submittedByEmail TEXT,
      submittedBy INTEGER,
      expectedDeliveryDate TEXT,
      assignedReviewer TEXT,
      outcomesAndBenefits TEXT,
      hoursSaved REAL,
      costSaved REAL,
      createdAt TEXT
    )
  `, (err) => {
    if (err) console.error('❌ Failed to create ideas table:', err.message);
    else console.log('✅ Ideas table ready');
  });

  // Users Table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      department TEXT,
      createdAt TEXT
    )
  `, (err) => {
    if (err) console.error('❌ Failed to create users table:', err.message);
    else {
      console.log('✅ Users table ready');
      // Seed admin user
      const bcrypt = require('bcryptjs');
      db.get('SELECT id FROM users WHERE email = ?', ['admin@test.com'], async (err, user) => {
        if (user) {
          const hash = await bcrypt.hash('admin_core_ai#2026', 10);
          db.run(
            'UPDATE users SET email = ?, password = ?, name = ? WHERE id = ?',
            ['ai@coreadmin', hash, 'Admin', user.id],
            (err) => {
              if (err) console.log('❌ Failed to migrate legacy admin user', err);
              else console.log('✅ Migrated legacy admin@test.com to ai@coreadmin');
            }
          );
        } else {
          const bcrypt2 = require('bcryptjs');
          bcrypt2.hash('admin_core_ai#2026', 10).then((hash) => {
            db.run(
              'INSERT OR IGNORE INTO users (name, email, password, role, createdAt) VALUES (?, ?, ?, ?, ?)',
              ['Admin', 'ai@coreadmin', hash, 'admin', new Date().toISOString()],
              (err) => { if (!err) console.log('✅ Admin user created (ai@coreadmin)'); }
            );
            // Always ensure the password is correct
            db.run(
              'UPDATE users SET password = ? WHERE email = ?',
              [hash, 'ai@coreadmin'],
              (err) => { if (!err) console.log('✅ Admin password reset to admin_core_ai#2026'); }
            );
          });
        }
      });
    }
  });

  // 2. Structural Integrity (Lazy Migrations)
  // These ensure that if a user has an older version of the DB, the new columns are added.
  const newColumns = [
    ['problemStatement', 'TEXT'],
    ['priority', 'TEXT'],
    ['technicalFeasibility', 'TEXT'],
    ['impact', 'TEXT'],
    ['images', 'TEXT'],
    ['submittedByEmail', 'TEXT'],
    ['submittedBy', 'INTEGER'],
    ['statusHistory', 'TEXT'],
    ['businessImpact', 'TEXT'],
    ['expectedDeliveryDate', 'TEXT'],
    ['assignedReviewer', 'TEXT'],
    ['outcomesAndBenefits', 'TEXT'],
    ['hoursSaved', 'REAL'],
    ['costSaved', 'REAL'],
    ['statusPipeline', 'TEXT'],
    ['classification', 'TEXT'],
    ['artefacts', 'TEXT'],
    ['documents', 'TEXT']
  ];

  newColumns.forEach(([col, type]) => {
    db.run(`ALTER TABLE ideas ADD COLUMN ${col} ${type}`, (err) => {
      // "Duplicate column name" error is ignored
      if (!err) console.log(`✅ Added column: ${col}`);
    });
  });

  // Action Points Table (single-row admin notepad — kept for backwards compat)
  db.run(`
    CREATE TABLE IF NOT EXISTS action_points (
      id INTEGER PRIMARY KEY DEFAULT 1 CHECK(id = 1),
      content TEXT DEFAULT '',
      updatedAt TEXT
    )
  `, (err) => {
    if (err) console.error('❌ Failed to create action_points table:', err.message);
    else console.log('✅ Action Points table ready');
  });

  // Meeting Notes Table (multi-session OneNote-style notepad)
  db.run(`
    CREATE TABLE IF NOT EXISTS meeting_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL DEFAULT 'Meeting Notes',
      content TEXT DEFAULT '',
      createdAt TEXT,
      updatedAt TEXT
    )
  `, (err) => {
    if (err) console.error('❌ Failed to create meeting_notes table:', err.message);
    else console.log('✅ Meeting Notes table ready');
  });

  // Team Members Table (org chart)
  db.run(`
    CREATE TABLE IF NOT EXISTS team_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      type TEXT DEFAULT 'member',
      description TEXT DEFAULT '',
      imageUrl TEXT DEFAULT '',
      sortOrder INTEGER DEFAULT 0,
      createdAt TEXT
    )
  `, (err) => {
    if (err) console.error('❌ Failed to create team_members table:', err.message);
    else {
      console.log('✅ Team Members table ready');
      // Role Migration: Legacy to New Convention (Director)
      db.run("UPDATE team_members SET type = 'Director' WHERE type IN ('director', 'executive_director', 'Executive Director')");
      db.run("UPDATE team_members SET type = 'Group Leader' WHERE type IN ('team_leader', 'group_leader', 'Group Leader')");

      // Idea Status Migration
      db.run("UPDATE ideas SET status = 'In Validation' WHERE status IN ('Testing/Validating', 'Validation Phase', 'Validation')");
    }
  });
});