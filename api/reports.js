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
      const { jefeEquipoId, comercialId, fechaInicio, fechaFin } = query;

      // Build the WHERE clause based on filters
      let whereConditions = [];
      let queryParams = [];

      // Filter by specific comercial if provided
      if (comercialId) {
        whereConditions.push('fs.user_id = ?');
        queryParams.push(comercialId);
      } else if (jefeEquipoId) {
        // If no specific comercial, filter by team members under this boss
        whereConditions.push('users.boss_id = ?');
        queryParams.push(jefeEquipoId);
      }

      // Filter by date range
      if (fechaInicio) {
        whereConditions.push('DATE(fs.created_at) >= STR_TO_DATE(?, "%d/%m/%Y")');
        queryParams.push(fechaInicio);
      }

      if (fechaFin) {
        whereConditions.push('DATE(fs.updated_at) <= STR_TO_DATE(?, "%d/%m/%Y")');
        queryParams.push(fechaFin);
      }

      const whereClause = whereConditions.length > 0
        ? 'WHERE ' + whereConditions.join(' AND ')
        : '';

      const sqlQuery = `
        SELECT
          fs.id,
          fs.cliente,
          fs.cif,
          fs.direccion,
          fs.persona_contacto,
          fs.cargo_contacto,
          fs.contacto_es_decisor,
          fs.telefono_contacto,
          fs.email_contacto,
          fs.fin_permanencia,
          fs.sedes_actuales,
          fs.operador_actual,
          fs.num_lineas_moviles,
          fs.centralita,
          fs.solo_voz,
          fs.extensiones,
          fs.m2m,
          fs.fibras_actuales,
          fs.ciberseguridad,
          fs.registros_horario,
          fs.proveedor_correo,
          fs.licencias_office,
          fs.mantenimiento_informatico,
          fs.numero_empleados,
          fs.created_at,
          fs.updated_at,
          users.name as comercial_name,
          users.email as comercial_email,
          users.tipo as comercial_tipo
        FROM form_submissions fs
        LEFT JOIN users ON fs.user_id = users.id
        ${whereClause}
        ORDER BY fs.updated_at DESC
      `;

      console.log('Reports query:', sqlQuery);
      console.log('Query params:', queryParams);

      const [rows] = await pool.execute(sqlQuery, queryParams);

      res.json({
        success: true,
        totalRecords: rows.length,
        filters: {
          jefeEquipoId,
          comercialId,
          fechaInicio,
          fechaFin
        },
        data: rows
      });

    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Reports error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};