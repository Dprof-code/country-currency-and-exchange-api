require("dotenv").config();
const mysql = require("mysql2/promise");

const connectDB = async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.host,
      user: process.env.user,
      password: process.env.password,
      database: "country_db",
    });

    console.log("Connected to MySQL database!");
    return connection;
  } catch (error) {
    console.error("Error connecting to database:", error);
    throw error;
  }
};

module.exports = connectDB;
