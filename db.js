const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || '195.248.230.153',
  port: process.env.DB_PORT || 10000,
  user: process.env.DB_USER || 'comercial_user',
  password: process.env.DB_PASSWORD || 'comercial_pass_2024',
  database: process.env.DB_NAME || 'comercial_form_db',
  connectTimeout: 30000,
  acquireTimeout: 30000,
  timeout: 30000,
  reconnect: true
};

const pool = mysql.createPool(dbConfig);

module.exports = pool;