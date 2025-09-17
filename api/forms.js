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
      console.log('=== INCOMING REQUEST BODY ===');
      console.log('Full req.body:', JSON.stringify(req.body, null, 2));
      console.log('Keys in req.body:', Object.keys(req.body));

      const {
        user_id, jefe_equipo_id, latitude, longitude, location_address, direccion_real,
        cliente, cif, direccion, persona_contacto, cargo_contacto, contacto_es_decisor,
        telefono_contacto, email_contacto, fin_permanencia, sedes_actuales, operador_actual,
        num_lineas_moviles, centralita, solo_voz, extensiones, m2m, fibras_actuales,
        ciberseguridad, registros_horario, proveedor_control_horario, num_licencias_control_horario,
        licencias_registro_horario, fecha_renovacion_control_horario, proveedor_correo, licencias_office, fecha_renovacion_office,
        mantenimiento_informatico, numero_empleados,
        // Campos específicos para FIDELIZACIÓN
        sedes_nuevas, num_lineas_moviles_nuevas, proveedor_mantenimiento,
        dispone_negocio_digital, admite_llamada_nps
      } = req.body;

      console.log('=== EXTRACTED VALUES ===');
      console.log('user_id:', user_id);
      console.log('jefe_equipo_id:', jefe_equipo_id);
      console.log('cliente:', cliente);
      console.log('cif:', cif);

      // Convertir valores vacíos a NULL o valores apropiados para la BD
      const processedData = {
        userId: user_id,
        jefeEquipoId: jefe_equipo_id,
        latitude: latitude || null,
        longitude: longitude || null,
        locationAddress: location_address || null,
        direccionReal: direccion_real || null,
        cliente: cliente,
        cif: cif,
        direccion: direccion,
        personaContacto: persona_contacto,
        cargoContacto: cargo_contacto,
        contactoEsDecisor: contacto_es_decisor === 'SI' || contacto_es_decisor === true ? 'SI' : 'NO', // string/boolean -> ENUM
        telefonoContacto: telefono_contacto,
        emailContacto: email_contacto,
        finPermanencia: fin_permanencia || null, // string vacío -> NULL para date
        sedesActuales: sedes_actuales || null,
        operadorActual: operador_actual || null,
        numLineasMoviles: num_lineas_moviles ? parseInt(num_lineas_moviles) : null, // string -> INT
        centralita: centralita ? (centralita === 'SI' || centralita === true || centralita === 'true' ? 'SI' : 'NO') : null, // -> ENUM
        soloVoz: solo_voz || null,
        extensiones: extensiones ? parseInt(extensiones) : null, // string -> INT
        m2m: m2m || null,
        fibrasActuales: fibras_actuales || null,
        ciberseguridad: ciberseguridad || null,
        registrosHorario: registros_horario ? (registros_horario === 'SI' || registros_horario === true || registros_horario === 'true' ? 'SI' : 'NO') : null, // -> ENUM
        proveedorControlHorario: proveedor_control_horario || null,
        numLicenciasControlHorario: num_licencias_control_horario ? parseInt(num_licencias_control_horario) : null,
        licenciasRegistroHorario: licencias_registro_horario || null,
        fechaRenovacionControlHorario: fecha_renovacion_control_horario || null,
        proveedorCorreo: proveedor_correo || null,
        licenciasOffice: licencias_office || null,
        fechaRenovacionOffice: fecha_renovacion_office || null,
        mantenimientoInformatico: mantenimiento_informatico ? (mantenimiento_informatico === 'SI' || mantenimiento_informatico === true || mantenimiento_informatico === 'true' ? 'SI' : 'NO') : null, // -> ENUM
        numeroEmpleados: numero_empleados ? parseInt(numero_empleados) : null,
        // Campos específicos para FIDELIZACIÓN
        sedesNuevas: sedes_nuevas || null,
        numLineasMovilesNuevas: num_lineas_moviles_nuevas ? parseInt(num_lineas_moviles_nuevas) : null,
        proveedorMantenimiento: proveedor_mantenimiento || null,
        disponeNegocioDigital: dispone_negocio_digital !== null && dispone_negocio_digital !== undefined ? (dispone_negocio_digital === 'SI' || dispone_negocio_digital === true ? 'SI' : 'NO') : null,
        admiteLlamadaNps: admite_llamada_nps !== null && admite_llamada_nps !== undefined ? (admite_llamada_nps === 'SI' || admite_llamada_nps === true ? 'SI' : 'NO') : null
      };

      console.log('=== PROCESSED DATA ===');
      console.log('processedData keys:', Object.keys(processedData));
      console.log('processedData sample:', {
        userId: processedData.userId,
        jefeEquipoId: processedData.jefeEquipoId,
        cliente: processedData.cliente,
        cif: processedData.cif
      });

      console.log('=== ATTEMPTING SQL INSERT ===');

      const [result] = await pool.execute(
        `INSERT INTO form_submissions (
          user_id, jefe_equipo_id, submission_date, latitude, longitude, location_address, direccion_real,
          cliente, cif, direccion, persona_contacto, cargo_contacto, contacto_es_decisor,
          telefono_contacto, email_contacto, fin_permanencia, sedes_actuales, operador_actual,
          num_lineas_moviles, centralita, solo_voz, extensiones, m2m, fibras_actuales,
          ciberseguridad, registros_horario, proveedor_control_horario, num_licencias_control_horario,
          licencias_registro_horario, fecha_renovacion_control_horario, proveedor_correo, licencias_office, fecha_renovacion_office,
          mantenimiento_informatico, numero_empleados, last_man,
          sedes_nuevas, num_lineas_moviles_nuevas, proveedor_mantenimiento,
          dispone_negocio_digital, admite_llamada_nps
        ) VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          processedData.userId, processedData.jefeEquipoId,
          processedData.latitude, processedData.longitude, processedData.locationAddress, processedData.direccionReal,
          processedData.cliente, processedData.cif, processedData.direccion,
          processedData.personaContacto, processedData.cargoContacto, processedData.contactoEsDecisor,
          processedData.telefonoContacto, processedData.emailContacto, processedData.finPermanencia,
          processedData.sedesActuales, processedData.operadorActual,
          processedData.numLineasMoviles, processedData.centralita, processedData.soloVoz,
          processedData.extensiones, processedData.m2m, processedData.fibrasActuales,
          processedData.ciberseguridad, processedData.registrosHorario, processedData.proveedorControlHorario, processedData.numLicenciasControlHorario,
          processedData.licenciasRegistroHorario, processedData.fechaRenovacionControlHorario, processedData.proveedorCorreo, processedData.licenciasOffice, processedData.fechaRenovacionOffice,
          processedData.mantenimientoInformatico, processedData.numeroEmpleados, processedData.userId,
          processedData.sedesNuevas, processedData.numLineasMovilesNuevas, processedData.proveedorMantenimiento,
          processedData.disponeNegocioDigital, processedData.admiteLlamadaNps
        ]
      );

      console.log('=== SQL INSERT SUCCESS ===');
      console.log('Result:', result);
      console.log('InsertId:', result.insertId);

      res.json({
        success: true,
        submissionId: result.insertId,
        message: 'Form submitted successfully'
      });

    } else if (req.method === 'GET') {
      const { cif, search, userId, requesterId } = parsedUrl.query;

      // Búsqueda por ID específico (GET /api/forms/{id})
      if (pathParts.length === 3 && pathParts[0] === 'api' && pathParts[1] === 'forms' && pathParts[2]) {
        const formId = pathParts[2];
        const [rows] = await pool.execute(
          `SELECT s.*, u.name as comercial_name, u.email as comercial_email,
                  boss.name as jefe_equipo_name
           FROM form_submissions s
           JOIN users u ON s.user_id = u.id
           LEFT JOIN users boss ON s.jefe_equipo_id = boss.id
           WHERE s.id = ?`,
          [formId]
        );

        if (rows.length > 0) {
          res.json(rows[0]);
        } else {
          res.status(404).json({ error: 'Form not found' });
        }
        return;
      }

      // Búsqueda por coincidencias parciales en CIF o nombre de cliente
      if (search) {
        const searchPattern = `%${search}%`;

        // Si hay requesterId, verificar el rol para determinar qué datos devolver
        if (requesterId) {
          const [requesterRows] = await pool.execute(
            'SELECT id, role, boss_id FROM users WHERE id = ?',
            [requesterId]
          );

          if (requesterRows.length > 0) {
            const requester = requesterRows[0];

            // Administradores y jefes de equipo ven los formularios completos
            if (requester.role === 'ADMINISTRADOR' || requester.role === 'JEFE_EQUIPO') {
              const [rows] = await pool.execute(
                `SELECT s.*, u.name as comercial_name, u.email as comercial_email, u.tipo as comercial_tipo,
                        boss.name as jefe_equipo_name, u.role as comercial_role
                 FROM form_submissions s
                 JOIN users u ON s.user_id = u.id
                 LEFT JOIN users boss ON s.jefe_equipo_id = boss.id
                 WHERE s.cif LIKE ? OR s.cliente LIKE ?
                 ORDER BY s.submission_date DESC
                 LIMIT 10`,
                [searchPattern, searchPattern]
              );

              res.json(rows);
              return;
            }
          }
        }

        // Para usuarios sin autenticación o comerciales: solo información básica
        const [rows] = await pool.execute(
          `SELECT DISTINCT s.id, s.cif, s.cliente as razonSocial,
                  s.telefono_contacto as telefono, s.email_contacto as email,
                  u.name as comercial_name, boss.name as jefe_equipo_name
           FROM form_submissions s
           JOIN users u ON s.user_id = u.id
           LEFT JOIN users boss ON s.jefe_equipo_id = boss.id
           WHERE s.cif LIKE ? OR s.cliente LIKE ?
           ORDER BY s.submission_date DESC
           LIMIT 10`,
          [searchPattern, searchPattern]
        );

        res.json(rows);
        return;
      }

      // Búsqueda por CIF exacto
      if (cif) {
        // Si hay requesterId, verificar el rol para determinar qué datos devolver
        if (requesterId) {
          const [requesterRows] = await pool.execute(
            'SELECT id, role, boss_id FROM users WHERE id = ?',
            [requesterId]
          );

          if (requesterRows.length > 0) {
            const requester = requesterRows[0];

            // Administradores y jefes de equipo ven los formularios completos
            if (requester.role === 'ADMINISTRADOR' || requester.role === 'JEFE_EQUIPO') {
              const [rows] = await pool.execute(
                `SELECT s.*, u.name as comercial_name, u.email as comercial_email, u.tipo as comercial_tipo,
                        boss.name as jefe_equipo_name, u.role as comercial_role
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
          }
        }

        // Para usuarios sin autenticación o comerciales: datos completos (manteniendo compatibilidad)
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
      // Actualizar formulario existente (PUT /api/forms/{id})
      const formId = pathParts.length === 3 && pathParts[0] === 'api' && pathParts[1] === 'forms' ? pathParts[2] : null;
      if (!formId) {
        res.status(400).json({ error: 'Form ID required for update. Use PUT /api/forms/{id}' });
        return;
      }

      const {
        userId, latitude, longitude, locationAddress, direccionReal,
        cliente, cif, direccion, personaContacto, cargoContacto, contactoEsDecisor,
        telefonoContacto, emailContacto, finPermanencia, sedesActuales, operadorActual,
        numLineasMoviles, centralita, soloVoz, extensiones, m2m, fibrasActuales,
        ciberseguridad, registrosHorario, proveedorControlHorario, numLicenciasControlHorario,
        licenciasRegistroHorario, fechaRenovacionControlHorario, proveedorCorreo, licenciasOffice, fechaRenovacionOffice,
        mantenimientoInformatico, numeroEmpleados,
        // Campos específicos para FIDELIZACIÓN
        sedesNuevas, numLineasMovilesNuevas, proveedorMantenimiento,
        disponeNegocioDigital, admiteLlamadaNps
      } = req.body;

      // Procesar datos igual que en POST
      const processedData = {
        userId: userId,
        latitude: latitude || null,
        longitude: longitude || null,
        locationAddress: locationAddress || null,
        direccionReal: direccionReal || null,
        cliente: cliente,
        cif: cif,
        direccion: direccion,
        personaContacto: personaContacto,
        cargoContacto: cargoContacto,
        contactoEsDecisor: contactoEsDecisor ? 'SI' : 'NO',
        telefonoContacto: telefonoContacto,
        emailContacto: emailContacto,
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
        proveedorControlHorario: proveedorControlHorario || null,
        numLicenciasControlHorario: numLicenciasControlHorario ? parseInt(numLicenciasControlHorario) : null,
        licenciasRegistroHorario: licenciasRegistroHorario || null,
        fechaRenovacionControlHorario: fechaRenovacionControlHorario || null,
        proveedorCorreo: proveedorCorreo || null,
        licenciasOffice: licenciasOffice || null,
        fechaRenovacionOffice: fechaRenovacionOffice || null,
        mantenimientoInformatico: mantenimientoInformatico ? (mantenimientoInformatico === 'true' || mantenimientoInformatico === 'SI' ? 'SI' : 'NO') : null,
        numeroEmpleados: numeroEmpleados ? parseInt(numeroEmpleados) : null,
        // Campos específicos para FIDELIZACIÓN
        sedesNuevas: sedesNuevas || null,
        numLineasMovilesNuevas: numLineasMovilesNuevas ? parseInt(numLineasMovilesNuevas) : null,
        proveedorMantenimiento: proveedorMantenimiento || null,
        disponeNegocioDigital: disponeNegocioDigital !== null && disponeNegocioDigital !== undefined ? (disponeNegocioDigital === 'SI' || disponeNegocioDigital === true ? 'SI' : 'NO') : null,
        admiteLlamadaNps: admiteLlamadaNps !== null && admiteLlamadaNps !== undefined ? (admiteLlamadaNps === 'SI' || admiteLlamadaNps === true ? 'SI' : 'NO') : null
      };

      const [result] = await pool.execute(
        `UPDATE form_submissions SET
          latitude = ?, longitude = ?, location_address = ?, direccion_real = ?,
          cliente = ?, cif = ?, direccion = ?, persona_contacto = ?, cargo_contacto = ?,
          contacto_es_decisor = ?, telefono_contacto = ?, email_contacto = ?,
          fin_permanencia = ?, sedes_actuales = ?, operador_actual = ?, num_lineas_moviles = ?,
          centralita = ?, solo_voz = ?, extensiones = ?, m2m = ?, fibras_actuales = ?,
          ciberseguridad = ?, registros_horario = ?, proveedor_control_horario = ?, num_licencias_control_horario = ?,
          licencias_registro_horario = ?, fecha_renovacion_control_horario = ?, proveedor_correo = ?, licencias_office = ?, fecha_renovacion_office = ?,
          mantenimiento_informatico = ?, numero_empleados = ?,
          sedes_nuevas = ?, num_lineas_moviles_nuevas = ?, proveedor_mantenimiento = ?,
          dispone_negocio_digital = ?, admite_llamada_nps = ?, last_man = ?,
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
          processedData.registrosHorario, processedData.proveedorControlHorario, processedData.numLicenciasControlHorario,
          processedData.licenciasRegistroHorario, processedData.fechaRenovacionControlHorario, processedData.proveedorCorreo, processedData.licenciasOffice, processedData.fechaRenovacionOffice,
          processedData.mantenimientoInformatico, processedData.numeroEmpleados,
          processedData.sedesNuevas, processedData.numLineasMovilesNuevas, processedData.proveedorMantenimiento,
          processedData.disponeNegocioDigital, processedData.admiteLlamadaNps, processedData.userId,
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
    console.error('=== FORMS ERROR ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error code:', error.code);
    console.error('Error errno:', error.errno);
    console.error('Error sqlState:', error.sqlState);
    console.error('Error sqlMessage:', error.sqlMessage);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};