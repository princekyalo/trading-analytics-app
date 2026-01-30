/**
 * renderer.js
 * Renderer module with first-run detection and SQLite persistence
 */

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

/* --------------------------------------------------
   Paths
-------------------------------------------------- */

const DB_PATH = path.join(__dirname, 'app_data.db');

/* --------------------------------------------------
   SQLite Data Handler
-------------------------------------------------- */

class DataHandler {
  constructor() {
    this.db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Database connection failed:', err);
      }
    });

    this.initialize();
  }

  initialize() {
    const query = `
      CREATE TABLE IF NOT EXISTS user_profile (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `;

    this.db.run(query);
  }

  isFirstRun(callback) {
    const query = `SELECT COUNT(*) AS count FROM user_profile`;
    this.db.get(query, (err, row) => {
      if (err) {
        console.error(err);
        callback(true);
      } else {
        callback(row.count === 0);
      }
    });
  }

  saveUser(data, callback) {
    const query = `
      INSERT INTO user_profile (name, email, created_at)
      VALUES (?, ?, ?)
    `;

    this.db.run(
      query,
      [data.name, data.email, new Date().toISOString()],
      callback
    );
  }
}

/* --------------------------------------------------
   Navigation
-------------------------------------------------- */

const Navigation = {
  load(page) {
    window.location.href = path.join(__dirname, page);
  }
};

/* --------------------------------------------------
   App Bootstrap
-------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
  const dataHandler = new DataHandler();

  const currentPage = path.basename(window.location.pathname);

  /* -------- First Run Logic -------- */

  dataHandler.isFirstRun((isFirstRun) => {
    if (isFirstRun && currentPage !== 'sign_up.html') {
      Navigation.load('sign_up.html');
    }

    if (!isFirstRun && currentPage === 'sign_up.html') {
      Navigation.load('index.html');
    }
  });

  /* -------- Signup Form Handling -------- */

  const signupForm = document.getElementById('signupForm');

  if (signupForm) {
    signupForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const formData = new FormData(signupForm);
      const userData = {
        name: formData.get('name'),
        email: formData.get('email')
      };

      dataHandler.saveUser(userData, (err) => {
        if (err) {
          console.error('Failed to save user:', err);
          return;
        }

        Navigation.load('index.html');
      });
    });
  }

  /* -------- Generic Page Navigation -------- */

  document.querySelectorAll('[data-target]').forEach((btn) => {
    btn.addEventListener('click', () => {
      Navigation.load(btn.dataset.target);
    });
  });
});

/* --------------------------------------------------
   Optional Global Exposure
-------------------------------------------------- */

window.AppNavigation = Navigation;
window.DataHandler = DataHandler;