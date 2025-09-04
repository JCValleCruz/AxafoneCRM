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
    if (req.method === 'POST') {
      const {
        userId, jefeEquipoId, latitude, longitude, locationAddress,
        cliente, cif, direccion, personaContacto, cargoContacto, contactoEsDecisor,
        telefonoContacto, emailContacto, finPermanencia, sedesActuales, operadorActual,
        numLineasMoviles, centralita, soloVoz, extensiones, m2m, fibrasActuales,
        ciberseguridad, registrosHorario, proveedorCorreo, licenciasOffice,
        mantenimientoInformatico, numeroEmpleados
      } = req.body;

      // Convertir valores vacíos a NULL o valores apropiados para la BD
      const processedData = {
        userId,
        jefeEquipoId,
        latitude,
        longitude,
        locationAddress,
        cliente,
        cif,
        direccion,
        personaContacto,
        cargoContacto,
        contactoEsDecisor: contactoEsDecisor ? 'SI' : 'NO', // boolean -> ENUM
        telefonoContacto,
        emailContacto,
        finPermanencia: finPermanencia || null, // string vacío -> NULL para date
        sedesActuales: sedesActuales || null,
        operadorActual: operadorActual || null,
        numLineasMoviles: numLineasMoviles ? parseInt(numLineasMoviles) : null, // string -> INT
        centralita: centralita ? (centralita === 'true' || centralita === 'SI' ? 'SI' : 'NO') : null, // -> ENUM
        soloVoz: soloVoz || null,
        extensiones: extensiones ? parseInt(extensiones) : null, // string -> INT
        m2m: m2m || null,
        fibrasActuales: fibrasActuales || null,
        ciberseguridad: ciberseguridad || null,
        registrosHorario: registrosHorario ? (registrosHorario === 'true' || registrosHorario === 'SI' ? 'SI' : 'NO') : null, // -> ENUM
        proveedorCorreo: proveedorCorreo || null,
        licenciasOffice: licenciasOffice || null,
        mantenimientoInformatico: mantenimientoInformatico ? (mantenimientoInformatico === 'true' || mantenimientoInformatico === 'SI' ? 'SI' : 'NO') : null, // -> ENUM
        numeroEmpleados
      };

      const [result] = await pool.execute(
        `INSERT INTO form_submissions (
          user_id, jefe_equipo_id, submission_date, latitude, longitude, location_address,
          cliente, cif, direccion, persona_contacto, cargo_contacto, contacto_es_decisor,
          telefono_contacto, email_contacto, fin_permanencia, sedes_actuales, operador_actual,
          num_lineas_moviles, centralita, solo_voz, extensiones, m2m, fibras_actuales,
          ciberseguridad, registros_horario, proveedor_correo, licencias_office,
          mantenimiento_informatico, numero_empleados, created_at, updated_at
        ) VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          processedData.userId, processedData.jefeEquipoId, 
          processedData.latitude, processedData.longitude, processedData.locationAddress,
          processedData.cliente, processedData.cif, processedData.direccion, 
          processedData.personaContacto, processedData.cargoContacto, processedData.contactoEsDecisor,
          processedData.telefonoContacto, processedData.emailContacto, processedData.finPermanencia, 
          processedData.sedesActuales, processedData.operadorActual,
          processedData.numLineasMoviles, processedData.centralita, processedData.soloVoz, 
          processedData.extensiones, processedData.m2m, processedData.fibrasActuales,
          processedData.ciberseguridad, processedData.registrosHorario, processedData.proveedorCorreo, 
          processedData.licenciasOffice, processedData.mantenimientoInformatico, processedData.numeroEmpleados
        ]
      );

      res.json({
        success: true,
        submissionId: result.insertId,
        message: 'Form submitted successfully'
      });

    } else if (req.method === 'GET') {
      if (pathParts.length === 3 && pathParts[1] === 'cif') {
        const cif = pathParts[2];
        const [rows] = await pool.execute(
          `SELECT * FROM form_submissions 
           WHERE cif = ? 
           ORDER BY submission_date DESC 
           LIMIT 1`,
          [cif]
        );

        if (rows.length > 0) {
          res.json(rows[0]);
        } else {
          res.status(404).json({ error: 'No client found with this CIF' });
        }

      } else if (pathParts.length === 3 && pathParts[1] === 'user') {
        const userId = pathParts[2];
        const [rows] = await pool.execute(
          `SELECT s.*, u.name as comercial_name, u.email as comercial_email, 
                  boss.name as jefe_equipo_name
           FROM form_submissions s
           JOIN users u ON s.user_id = u.id
           LEFT JOIN users boss ON s.jefe_equipo_id = boss.id
           WHERE s.user_id = ?
           ORDER BY s.submission_date DESC`,
          [userId]
        );

        res.json(rows);

      } else {
        const [rows] = await pool.execute(
          `SELECT s.*, u.name as comercial_name, u.email as comercial_email, 
                  boss.name as jefe_equipo_name
           FROM form_submissions s
           JOIN users u ON s.user_id = u.id
           LEFT JOIN users boss ON s.jefe_equipo_id = boss.id
           ORDER BY s.submission_date DESC`
        );

        res.json(rows);
      }
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Forms error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};