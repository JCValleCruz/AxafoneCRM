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

      // Always filter by jefe de equipo
      if (jefeEquipoId) {
        whereConditions.push('forms.jefe_equipo_id = ?');
        queryParams.push(jefeEquipoId);
      }

      // Filter by specific comercial if provided
      if (comercialId) {
        whereConditions.push('forms.user_id = ?');
        queryParams.push(comercialId);
      }

      // Filter by date range
      if (fechaInicio) {
        whereConditions.push('DATE(forms.created_at) >= STR_TO_DATE(?, "%d/%m/%Y")');
        queryParams.push(fechaInicio);
      }

      if (fechaFin) {
        whereConditions.push('DATE(forms.updated_at) <= STR_TO_DATE(?, "%d/%m/%Y")');
        queryParams.push(fechaFin);
      }

      const whereClause = whereConditions.length > 0
        ? 'WHERE ' + whereConditions.join(' AND ')
        : '';

      const sqlQuery = `
        SELECT
          forms.id,
          forms.cliente,
          forms.cif,
          forms.direccion,
          forms.persona_contacto,
          forms.cargo_contacto,
          forms.contacto_es_decisor,
          forms.telefono_contacto,
          forms.email_contacto,
          forms.fin_permanencia,
          forms.sedes_actuales,
          forms.operador_actual,
          forms.num_lineas_moviles,
          forms.centralita,
          forms.solo_voz,
          forms.extensiones,
          forms.m2m,
          forms.fibras_actuales,
          forms.ciberseguridad,
          forms.registros_horario,
          forms.proveedor_correo,
          forms.licencias_office,
          forms.mantenimiento_informatico,
          forms.numero_empleados,
          forms.created_at,
          forms.updated_at,
          users.name as comercial_name,
          users.email as comercial_email,
          users.tipo as comercial_tipo
        FROM forms
        LEFT JOIN users ON forms.user_id = users.id
        ${whereClause}
        ORDER BY forms.updated_at DESC
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