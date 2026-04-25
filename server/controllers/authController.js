const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SALT_ROUNDS = 10;
const TOKEN_EXPIRES_IN = '7d';

function query(connection, sql, params = []) {
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

function getConnection(req, res) {
  const connection = req.app.locals.dbConnection;

  if (!connection) {
    res.status(500).json({ success: false, message: 'Database not connected' });
    return null;
  }

  return connection;
}

function getJwtSecret() {
  return process.env.JWT_SECRET;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

function getMe(req, res) {
  return res.json({
    success: true,
    user: req.user,
  });
}

async function register(req, res) {
  const connection = getConnection(req, res);
  if (!connection) return;

  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Name, email, and password are required',
    });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address',
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long',
    });
  }

  try {
    const existingUsers = await query(
      connection,
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [email],
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Email is already registered',
      });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await query(
      connection,
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword],
    );

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: result.insertId,
        name,
        email,
      },
    });
  } catch (err) {
    console.error('Registration error:', err);

    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'Email is already registered',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to register user',
    });
  }
}

async function login(req, res) {
  const connection = getConnection(req, res);
  if (!connection) return;

  const jwtSecret = getJwtSecret();
  if (!jwtSecret) {
    console.error('JWT_SECRET is not configured');
    return res.status(500).json({
      success: false,
      message: 'Authentication service is not configured',
    });
  }

  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required',
    });
  }

  try {
    const users = await query(
      connection,
      'SELECT id, name, email, password FROM users WHERE email = ? LIMIT 1',
      [email],
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const user = users[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const safeUser = sanitizeUser(user);
    const token = jwt.sign(safeUser, jwtSecret, { expiresIn: TOKEN_EXPIRES_IN });

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: safeUser,
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to login',
    });
  }
}

module.exports = {
  getMe,
  register,
  login,
};
