const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { isValidEmail } = require('../utils/validation');

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
    res.fail(500, 'Database not connected');
    return null;
  }

  return connection;
}

function getJwtSecret() {
  return process.env.JWT_SECRET;
}

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

function getMe(req, res) {
  return res.success({ user: sanitizeUser(req.user) });
}

async function register(req, res) {
  const connection = getConnection(req, res);
  if (!connection) return;

  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';

  if (!name || !email || !password) {
    return res.fail(400, 'Name, email, and password are required');
  }

  if (!isValidEmail(email)) {
    return res.fail(400, 'Please provide a valid email address');
  }

  if (password.length < 6) {
    return res.fail(400, 'Password must be at least 6 characters long');
  }

  try {
    const existingUsers = await query(
      connection,
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [email],
    );

    if (existingUsers.length > 0) {
      return res.fail(409, 'Email is already registered');
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await query(
      connection,
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword],
    );

    return res.success(
      {
        message: 'User registered successfully',
        user: {
          id: result.insertId,
          name,
          email,
        },
      },
      201,
    );
  } catch (err) {
    console.error('Registration error:', err);

    if (err.code === 'ER_DUP_ENTRY') {
      return res.fail(409, 'Email is already registered');
    }

    return res.fail(500, 'Failed to register user');
  }
}

async function login(req, res) {
  const connection = getConnection(req, res);
  if (!connection) return;

  const jwtSecret = getJwtSecret();
  if (!jwtSecret) {
    console.error('JWT_SECRET is not configured');
    return res.fail(500, 'Authentication service is not configured');
  }

  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';

  if (!email || !password) {
    return res.fail(400, 'Email and password are required');
  }

  if (!isValidEmail(email)) {
    return res.fail(400, 'Please provide a valid email address');
  }

  if (password.length < 6) {
    return res.fail(400, 'Password must be at least 6 characters long');
  }

  try {
    const users = await query(
      connection,
      'SELECT id, name, email, password FROM users WHERE email = ? LIMIT 1',
      [email],
    );

    if (users.length === 0) {
      return res.fail(401, 'Invalid email or password');
    }

    const user = users[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.fail(401, 'Invalid email or password');
    }

    const safeUser = sanitizeUser(user);
    const token = jwt.sign(safeUser, jwtSecret, { expiresIn: TOKEN_EXPIRES_IN });

    return res.success({
      message: 'Login successful',
      token,
      user: safeUser,
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.fail(500, 'Failed to login');
  }
}

module.exports = {
  getMe,
  register,
  login,
};
