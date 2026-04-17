require('dotenv').config();
const mysql = require('mysql2');

const DB_NAME = process.env.DB_NAME;


function logSql(query, params) {
  if (params && params.length) {
    console.log('Executing SQL:', query, 'params:', JSON.stringify(params));
  } else {
    console.log('Executing SQL:', query);
  }
}


function createTables(connection, callback) {
  console.log('Ensuring table subjects exists');
  const createSubjectsSql = `CREATE TABLE IF NOT EXISTS subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    difficulty VARCHAR(20) NOT NULL,
    max_time INT NOT NULL,
    priority VARCHAR(20) NOT NULL,
    \`type\` VARCHAR(20) NOT NULL,
    confidence INT NOT NULL,
    deadline DATETIME NOT NULL,
    priority_score DECIMAL(6,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB`;
  logSql(createSubjectsSql);
  connection.query(createSubjectsSql, (err) => {
    if (err) return callback(err);
    console.log('Table subjects ensured');

    console.log('Checking subjects table columns...');
    const requiredColumns = {
      name: 'VARCHAR(255) NOT NULL',
      difficulty: 'VARCHAR(20) NOT NULL',
      max_time: 'INT NOT NULL',
      deadline: 'DATETIME NOT NULL',
      priority: 'VARCHAR(20) NOT NULL',
      type: 'VARCHAR(20) NOT NULL',
      confidence: 'INT NOT NULL',
      priority_score: 'DECIMAL(6,2) NOT NULL DEFAULT 0',
    };

    const checkColumnsSql = 'SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?';
    logSql(checkColumnsSql, [DB_NAME, 'subjects']);
    connection.query(checkColumnsSql, [DB_NAME, 'subjects'], (err, results) => {
      if (err) return callback(err);

      const existingColumns = new Set((results || []).map((row) => row.COLUMN_NAME));
      const missingColumns = Object.keys(requiredColumns).filter((column) => !existingColumns.has(column));

      if (missingColumns.length === 0) {
        console.log('All subjects columns exist');
        createTasks();
        return;
      }

      addMissingColumns(missingColumns, requiredColumns, connection, callback);
    });
  });

  function addMissingColumns(missingColumns, columnDefinitions, connection, callback) {
    const next = missingColumns.shift();
    if (!next) {
      createTasks();
      return;
    }

    const columnName = next === 'type' ? '`type`' : next;
    const alterSql = `ALTER TABLE subjects ADD COLUMN ${columnName} ${columnDefinitions[next]}`;
    console.log(`Adding missing column: ${next}`);
    logSql(alterSql);
    connection.query(alterSql, (err) => {
      if (err) return callback(err);
      console.log(`Column added successfully: ${next}`);
      addMissingColumns(missingColumns, columnDefinitions, connection, callback);
    });
  }

  function createTasks() {
    console.log('Ensuring table tasks exists');
    const createTasksSql = `CREATE TABLE IF NOT EXISTS tasks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      subject_id INT,
      task_date DATE,
      start_time TIME,
      end_time TIME,
      status VARCHAR(20) DEFAULT 'pending'
    ) ENGINE=InnoDB`;
    logSql(createTasksSql);
    connection.query(createTasksSql, (err) => {
      if (err) return callback(err);
      console.log('Table tasks ensured');
      createPerformance();
    });
  }

  function createPerformance() {
    console.log('Ensuring table performance exists');
    const createPerformanceSql = `CREATE TABLE IF NOT EXISTS performance (
      id INT AUTO_INCREMENT PRIMARY KEY,
      date DATE,
      total_tasks INT,
      completed_tasks INT,
      efficiency DECIMAL(5,2)
    ) ENGINE=InnoDB`;
    logSql(createPerformanceSql);
    connection.query(createPerformanceSql, (err) => {
      if (err) return callback(err);
      console.log('Table performance ensured');
      createChats();
    });
  }

  function createChats() {
    console.log('Ensuring table chats exists');
    const createChatsSql = `CREATE TABLE IF NOT EXISTS chats (
      id INT AUTO_INCREMENT PRIMARY KEY,
      message TEXT,
      response TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB`;
    logSql(createChatsSql);
    connection.query(createChatsSql, (err) => {
      if (err) return callback(err);
      console.log('Table chats ensured');
      callback(null);
    });
  }
}

function initializeDatabase(callback) {
  const configWithoutDB = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    multipleStatements: true,
  };

  const connection = mysql.createConnection(configWithoutDB);

  connection.connect((err) => {
    if (err) {
      console.error('Connection error FULL:', err);
      return callback(err);
    }
    console.log('Connected to MySQL');

    logSql('CREATE DATABASE IF NOT EXISTS study_planner');
    connection.query('CREATE DATABASE IF NOT EXISTS study_planner', (err) => {
      if (err) {
        console.error('Database creation error:', err.message);
        connection.end();
        return callback(err);
      }
      console.log('Database ensured');

      connection.end(() => {
        console.log('Initial connection closed');

        const configWithDB = {
          ...configWithoutDB,
          database: process.env.DB_NAME,
        };
        const connection2 = mysql.createConnection(configWithDB);

        connection2.connect((err) => {
          if (err) {
            console.error('Database connection error:', err.message);
            return callback(err);
          }
          console.log('Connected to study_planner database');

          createTables(connection2, (err) => {
            if (err) {
              console.error('Table creation error:', err.message);
              connection2.end();
              return callback(err);
            }
            callback(null, connection2);
          });
        });
      });
    });
  });
}

module.exports = { initializeDatabase };