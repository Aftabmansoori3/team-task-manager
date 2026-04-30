const { Sequelize } = require('sequelize');

let sequelize;

// Railway provides MYSQL_URL - use it if available, otherwise fall back to separate vars
if (process.env.MYSQL_URL) {
  sequelize = new Sequelize(process.env.MYSQL_URL, {
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
    define: { timestamps: true, underscored: true }
  });
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      dialect: 'mysql',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
      define: { timestamps: true, underscored: true }
    }
  );
}

// retry connection a few times - Railway MySQL can take a moment to be ready
const testConnection = async (retries = 5) => {
  for (let i = 0; i < retries; i++) {
    try {
      await sequelize.authenticate();
      console.log('✓ MySQL connected successfully');
      return;
    } catch (err) {
      console.error(`✗ MySQL connection attempt ${i + 1}/${retries} failed:`, err.message);
      if (i < retries - 1) {
        console.log('  Retrying in 3 seconds...');
        await new Promise(r => setTimeout(r, 3000));
      }
    }
  }
  console.error('Could not connect to MySQL after', retries, 'attempts. Exiting.');
  process.exit(1);
};

module.exports = { sequelize, testConnection };
