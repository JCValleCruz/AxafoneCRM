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
    // Verificar si las columnas ya existen
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'comercial_form_db'
      AND TABLE_NAME = 'form_submissions'
      AND COLUMN_NAME IN ('fecha_renovacion_control_horario', 'fecha_renovacion_office')
    `);

    const existingColumns = columns.map(row => row.COLUMN_NAME);
    const migrations = [];

    // Agregar fecha_renovacion_control_horario si no existe
    if (!existingColumns.includes('fecha_renovacion_control_horario')) {
      await pool.execute(`
        ALTER TABLE form_submissions
        ADD COLUMN fecha_renovacion_control_horario VARCHAR(10) NULL
        AFTER num_licencias_control_horario
      `);
      migrations.push('fecha_renovacion_control_horario');
    }

    // Agregar fecha_renovacion_office si no existe
    if (!existingColumns.includes('fecha_renovacion_office')) {
      await pool.execute(`
        ALTER TABLE form_submissions
        ADD COLUMN fecha_renovacion_office VARCHAR(10) NULL
        AFTER licencias_office
      `);
      migrations.push('fecha_renovacion_office');
    }

    if (migrations.length > 0) {
      res.json({
        success: true,
        message: `Database migrated successfully. Added columns: ${migrations.join(', ')}`,
        addedColumns: migrations
      });
    } else {
      res.json({
        success: true,
        message: 'Database is already up to date. No migrations needed.',
        existingColumns: existingColumns
      });
    }

  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({
      error: 'Migration failed',
      details: error.message,
      stack: error.stack
    });
  }
};