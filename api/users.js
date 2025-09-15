const pool = require('./db');
const url = require('url');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathParts = parsedUrl.pathname.split('/').filter(part => part);

  try {
    if (req.method === 'GET' && pathParts.length === 2) {
      const userId = pathParts[1];
      
      const [rows] = await pool.execute(
        `SELECT id, email, name, role, boss_id, is_active, created_at, updated_at 
         FROM users 
         WHERE id = ?`,
        [userId]
      );

      if (rows.length > 0) {
        const user = rows[0];
        res.json({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          bossId: user.boss_id,
          isActive: user.is_active,
          createdAt: user.created_at,
          updatedAt: user.updated_at
        });
      } else {
        res.status(404).json({ error: 'User not found' });
      }

    } else if (req.method === 'GET' && pathParts.length === 3 && pathParts[2] === 'team') {
      const bossId = pathParts[1];

      const [rows] = await pool.execute(
        `SELECT id, email, name, role, tipo
         FROM users
         WHERE boss_id = ? AND is_active = 1
         ORDER BY name`,
        [bossId]
      );

      const teamMembers = rows.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tipo: user.tipo
      }));

      res.json(teamMembers);

    } else if (req.method === 'POST') {
      const { email, password, name, role, tipo, boss_id } = req.body;

      console.log('Creating user with data:', { email, password, name, role, tipo, boss_id });

      const [result] = await pool.execute(
        `INSERT INTO users (email, password, name, role, tipo, boss_id, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, true, NOW(), NOW())`,
        [email, password, name, role, tipo || null, boss_id || null]
      );

      res.json({
        success: true,
        userId: result.insertId,
        message: 'User created successfully'
      });

    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};