const pool = require('./db');
const bcrypt = require('bcrypt');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // Verificar si el usuario ya existe
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      ['nchat@axafone.com']
    );
    
    if (existing.length > 0) {
      res.json({
        success: true,
        message: 'User already exists',
        userId: existing[0].id
      });
      return;
    }

    // Crear el usuario de prueba
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash('pass123', saltRounds);

    const [result] = await pool.execute(
      `INSERT INTO users (email, password, name, role, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, true, NOW(), NOW())`,
      ['nchat@axafone.com', hashedPassword, 'Nicolas Chat', 'ADMINISTRADOR']
    );

    res.json({
      success: true,
      userId: result.insertId,
      message: 'Test user created successfully'
    });

  } catch (error) {
    console.error('Create test user error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};