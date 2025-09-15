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
        userId, jefeEquipoId, latitude, longitude, locationAddress, direccionReal,
        cliente, cif, direccion, personaContacto, cargoContacto, contactoEsDecisor,
        telefonoContacto, emailContacto, finPermanencia, sedesActuales, operadorActual,
        numLineasMoviles, centralita, soloVoz, extensiones, m2m, fibrasActuales,
        ciberseguridad, registrosHorario, proveedorCorreo, licenciasOffice,
        mantenimientoInformatico, numeroEmpleados,
        // Campos específicos para FIDELIZACIÓN
        sedesNuevas, numLineasMovilesNuevas, proveedorMantenimiento,
        disponeNegocioDigital, admiteLlamadaNps
      } = req.body;

      // Convertir valores vacíos a NULL o valores apropiados para la BD
      const processedData = {
        userId,
        jefeEquipoId,
        latitude,
        longitude,
        locationAddress,
        direccionReal: direccionReal || null,
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
        numeroEmpleados,
        // Campos específicos para FIDELIZACIÓN
        sedesNuevas: sedesNuevas || null,
        numLineasMovilesNuevas: numLineasMovilesNuevas ? parseInt(numLineasMovilesNuevas) : null,
        proveedorMantenimiento: proveedorMantenimiento || null,
        disponeNegocioDigital: disponeNegocioDigital !== null && disponeNegocioDigital !== undefined ? (disponeNegocioDigital ? 'SI' : 'NO') : null,
        admiteLlamadaNps: admiteLlamadaNps !== null && admiteLlamadaNps !== undefined ? (admiteLlamadaNps ? 'SI' : 'NO') : null
      };

      const [result] = await pool.execute(
        `INSERT INTO form_submissions (
          user_id, jefe_equipo_id, submission_date, latitude, longitude, location_address, direccion_real,
          cliente, cif, direccion, persona_contacto, cargo_contacto, contacto_es_decisor,
          telefono_contacto, email_contacto, fin_permanencia, sedes_actuales, operador_actual,
          num_lineas_moviles, centralita, solo_voz, extensiones, m2m, fibras_actuales,
          ciberseguridad, registros_horario, proveedor_correo, licencias_office,
          mantenimiento_informatico, numero_empleados,
          sedes_nuevas, num_lineas_moviles_nuevas, proveedor_mantenimiento,
          dispone_negocio_digital, admite_llamada_nps, created_at, updated_at
        ) VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          processedData.userId, processedData.jefeEquipoId,
          processedData.latitude, processedData.longitude, processedData.locationAddress, processedData.direccionReal,
          processedData.cliente, processedData.cif, processedData.direccion,
          processedData.personaContacto, processedData.cargoContacto, processedData.contactoEsDecisor,
          processedData.telefonoContacto, processedData.emailContacto, processedData.finPermanencia,
          processedData.sedesActuales, processedData.operadorActual,
          processedData.numLineasMoviles, processedData.centralita, processedData.soloVoz,
          processedData.extensiones, processedData.m2m, processedData.fibrasActuales,
          processedData.ciberseguridad, processedData.registrosHorario, processedData.proveedorCorreo,
          processedData.licenciasOffice, processedData.mantenimientoInformatico, processedData.numeroEmpleados,
          processedData.sedesNuevas, processedData.numLineasMovilesNuevas, processedData.proveedorMantenimiento,
 processedData.disponeNegocioDigital, processedData.admiteLlamadaNps
        ]
      );

      res.json({
        success: true,
        submissionId: result.insertId,
        message: 'Form submitted successfully'
      });

    } else if (req.method === 'GET') {
      const { cif, userId, requesterId } = parsedUrl.query;
      
      // Búsqueda por CIF
      if (cif) {
        const [rows] = await pool.execute(
          `SELECT s.*, u.name as comercial_name, u.email as comercial_email, 
                  boss.name as jefe_equipo_name
           FROM form_submissions s
           JOIN users u ON s.user_id = u.id
           LEFT JOIN users boss ON s.jefe_equipo_id = boss.id
           WHERE s.cif = ? 
           ORDER BY s.submission_date DESC 
           LIMIT 1`,
          [cif]
        );

        if (rows.length > 0) {
          res.json(rows[0]);
        } else {
          res.status(404).json({ error: 'No client found with this CIF' });
        }
        return;
      }

      // Si no hay requesterId, devolver error de autenticación
      if (!requesterId) {
        res.status(401).json({ error: 'User authentication required' });
        return;
      }

      // Obtener información del usuario que hace la petición
      const [requesterRows] = await pool.execute(
        'SELECT id, role, boss_id FROM users WHERE id = ?',
        [requesterId]
      );

      if (requesterRows.length === 0) {
        res.status(401).json({ error: 'Invalid user' });
        return;
      }

      const requester = requesterRows[0];
      let query, params;

      // Lógica de jerarquía de permisos
      switch (requester.role) {
        case 'ADMINISTRADOR':
          // Administradores ven todo
          query = `SELECT s.*, u.name as comercial_name, u.email as comercial_email, 
                          boss.name as jefe_equipo_name, u.role as comercial_role
                   FROM form_submissions s
                   JOIN users u ON s.user_id = u.id
                   LEFT JOIN users boss ON s.jefe_equipo_id = boss.id
                   ORDER BY s.submission_date DESC`;
          params = [];
          break;

        case 'JEFE_EQUIPO':
          // Jefes de equipo ven los de sus comerciales
          query = `SELECT s.*, u.name as comercial_name, u.email as comercial_email, 
                          boss.name as jefe_equipo_name, u.role as comercial_role
                   FROM form_submissions s
                   JOIN users u ON s.user_id = u.id
                   LEFT JOIN users boss ON s.jefe_equipo_id = boss.id
                   WHERE s.jefe_equipo_id = ?
                   ORDER BY s.submission_date DESC`;
          params = [requester.id];
          break;

        case 'COMERCIAL':
          // Comerciales solo ven sus propios informes
          query = `SELECT s.*, u.name as comercial_name, u.email as comercial_email, 
                          boss.name as jefe_equipo_name, u.role as comercial_role
                   FROM form_submissions s
                   JOIN users u ON s.user_id = u.id
                   LEFT JOIN users boss ON s.jefe_equipo_id = boss.id
                   WHERE s.user_id = ?
                   ORDER BY s.submission_date DESC`;
          params = [requester.id];
          break;

        default:
          res.status(403).json({ error: 'Invalid user role' });
          return;
      }

      const [rows] = await pool.execute(query, params);
      res.json(rows);
    } else if (req.method === 'PUT') {
      // Actualizar formulario existente
      const formId = pathParts[0]; // ID del formulario en la URL
      if (!formId) {
        res.status(400).json({ error: 'Form ID required for update' });
        return;
      }

      const {
        latitude, longitude, locationAddress, direccionReal,
        cliente, cif, direccion, personaContacto, cargoContacto, contactoEsDecisor,
        telefonoContacto, emailContacto, finPermanencia, sedesActuales, operadorActual,
        numLineasMoviles, centralita, soloVoz, extensiones, m2m, fibrasActuales,
        ciberseguridad, registrosHorario, proveedorCorreo, licenciasOffice,
        mantenimientoInformatico, numeroEmpleados,
        // Campos específicos para FIDELIZACIÓN
        sedesNuevas, numLineasMovilesNuevas, proveedorMantenimiento,
        disponeNegocioDigital, admiteLlamadaNps
      } = req.body;

      // Procesar datos igual que en POST
      const processedData = {
        latitude,
        longitude,
        locationAddress,
        direccionReal: direccionReal || null,
        cliente,
        cif,
        direccion,
        personaContacto,
        cargoContacto,
        contactoEsDecisor: contactoEsDecisor ? 'SI' : 'NO',
        telefonoContacto,
        emailContacto,
        finPermanencia: finPermanencia || null,
        sedesActuales: sedesActuales || null,
        operadorActual: operadorActual || null,
        numLineasMoviles: numLineasMoviles ? parseInt(numLineasMoviles) : null,
        centralita: centralita ? (centralita === 'true' || centralita === 'SI' ? 'SI' : 'NO') : null,
        soloVoz: soloVoz || null,
        extensiones: extensiones ? parseInt(extensiones) : null,
        m2m: m2m || null,
        fibrasActuales: fibrasActuales || null,
        ciberseguridad: ciberseguridad || null,
        registrosHorario: registrosHorario ? (registrosHorario === 'true' || registrosHorario === 'SI' ? 'SI' : 'NO') : null,
        proveedorCorreo: proveedorCorreo || null,
        licenciasOffice: licenciasOffice || null,
        mantenimientoInformatico: mantenimientoInformatico ? (mantenimientoInformatico === 'true' || mantenimientoInformatico === 'SI' ? 'SI' : 'NO') : null,
        numeroEmpleados,
        // Campos específicos para FIDELIZACIÓN
        sedesNuevas: sedesNuevas || null,
        numLineasMovilesNuevas: numLineasMovilesNuevas ? parseInt(numLineasMovilesNuevas) : null,
        proveedorMantenimiento: proveedorMantenimiento || null,
        disponeNegocioDigital: disponeNegocioDigital !== null && disponeNegocioDigital !== undefined ? (disponeNegocioDigital ? 'SI' : 'NO') : null,
        admiteLlamadaNps: admiteLlamadaNps !== null && admiteLlamadaNps !== undefined ? (admiteLlamadaNps ? 'SI' : 'NO') : null
      };

      const [result] = await pool.execute(
        `UPDATE form_submissions SET
          latitude = ?, longitude = ?, location_address = ?, direccion_real = ?,
          cliente = ?, cif = ?, direccion = ?, persona_contacto = ?, cargo_contacto = ?,
          contacto_es_decisor = ?, telefono_contacto = ?, email_contacto = ?,
          fin_permanencia = ?, sedes_actuales = ?, operador_actual = ?, num_lineas_moviles = ?,
          centralita = ?, solo_voz = ?, extensiones = ?, m2m = ?, fibras_actuales = ?,
          ciberseguridad = ?, registros_horario = ?, proveedor_correo = ?, licencias_office = ?,
          mantenimiento_informatico = ?, numero_empleados = ?,
          sedes_nuevas = ?, num_lineas_moviles_nuevas = ?, proveedor_mantenimiento = ?,
          dispone_negocio_digital = ?, admite_llamada_nps = ?,
          updated_at = NOW()
         WHERE id = ?`,
        [
          processedData.latitude, processedData.longitude, processedData.locationAddress, processedData.direccionReal,
          processedData.cliente, processedData.cif, processedData.direccion,
          processedData.personaContacto, processedData.cargoContacto, processedData.contactoEsDecisor,
          processedData.telefonoContacto, processedData.emailContacto, processedData.finPermanencia,
          processedData.sedesActuales, processedData.operadorActual, processedData.numLineasMoviles,
          processedData.centralita, processedData.soloVoz, processedData.extensiones,
          processedData.m2m, processedData.fibrasActuales, processedData.ciberseguridad,
          processedData.registrosHorario, processedData.proveedorCorreo, processedData.licenciasOffice,
          processedData.mantenimientoInformatico, processedData.numeroEmpleados,
          processedData.sedesNuevas, processedData.numLineasMovilesNuevas, processedData.proveedorMantenimiento,
 processedData.disponeNegocioDigital, processedData.admiteLlamadaNps,
          formId
        ]
      );

      if (result.affectedRows > 0) {
        res.json({
          success: true,
          message: 'Form updated successfully'
        });
      } else {
        res.status(404).json({ error: 'Form not found' });
      }
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Forms error:', error);
    res.status(500).json({ error: 'Internal server error', debug: error.message });
  }
};