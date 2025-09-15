const pool = require('./db');
const url = require('url');
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

  const parsedUrl = url.parse(req.url, true);
  const pathParts = parsedUrl.pathname.split('/').filter(part => part);

  try {
    // GET /api/users/{id}
    if (req.method === 'GET' && pathParts.length === 3) {
      const userId = pathParts[2];

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

    // GET /api/users/{id}/team
    } else if (req.method === 'GET' && pathParts.length === 4 && pathParts[3] === 'team') {
      const bossId = pathParts[2];

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

    // POST /api/users
    } else if (req.method === 'POST' && pathParts.length === 2) {
      const { email, password, name, role, tipo, bossId } = req.body;
      
      console.log('Creating user with data:', { email, name, role, tipo, bossId });

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      const [result] = await pool.execute(
        `INSERT INTO users (email, password, name, role, tipo, boss_id, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, true, NOW(), NOW())`,
        [email, hashedPassword, name, role, tipo || null, bossId || null]
      );

      res.json({
        success: true,
        userId: result.insertId,
        message: 'User created successfully'
      });

    // PUT /api/users/{id}/password
    } else if (req.method === 'PUT' && pathParts.length === 4 && pathParts[3] === 'password') {
      const userId = pathParts[2];
      const { oldPassword, newPassword } = req.body;

      if (!oldPassword || !newPassword) {
        return res.status(400).json({ error: 'Old password and new password are required' });
      }

      const [rows] = await pool.execute(
        `SELECT password as hashedPassword FROM users WHERE id = ?`,
        [userId]
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = rows[0];
      const passwordMatch = await bcrypt.compare(oldPassword, user.hashedPassword);

      if (!passwordMatch) {
        return res.status(401).json({ error: 'Invalid old password' });
      }

      const saltRounds = 10;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      await pool.execute(
        `UPDATE users SET password = ? WHERE id = ?`,
        [hashedNewPassword, userId]
      );

      res.json({ success: true, message: 'Password updated successfully' });

    } else {
      res.status(405).json({ error: 'Method not allowed for the requested URL' });
    }

  } catch (error) {
    console.error('Users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};