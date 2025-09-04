const pool = require('./db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Verificar si la tabla users existe y tiene datos
    const [users] = await pool.execute('SELECT COUNT(*) as count FROM users');
    const userCount = users[0].count;

    if (userCount === 0) {
      // Crear usuario administrador por defecto
      await pool.execute(
        `INSERT INTO users (email, password, name, role, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, true, NOW(), NOW())`,
        ['admin@axafone.com', 'admin123', 'Administrador', 'ADMINISTRADOR']
      );

      // Crear usuario de prueba Nicolas
      await pool.execute(
        `INSERT INTO users (email, password, name, role, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, true, NOW(), NOW())`,
        ['nchat@axafone.com', 'pass123', 'Nicolas Chat', 'ADMINISTRADOR']
      );

      res.json({
        success: true,
        message: 'Database initialized with test users',
        users: [
          { email: 'admin@axafone.com', password: 'admin123' },
          { email: 'nchat@axafone.com', password: 'pass123' }
        ]
      });
    } else {
      // Listar usuarios existentes
      const [existingUsers] = await pool.execute(
        'SELECT id, email, name, role FROM users WHERE is_active = true'
      );
      
      res.json({
        success: true,
        message: `Database has ${userCount} users`,
        users: existingUsers
      });
    }

  } catch (error) {
    console.error('Init DB error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message,
      stack: error.stack 
    });
  }
};