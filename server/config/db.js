const { Sequelize } = require('sequelize');

let sequelize;

// Railway can use different variable names for the MySQL connection string
const dbUrl = process.env.MYSQL_URL || process.env.MYSQL_PRIVATE_URL || process.env.MYSQL_PUBLIC_URL || process.env.DATABASE_URL;

if (dbUrl) {
  console.log('Using connection string (MYSQL_URL or similar)');
  sequelize = new Sequelize(dbUrl, {
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
