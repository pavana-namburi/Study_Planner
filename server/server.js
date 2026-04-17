require('dotenv').config();
const express = require('express');
const cors = require('cors');
// node-fetch v3 is ESM-only — imported dynamically inside async route handlers
const { initializeDatabase } = require('./database');

// Verify Gemini API Key is loaded
console.log('Gemini API Key:', process.env.GEMINI_API_KEY ? '✓ Loaded' : '✗ NOT SET - Please add GEMINI_API_KEY to .env file');

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
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);
app.use(express.json());

app.get('/api/test', (req, res) => {
  res.json({ message: 'Server working' });
});

app.post('/api/subjects', (req, res) => {
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
    return res.status(400).json({
      error: 'Missing or invalid required fields',
      fields: missingFields,
    });
  }

  if (numericMaxTime < 0) {
    return res.status(400).json({ error: 'max_time must be a non-negative number' });
  }

  if (numericConfidence < 0 || numericConfidence > 5) {
    return res.status(400).json({ error: 'confidence must be a number between 0 and 5' });
  }

  const difficultyWeight = difficultyWeights[difficulty.trim()] ?? difficultyWeights.Medium;
  const urgencyScore = 10 / daysRemaining;
  const priorityScore = parseFloat((urgencyScore + difficultyWeight + (5 - numericConfidence)).toFixed(2));

  const connection = req.app.locals.dbConnection;

  if (!connection) {

    return res.status(500).json({ error: 'Database not connected' });

  }

  connection.query(
    'INSERT INTO subjects (name, difficulty, max_time, priority, `type`, confidence, deadline, priority_score) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [name.trim(), difficulty.trim(), numericMaxTime, priority.trim(), type.trim(), numericConfidence, deadline, priorityScore],
    (err, result) => {
      if (err) {
        console.error('Error inserting subject:', err);

        if (err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET') {
          return res.status(500).json({ error: 'Database connection lost. Please try again later.' });
        }

        return res.status(500).json({ error: 'Failed to add subject to database' });
      }

      res.status(201).json({ success: true, id: result.insertId });
    }
  );
});

app.get('/api/subjects', (req, res) => {
  const connection = req.app.locals.dbConnection;

  if (!connection) {

    return res.status(500).json({ error: 'Database not connected' });

  }

  connection.query('SELECT * FROM subjects ORDER BY deadline ASC', (err, results) => {
    if (err) {
      console.error('Error fetching subjects:', err);

      if (err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET') {
        return res.status(500).json({ error: 'Database connection lost. Please try again later.' });
      }

      return res.status(500).json({ error: 'Failed to retrieve subjects from database' });
    }

    res.json(results);
  });
});

app.get('/study-plan', (req, res) => {
  const connection = req.app.locals.dbConnection;

  // First, get subjects data
  connection.query('SELECT id, name, priority_score, max_time, priority, deadline FROM subjects', (err, subjectsResults) => {
    if (err) {
      console.error('Error fetching subjects for study plan:', err);

      if (err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET') {
        return res.status(500).json({ error: 'Database connection lost. Please try again later.' });
      }

      return res.status(500).json({ error: 'Failed to retrieve subjects from database' });
    }

    // Handle empty subjects
    if (!subjectsResults || subjectsResults.length === 0) {
      return res.json([]);
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
      return res.json([]);
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

    res.json(plan);
  });
});

app.get('/deadlines', (req, res) => {
  const connection = req.app.locals.dbConnection;

  if (!connection) {

    return res.status(500).json({ error: 'Database not connected' });

  }

  connection.query('SELECT id, name, deadline FROM subjects', (err, results) => {
    if (err) {
      console.error('Error fetching subjects for deadlines:', err);

      if (err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET') {
        return res.status(500).json({ error: 'Database connection lost. Please try again later.' });
      }

      return res.status(500).json({ error: 'Failed to retrieve subjects from database' });
    }

    // Handle empty subjects
    if (!results || results.length === 0) {
      return res.json([]);
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

    res.json(deadlines);
  });
});

app.get('/performance', (req, res) => {
  console.log('Performance API called');

  const connection = req.app.locals.dbConnection;

  if (!connection) {

    return res.status(500).json({ error: 'Database not connected' });

  }

  connection.query('SELECT * FROM tasks', (err, results) => {
    if (err) {
      console.error('Error fetching tasks for performance:', err);

      if (err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET') {
        return res.status(500).json({ error: 'Database connection lost. Please try again later.' });
      }

      return res.status(500).json({ error: 'Failed to retrieve tasks from database' });
    }

    // Handle empty tasks
    if (!results || results.length === 0) {
      return res.json({
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

    res.json({
      totalTasks: totalTasks,
      completedTasks: completedTasks,
      missedTasks: missedTasks,
      completionRate: completionRate,
      efficiency: efficiency,
      insight: insight
    });
  });
});

app.post('/api/chat', async (req, res) => {
  console.log('CHAT HIT');

  const { message } = req.body;

  // Validate message
  if (!message || typeof message !== 'string' || message.trim() === '') {
    console.log('Error: Message is empty or invalid');
    return res.status(400).json({ error: 'Message is required and must be a non-empty string' });
  }

  console.log('Message received:', message);

  // Check API key
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY is not set');
    return res.status(500).json({ error: 'Gemini API key is not configured on the server.' });
  }

  try {
    // Dynamic import for node-fetch v3 (ESM-only)
    const { default: fetch } = await import('node-fetch');

    const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: `You are a helpful AI study assistant for a Study Planner app. Help the student with study tips, scheduling advice, motivation, and general academic questions. Be concise and friendly.\n\nStudent's message: ${message.trim()}`
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      }
    };

    const geminiResponse = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const geminiData = await geminiResponse.json();

    if (!geminiResponse.ok) {
      console.error('Gemini API error:', geminiData);
      const errorMsg = geminiData?.error?.message || 'Gemini API request failed';
      return res.status(502).json({ error: errorMsg });
    }

    // Extract reply text from Gemini response
    const reply =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ||
      'Sorry, I could not generate a response.';

    console.log('Gemini reply:', reply.substring(0, 100) + '...');

    // Save chat to MySQL (optional — non-blocking, won't fail the response)
    const connection = req.app.locals.dbConnection;
    if (connection) {
      connection.query(
        'INSERT INTO chats (message, response) VALUES (?, ?)',
        [message.trim(), reply],
        (err) => {
          if (err) console.error('Failed to save chat to DB:', err.message);
          else console.log('Chat saved to DB');
        }
      );
    }

    res.json({ reply });
  } catch (error) {
    console.error('Chat route error:', error);
    res.status(500).json({ error: 'Failed to get response from AI. Please try again.' });
  }
});

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