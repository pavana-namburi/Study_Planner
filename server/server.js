require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');
const { initializeDatabase } = require('./database');
const authRoutes = require('./routes/authRoutes');
const authMiddleware = require('./middleware/authMiddleware');
const apiResponse = require('./middleware/apiResponse');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const groq = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

console.log('Groq API Key:', process.env.GROQ_API_KEY ? 'Loaded' : 'NOT SET - Please add GROQ_API_KEY to .env file');

const app = express();
const PORT = process.env.PORT || 5000;

// Function to find an available port
function findAvailablePort(startPort) {
  return new Promise((resolve, reject) => {
    const net = require('net');
    let port = startPort;

    function tryPort() {
      const server = net.createServer();

      server.listen(port, () => {
        server.close(() => {
          resolve(port);
        });
      });

      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`Port ${port} in use, trying ${port + 1}...`);
          port++;
          tryPort();
        } else {
          reject(err);
        }
      });
    }

    tryPort();
  });
}

// Helper function to format time in HH:MM
function formatTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// Helper function to format time remaining
function formatTimeRemaining(totalMinutes) {
  const hours = Math.floor(Math.abs(totalMinutes) / 60);
  const minutes = Math.abs(totalMinutes) % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

app.use(
  cors({
    origin: /^http:\/\/localhost:\d+$/,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);
app.use(express.json());
app.use(apiResponse);
app.use('/api/auth', authRoutes);

app.get('/api/test', (req, res) => {
  res.success({ message: 'Server working' });
});

function queryDatabase(connection, sql, params = []) {
  return new Promise((resolve, reject) => {
    connection.query(sql, params, (err, results) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(results);
    });
  });
}

const CHAT_SYSTEM_PROMPT = `
You are an AI study assistant inside an AI Study Planner app.

Response rules:
- Use short bullets, numbered steps, or compact sections.
- Avoid long paragraphs; keep each point easy to scan.
- Give practical, actionable study advice.
- Explain concepts simply when the user asks for help understanding something.
- Use clean markdown that can be rendered as plain text in the UI.
- Stay concise, supportive, and focused on studying, planning, revision, motivation, and time management.
`.trim();

function formatDateForContext(value) {
  if (!value) return 'No deadline';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toISOString().slice(0, 10);
}

function formatDynamicContext(subjects) {
  if (!subjects || subjects.length === 0) {
    return 'No saved subjects or deadlines are available for this user yet.';
  }

  const subjectLines = subjects.map((subject) => {
    const details = [
      `difficulty: ${subject.difficulty || 'unknown'}`,
      `priority: ${subject.priority || 'unknown'}`,
      `deadline: ${formatDateForContext(subject.deadline)}`,
    ];

    if (subject.max_time !== null && subject.max_time !== undefined) {
      details.push(`planned hours: ${subject.max_time}`);
    }

    return `- ${subject.name}: ${details.join(', ')}`;
  });

  return [
    'Use this saved study context only when it helps answer the user:',
    ...subjectLines,
  ].join('\n');
}

async function getChatContext(connection, userId) {
  const subjects = await queryDatabase(
    connection,
    `
      SELECT name, difficulty, priority, deadline, max_time
      FROM subjects
      WHERE user_id = ?
      ORDER BY deadline ASC
      LIMIT 8
    `,
    [userId],
  );

  return formatDynamicContext(subjects);
}

function buildChatMessages(userMessage, dynamicContext) {
  return [
    {
      role: 'system',
      content: CHAT_SYSTEM_PROMPT,
    },
    {
      role: 'system',
      content: dynamicContext,
    },
    {
      role: 'user',
      content: userMessage,
    },
  ];
}

function cleanChatReply(reply) {
  return reply
    .trim()
    .replace(/\n{3,}/g, '\n\n');
}

app.post('/api/subjects', authMiddleware, (req, res) => {
  const {
    name,
    difficulty,
    max_time,
    deadline,
    priority,
    type,
    confidence,
  } = req.body;

  const maxTimeValue = max_time !== undefined ? max_time : req.body.maxTime;
  const numericMaxTime = Number(maxTimeValue);
  const numericConfidence = Number(confidence);
  const deadlineDate = new Date(deadline);
  const now = new Date();
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysRemaining = Math.max(1, Math.ceil((deadlineDate.getTime() - now.getTime()) / msPerDay));

  const difficultyWeights = {
    Easy: 1,
    Medium: 2,
    Hard: 3,
  };

  const missingFields = [];
  if (!name || typeof name !== 'string' || name.trim() === '') missingFields.push('name');
  if (!difficulty || typeof difficulty !== 'string' || difficulty.trim() === '') missingFields.push('difficulty');
  if (maxTimeValue === undefined || Number.isNaN(numericMaxTime)) missingFields.push('max_time');
  if (!deadline || typeof deadline !== 'string' || Number.isNaN(deadlineDate.getTime())) missingFields.push('deadline');
  if (!priority || typeof priority !== 'string' || priority.trim() === '') missingFields.push('priority');
  if (!type || typeof type !== 'string' || type.trim() === '') missingFields.push('type');
  if (confidence === undefined || Number.isNaN(numericConfidence)) missingFields.push('confidence');

  if (missingFields.length > 0) {
    return res.fail(400, `Missing or invalid required fields: ${missingFields.join(', ')}`);
  }

  if (numericMaxTime < 0) {
    return res.fail(400, 'max_time must be a non-negative number');
  }

  if (numericConfidence < 0 || numericConfidence > 5) {
    return res.fail(400, 'confidence must be a number between 0 and 5');
  }

  const difficultyWeight = difficultyWeights[difficulty.trim()] ?? difficultyWeights.Medium;
  const urgencyScore = 10 / daysRemaining;
  const priorityScore = parseFloat((urgencyScore + difficultyWeight + (5 - numericConfidence)).toFixed(2));

  const connection = req.app.locals.dbConnection;

  if (!connection) {
    return res.fail(500, 'Database not connected');
  }

  connection.query(
    'INSERT INTO subjects (name, difficulty, max_time, priority, `type`, confidence, deadline, priority_score, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [name.trim(), difficulty.trim(), numericMaxTime, priority.trim(), type.trim(), numericConfidence, deadline, priorityScore, req.user.id],
    (err, result) => {
      if (err) {
        console.error('Error inserting subject:', err);

        if (err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET') {
          return res.fail(500, 'Database connection lost. Please try again later.');
        }

        return res.fail(500, 'Failed to add subject to database');
      }

      res.success({ id: result.insertId }, 201);
    }
  );
});

app.get('/api/subjects', authMiddleware, (req, res) => {
  const connection = req.app.locals.dbConnection;

  if (!connection) {
    return res.fail(500, 'Database not connected');
  }

  connection.query('SELECT * FROM subjects WHERE user_id = ? ORDER BY deadline ASC', [req.user.id], (err, results) => {
    if (err) {
      console.error('Error fetching subjects:', err);

      if (err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET') {
        return res.fail(500, 'Database connection lost. Please try again later.');
      }

      return res.fail(500, 'Failed to retrieve subjects from database');
    }

    res.success(results);
  });
});

app.get('/api/current-task', authMiddleware, (req, res) => {
  const connection = req.app.locals.dbConnection;

  if (!connection) {
    return res.fail(500, 'Database not connected');
  }

  const sql = `
    SELECT
      subjects.name AS subject,
      subjects.priority,
      subjects.difficulty,
      subjects.deadline,
      tasks.task_date,
      tasks.start_time,
      tasks.end_time,
      tasks.status
    FROM tasks
    JOIN subjects ON tasks.subject_id = subjects.id
    WHERE tasks.status <> 'completed'
      AND tasks.user_id = ?
      AND subjects.user_id = ?
    ORDER BY
      CASE subjects.priority
        WHEN 'High' THEN 1
        WHEN 'Medium' THEN 2
        WHEN 'Low' THEN 3
        ELSE 4
      END,
      tasks.task_date ASC,
      tasks.start_time ASC
    LIMIT 1
  `;

  connection.query(sql, [req.user.id, req.user.id], (err, results) => {
    if (err) {
      console.error('Error fetching current task:', err);

      if (err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET') {
        return res.fail(500, 'Database connection lost. Please try again later.');
      }

      return res.fail(500, 'Failed to retrieve current task from database');
    }

    if (!results || results.length === 0) {
      return res.success({ task: null });
    }

    res.success({ task: results[0] });
  });
});

app.get('/api/tasks', authMiddleware, (req, res) => {
  const connection = req.app.locals.dbConnection;

  if (!connection) {
    return res.fail(500, 'Database not connected');
  }

  const sql = `
    SELECT
      tasks.id,
      tasks.task_date,
      tasks.start_time,
      tasks.end_time,
      tasks.status,
      subjects.id AS subject_id,
      subjects.name AS subject,
      subjects.priority,
      subjects.difficulty,
      subjects.type
    FROM tasks
    JOIN subjects ON tasks.subject_id = subjects.id
    WHERE tasks.user_id = ?
      AND subjects.user_id = ?
    ORDER BY tasks.task_date ASC, tasks.start_time ASC
  `;

  connection.query(sql, [req.user.id, req.user.id], (err, results) => {
    if (err) {
      console.error('Error fetching tasks:', err);

      if (err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET') {
        return res.fail(500, 'Database connection lost. Please try again later.');
      }

      return res.fail(500, 'Failed to retrieve tasks from database');
    }

    res.success(results);
  });
});

app.patch('/api/tasks/:id/status', authMiddleware, (req, res) => {
  const connection = req.app.locals.dbConnection;

  if (!connection) {
    return res.fail(500, 'Database not connected');
  }

  const taskId = Number(req.params.id);
  const { status } = req.body;
  const allowedStatuses = ['pending', 'completed', 'skipped', 'missed'];

  if (!Number.isInteger(taskId) || taskId <= 0) {
    return res.fail(400, 'Invalid task id');
  }

  if (!status || typeof status !== 'string' || !allowedStatuses.includes(status)) {
    return res.fail(400, 'Invalid task status');
  }

  connection.query(
    'UPDATE tasks SET status = ? WHERE id = ? AND user_id = ?',
    [status, taskId, req.user.id],
    (err, result) => {
      if (err) {
        console.error('Error updating task status:', err);

        if (err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET') {
          return res.fail(500, 'Database connection lost. Please try again later.');
        }

        return res.fail(500, 'Failed to update task status');
      }

      if (result.affectedRows === 0) {
        return res.fail(404, 'Task not found');
      }

      res.success({ id: taskId, status });
    }
  );
});

app.delete('/api/tasks/:id', authMiddleware, (req, res) => {
  const connection = req.app.locals.dbConnection;

  if (!connection) {
    return res.fail(500, 'Database not connected');
  }

  const taskId = Number(req.params.id);

  if (!Number.isInteger(taskId) || taskId <= 0) {
    return res.fail(400, 'Invalid task id');
  }

  connection.query(
    'DELETE FROM tasks WHERE id = ? AND user_id = ?',
    [taskId, req.user.id],
    (err, result) => {
      if (err) {
        console.error('Error deleting task:', err);

        if (err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET') {
          return res.fail(500, 'Database connection lost. Please try again later.');
        }

        return res.fail(500, 'Failed to delete task');
      }

      if (result.affectedRows === 0) {
        return res.fail(404, 'Task not found');
      }

      res.success({ id: taskId });
    }
  );
});

app.get('/study-plan', authMiddleware, (req, res) => {
  const connection = req.app.locals.dbConnection;

  if (!connection) {
    return res.fail(500, 'Database not connected');
  }

  // First, get subjects data
  connection.query('SELECT id, name, priority_score, max_time, priority, deadline FROM subjects WHERE user_id = ?', [req.user.id], (err, subjectsResults) => {
    if (err) {
      console.error('Error fetching subjects for study plan:', err);

      if (err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET') {
        return res.fail(500, 'Database connection lost. Please try again later.');
      }

      return res.fail(500, 'Failed to retrieve subjects from database');
    }

    // Handle empty subjects
    if (!subjectsResults || subjectsResults.length === 0) {
      return res.success([]);
    }

    const now = new Date();
    const subjects = subjectsResults
      .filter(row => row.max_time !== null && row.max_time > 0)
      .map(row => {
        let adjustedPriorityScore = row.priority_score;
        let rescheduled = false;

        // Check if deadline is missed and boost priority
        if (row.deadline) {
          const deadlineDate = new Date(row.deadline);
          const timeDiffMs = deadlineDate.getTime() - now.getTime();

          if (timeDiffMs <= 0) {
            // Deadline missed - boost priority score by +5
            adjustedPriorityScore = row.priority_score + 5;
            rescheduled = true;
          }
        }

        return {
          ...row,
          priority_score: adjustedPriorityScore,
          score: adjustedPriorityScore + row.max_time,
          remainingTime: row.max_time * 60, // Convert to minutes
          isMissed: row.deadline ? (new Date(row.deadline).getTime() - now.getTime() <= 0) : false,
          rescheduled: rescheduled
        };
      });

    // If no valid subjects after filtering
    if (subjects.length === 0) {
      return res.success([]);
    }

    // Sort subjects by priority_score DESC (highest first)
    subjects.sort((a, b) => b.priority_score - a.priority_score);

    // Constants for schedule
    const TOTAL_MINUTES = 6 * 60; // 6 hours = 360 minutes
    const MAX_SESSION_MINUTES = 2 * 60; // Max 2 hours per session for all subjects
    const BREAK_DURATION = 15; // 15-minute break
    const START_HOUR = 9; // 9:00 AM

    let currentTimeInMinutes = START_HOUR * 60; // Start at 9:00 AM in minutes
    const plan = [];

    for (let i = 0; i < subjects.length; i++) {
      const subject = subjects[i];

      // Skip if subject has no remaining time
      if (subject.remainingTime <= 0) continue;

      const totalElapsedMinutes = currentTimeInMinutes - START_HOUR * 60;
      const remainingTotalMinutes = TOTAL_MINUTES - totalElapsedMinutes;

      // Stop if no time remaining in total schedule
      if (remainingTotalMinutes <= 0) break;

      // Process this subject in sessions
      while (subject.remainingTime > 0 && remainingTotalMinutes > 0) {
        // Calculate how much time we can allocate for this session
        const availableTime = Math.min(remainingTotalMinutes, MAX_SESSION_MINUTES);
        const sessionDuration = Math.min(subject.remainingTime, availableTime);

        // Only add session if we have meaningful time (> 15 minutes)
        if (sessionDuration < 15) break;

        const startTime = formatTime(currentTimeInMinutes);
        currentTimeInMinutes += sessionDuration;
        const endTime = formatTime(currentTimeInMinutes);

        plan.push({
          subject: subject.name,
          start: startTime,
          end: endTime,
          priority: subject.priority,
          duration: (sessionDuration / 60).toFixed(2), // Store duration in hours
          sessionType: 'study',
          rescheduled: subject.rescheduled
        });

        // Reduce remaining time for this subject
        subject.remainingTime -= sessionDuration;

        // Check if we should add a break and continue with this subject
        const newTotalElapsed = currentTimeInMinutes - START_HOUR * 60;
        const newRemainingTotal = TOTAL_MINUTES - newTotalElapsed;

        if (subject.remainingTime > 0 && newRemainingTotal > BREAK_DURATION + 15) {
          // Add break before next session of same subject
          const breakStartTime = formatTime(currentTimeInMinutes);
          currentTimeInMinutes += BREAK_DURATION;
          const breakEndTime = formatTime(currentTimeInMinutes);

          plan.push({
            subject: 'Break',
            start: breakStartTime,
            end: breakEndTime,
            priority: 'Rest',
            duration: (BREAK_DURATION / 60).toFixed(2),
            sessionType: 'break'
          });
        } else if (i < subjects.length - 1 || subject.remainingTime <= 0) {
          // Add break before next subject (or if we're done with this subject)
          if (newRemainingTotal > BREAK_DURATION) {
            const breakStartTime = formatTime(currentTimeInMinutes);
            currentTimeInMinutes += BREAK_DURATION;
            const breakEndTime = formatTime(currentTimeInMinutes);

            plan.push({
              subject: 'Break',
              start: breakStartTime,
              end: breakEndTime,
              priority: 'Rest',
              duration: (BREAK_DURATION / 60).toFixed(2),
              sessionType: 'break'
            });
          }
        }

        // Break if we've used up the total time
        if (newTotalElapsed >= TOTAL_MINUTES) break;
      }

      // If we've processed all subjects or run out of time, stop
      if (currentTimeInMinutes - START_HOUR * 60 >= TOTAL_MINUTES) break;
    }

    res.success(plan);
  });
});

app.get('/deadlines', authMiddleware, (req, res) => {
  const connection = req.app.locals.dbConnection;

  if (!connection) {
    return res.fail(500, 'Database not connected');
  }

  connection.query('SELECT id, name, deadline FROM subjects WHERE user_id = ?', [req.user.id], (err, results) => {
    if (err) {
      console.error('Error fetching subjects for deadlines:', err);

      if (err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET') {
        return res.fail(500, 'Database connection lost. Please try again later.');
      }

      return res.fail(500, 'Failed to retrieve subjects from database');
    }

    // Handle empty subjects
    if (!results || results.length === 0) {
      return res.success([]);
    }

    const now = new Date();
    const deadlines = [];

    for (const subject of results) {
      // Skip subjects with null deadlines
      if (!subject.deadline) {
        continue;
      }

      const deadlineDate = new Date(subject.deadline);
      const timeDiffMs = deadlineDate.getTime() - now.getTime();

      let status;
      let timeRemaining;
      let rescheduled = false;

      if (timeDiffMs > 0) {
        // Deadline is in the future
        status = 'pending';
        // Calculate remaining time in hours and minutes
        const totalMinutes = Math.floor(timeDiffMs / (1000 * 60));
        timeRemaining = formatTimeRemaining(totalMinutes);
      } else {
        // Deadline has passed
        status = 'missed';
        // Show "Deadline passed" instead of negative time
        timeRemaining = 'Deadline passed';
        // Check if this missed subject is rescheduled in study plan
        rescheduled = true;
      }

      deadlines.push({
        subject: subject.name,
        deadline: subject.deadline,
        timeRemaining: timeRemaining,
        status: status,
        rescheduled: rescheduled
      });
    }

    // Sort by deadline (closest first)
    deadlines.sort((a, b) => {
      const dateA = new Date(a.deadline);
      const dateB = new Date(b.deadline);
      return dateA.getTime() - dateB.getTime();
    });

    res.success(deadlines);
  });
});

app.get('/performance', authMiddleware, (req, res) => {
  console.log('Performance API called');

  const connection = req.app.locals.dbConnection;

  if (!connection) {
    return res.fail(500, 'Database not connected');
  }

  connection.query('SELECT * FROM tasks WHERE user_id = ?', [req.user.id], (err, results) => {
    if (err) {
      console.error('Error fetching tasks for performance:', err);

      if (err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET') {
        return res.fail(500, 'Database connection lost. Please try again later.');
      }

      return res.fail(500, 'Failed to retrieve tasks from database');
    }

    // Handle empty tasks
    if (!results || results.length === 0) {
      return res.success({
        totalTasks: 0,
        completedTasks: 0,
        missedTasks: 0,
        completionRate: 0,
        efficiency: 0,
        insight: 'No tasks yet. Start by adding some study tasks!'
      });
    }

    const totalTasks = results.length;
    const completedTasks = results.filter(task => task.status === 'completed').length;
    const missedTasks = results.filter(task => task.status === 'missed').length;

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const efficiency = completionRate;

    // Generate intelligent insights
    let insight = '';
    if (totalTasks === 0) {
      insight = 'No tasks yet. Start by adding some study tasks!';
    } else if (missedTasks > completedTasks) {
      insight = 'You are missing too many tasks. Try shorter sessions.';
    } else if (completionRate > 80) {
      insight = 'Excellent consistency! Keep it up.';
    } else if (completionRate >= 50) {
      insight = 'Good progress, but can improve.';
    } else {
      insight = 'Low productivity. Focus on completing tasks.';
    }

    res.success({
      totalTasks: totalTasks,
      completedTasks: completedTasks,
      missedTasks: missedTasks,
      completionRate: completionRate,
      efficiency: efficiency,
      insight: insight
    });
  });
});

app.post('/chat', authMiddleware, async (req, res) => {
  const { message } = req.body;
  const trimmedMessage = typeof message === 'string' ? message.trim() : '';

  if (!trimmedMessage) {
    return res.fail(400, 'Message is required and must be a non-empty string');
  }

  if (!groq) {
    console.error('Chat service unavailable: GROQ_API_KEY is not configured');
    return res.fail(500, 'Chat service unavailable');
  }

  const connection = req.app.locals.dbConnection;

  if (!connection) {
    return res.fail(500, 'Database not connected');
  }

  try {
    const dynamicContext = await getChatContext(connection, req.user.id);

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: buildChatMessages(trimmedMessage, dynamicContext),
      temperature: 0.7,
      max_tokens: 700,
    });

    const rawReply = completion.choices?.[0]?.message?.content;
    const reply = rawReply ? cleanChatReply(rawReply) : '';

    if (!reply) {
      console.error('Chat service returned an empty response');
      return res.fail(500, 'Chat service unavailable');
    }

    await queryDatabase(
      connection,
      'INSERT INTO chats (message, response, user_id) VALUES (?, ?, ?)',
      [trimmedMessage, reply, req.user.id],
    );

    res.success({ reply });
  } catch (error) {
    console.error('Groq chat error:', error.message);
    res.fail(500, 'Chat service unavailable');
  }
});

app.use(notFound);
app.use(errorHandler);

function startServer() {
  initializeDatabase((err, connection) => {
    if (err) {
      console.error('Database connection failed:', err.message);
      console.log('Starting server without database...');
      app.locals.dbConnection = null;
    } else {
      console.log('Database connection established');
      app.locals.dbConnection = connection;
    }

    // Start listening
    app.listen(PORT, () => {
      console.log('Server started on port', PORT);
    });
  });
}

startServer();
