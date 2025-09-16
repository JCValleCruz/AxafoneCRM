const pool = require('./db');
const url = require('url');
const ExcelJS = require('exceljs');

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
      const { jefeEquipoId, comercialId, fechaInicio, fechaFin, format } = query;

      // Build the WHERE clause based on filters
      let whereConditions = [];
      let queryParams = [];

      // Filter by specific comercial if provided
      if (comercialId) {
        whereConditions.push('fs.user_id = ?');
        queryParams.push(comercialId);
      } else if (jefeEquipoId) {
        // If no specific comercial, filter by ALL team members under this boss
        whereConditions.push('fs.user_id IN (SELECT id FROM users WHERE boss_id = ? AND is_active = 1)');
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
          fs.licencias_registro_horario,
          fs.proveedor_correo,
          fs.licencias_office,
          fs.mantenimiento_informatico,
          fs.numero_empleados,
          fs.created_at,
          fs.updated_at,
          fs.last_man,
          users.name as comercial_name,
          users.email as comercial_email,
          users.tipo as comercial_tipo,
          last_user.name as last_man_name,
          last_user.email as last_man_email
        FROM form_submissions fs
        LEFT JOIN users ON fs.user_id = users.id
        LEFT JOIN users last_user ON fs.last_man = last_user.id
        ${whereClause}
        ORDER BY fs.updated_at DESC
      `;

      console.log('Reports query:', sqlQuery);
      console.log('Query params:', queryParams);

      const [rows] = await pool.execute(sqlQuery, queryParams);

      // Check if Excel format is requested
      if (format === 'excel') {
        return await generateExcelReport(res, rows, { jefeEquipoId, comercialId, fechaInicio, fechaFin });
      }

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

async function generateExcelReport(res, rows, filters) {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Informes Comerciales');

    // Create styles
    const headerStyle = {
      fill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1F4E79' }
      },
      font: {
        color: { argb: 'FFFFFFFF' },
        bold: true,
        size: 12
      },
      alignment: {
        horizontal: 'center',
        vertical: 'middle'
      },
      border: {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    };

    const dataStyle = {
      border: {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      },
      alignment: {
        vertical: 'middle'
      }
    };

    // Add title
    let rowIndex = 1;
    const titleCell = worksheet.getCell(`A${rowIndex}`);
    titleCell.value = 'Informe de Comerciales - AxafoneCRM';
    titleCell.font = { bold: true, size: 16 };
    rowIndex++;

    // Add generation date
    const dateCell = worksheet.getCell(`A${rowIndex}`);
    const currentDate = new Date().toLocaleString('es-ES');
    dateCell.value = `Generado el: ${currentDate}`;
    rowIndex++;

    // Add filter info
    const filterCell = worksheet.getCell(`A${rowIndex}`);
    let filterInfo = 'Filtros aplicados: ';
    if (filters.jefeEquipoId) filterInfo += `Jefe Equipo ID: ${filters.jefeEquipoId}, `;
    if (filters.comercialId) filterInfo += `Comercial ID: ${filters.comercialId}, `;
    if (filters.fechaInicio) filterInfo += `Desde: ${filters.fechaInicio}, `;
    if (filters.fechaFin) filterInfo += `Hasta: ${filters.fechaFin}, `;
    if (filterInfo === 'Filtros aplicados: ') filterInfo = 'Sin filtros aplicados';
    filterCell.value = filterInfo;
    rowIndex++;

    // Empty row
    rowIndex++;

    // Headers - incluyendo las nuevas columnas de last_man
    const headers = [
      'ID', 'Dirección Real', 'Cliente', 'CIF', 'Dirección', 'Persona Contacto', 'Cargo Contacto',
      'Contacto es Decisor', 'Teléfono', 'Email', 'Fin Permanencia', 'Sedes Actuales',
      'Operador Actual', 'Líneas Móviles', 'Centralita', 'Solo Voz', 'Extensiones',
      'M2M', 'Fibras Actuales', 'Ciberseguridad', 'Registros Horario', 'Licencias Registro Horario', 'Proveedor Correo',
      'Licencias Office', 'Mantenimiento IT', 'Número Empleados',
      'Comercial', 'Email Comercial', 'Tipo Comercial',
      'Último Editor', 'Email Último Editor',
      // Campos específicos FIDELIZACIÓN
      'Sedes Nuevas', 'Líneas Móviles Nuevas', 'Proveedor Mantenimiento',
      'Dispone Negocio Digital', 'Admite Llamada NPS',
      // Fechas
      'Fecha Creación', 'Fecha Actualización'
    ];

    // Add headers
    const headerRow = worksheet.getRow(rowIndex);
    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = header;
      cell.style = headerStyle;
    });
    rowIndex++;

    // Add data rows
    rows.forEach(row => {
      const dataRow = worksheet.getRow(rowIndex);

      const values = [
        row.id,
        row.direccion_real || '',
        row.cliente || '',
        row.cif || '',
        row.direccion || '',
        row.persona_contacto || '',
        row.cargo_contacto || '',
        row.contacto_es_decisor || '',
        row.telefono_contacto || '',
        row.email_contacto || '',
        row.fin_permanencia || '',
        row.sedes_actuales || '',
        row.operador_actual || '',
        row.num_lineas_moviles || 0,
        row.centralita || '',
        row.solo_voz || '',
        row.extensiones || 0,
        row.m2m || '',
        row.fibras_actuales || '',
        row.ciberseguridad || '',
        row.registros_horario || '',
        row.licencias_registro_horario || '',
        row.proveedor_correo || '',
        row.licencias_office || '',
        row.mantenimiento_informatico || '',
        row.numero_empleados || 0,
        row.comercial_name || '',
        row.comercial_email || '',
        row.comercial_tipo || '',
        row.last_man_name || '',
        row.last_man_email || '',
        // Campos FIDELIZACIÓN
        row.sedes_nuevas || '',
        row.num_lineas_moviles_nuevas || 0,
        row.proveedor_mantenimiento || '',
        row.dispone_negocio_digital || '',
        row.admite_llamada_nps || '',
        // Fechas
        row.created_at ? new Date(row.created_at).toLocaleString('es-ES') : '',
        row.updated_at ? new Date(row.updated_at).toLocaleString('es-ES') : ''
      ];

      values.forEach((value, index) => {
        const cell = dataRow.getCell(index + 1);
        cell.value = value;
        cell.style = dataStyle;
      });

      rowIndex++;
    });

    // Set column widths
    headers.forEach((header, index) => {
      const width = header.length <= 5 ? 15 :
                   header.length <= 10 ? 20 :
                   header.length <= 15 ? 25 : 30;
      worksheet.getColumn(index + 1).width = width;
    });

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `Informes_AxafoneCRM_${timestamp}.xlsx`;

    // Set response headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Write workbook to response
    await workbook.xlsx.write(res);

  } catch (error) {
    console.error('Excel generation error:', error);
    res.status(500).json({ error: 'Error generating Excel file', details: error.message });
  }
}