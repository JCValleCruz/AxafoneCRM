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
  const query = parsedUrl.query;

  try {
    if (req.method === 'GET') {
      const { bossId } = query;

      if (!bossId) {
        return res.status(400).json({ error: 'bossId parameter is required' });
      }

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

    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Team error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};