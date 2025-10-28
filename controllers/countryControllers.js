require("dotenv").config();

const connectDB = require("../config/dbconfig");

const fs = require("fs");
const path = require("path");

const {
  fetchCountriesData,
  generateImage,
} = require("../services/countryServices");

let countriesData;
exports.fetchCountries = async (req, res) => {
  const connection = await connectDB();
  try {
    countriesData = await fetchCountriesData();

    const data = [];

    if (countriesData) {
      countriesData.map((country) => {
        const { name, capital, region, population, flag } = country;
        if (country.currencies) {
          const countryData = {
            name: name,
            capital: capital || null,
            region: region || null,
            population: population,
            currency_code: country.currencies[0].code,
            exchange_rate: country.currencies[0].rate || country.exchange_rate,
            estimated_gdp: country.estimated_gdp || null,
            flag_url: flag || null,
          };

          data.push(countryData);
        } else {
          const countryData = {
            name: name,
            capital: capital || null,
            region: region || null,
            population: population,
            currency_code: null,
            exchange_rate: null,
            estimated_gdp: 0,
            flag_url: flag || null,
          };

          data.push(countryData);
        }
      });
    }

    const placeholders = data.map(() => "(?, ?, ?, ?, ?, ?, ?, ?)").join(",");
    const values = data.flatMap((obj) => [
      obj.name,
      obj.capital,
      obj.region,
      obj.population,
      obj.currency_code,
      obj.exchange_rate,
      obj.estimated_gdp,
      obj.flag_url,
    ]);

    const query = `
INSERT INTO countries (
    name, capital, region, population, currency_code, 
    exchange_rate, estimated_gdp, flag_url
)
VALUES ${placeholders}
ON DUPLICATE KEY UPDATE
    capital = VALUES(capital),
    region = VALUES(region),
    population = VALUES(population),
    currency_code = VALUES(currency_code),
    exchange_rate = VALUES(exchange_rate),
    estimated_gdp = VALUES(estimated_gdp),
    flag_url = VALUES(flag_url);
`;

    const [result] = await connection.execute(query, values);

    if (result) {
      const [statsRows] = await connection.execute(
        `SELECT 
       COUNT(*) AS total_countries,
       MAX(last_refreshed_at) AS last_refresh
     FROM countries;`
      );

      // run top 5 GDP
      const [top5Rows] = await connection.execute(
        `SELECT name, estimated_gdp
     FROM countries
     ORDER BY estimated_gdp DESC
     LIMIT 5;`
      );

      const summary = {
        total_countries: statsRows[0].total_countries,
        last_refresh: statsRows[0].last_refresh,
        top_5_gdp: top5Rows,
      };

      generateImage(summary);
    }

    res.status(201).json({ data });
  } catch (error) {
    if (countriesData == -1) {
      res.status(503).json({
        error: "External data source unavailable",
        details: "Could not fetch data from rest countries api",
      });
    }

    if (countriesData == -2) {
      res.status(503).json({
        error: "External data source unavailable",
        details: "Could not fetch data from opener api",
      });
    }
    console.error("an error occured: ", error);
    res.status(500).json({ message: error.message });
  } finally {
    if (connection) connection.end();
  }
};

exports.getCountries = async (req, res) => {
  const connection = await connectDB();

  try {
    const query = req.query;
    const allowedParams = ["region", "currency", "sort"];

    const invalidParams = Object.keys(query).filter(
      (key) => !allowedParams.includes(key)
    );

    if (invalidParams.length > 0) {
      res.status(400).json({
        message: `Invalid query parameter detected: ${invalidParams.join(
          ", "
        )}.`,
      });
    }

    let { region = null, currency = null, sort } = query;
    let sortQuery = "";

    if (sort === "gdp_desc") sortQuery = "ORDER BY estimated_gdp DESC";
    if (sort === "gdp_asc") sortQuery = "ORDER BY estimated_gdp ASC";

    const dbQuery = `
      SELECT *
      FROM countries
      WHERE (? IS NULL OR region = ?)
        AND (? IS NULL OR currency_code = ?)
      ${sortQuery};
    `;

    const params = [region, region, currency, currency];
    const [result] = await connection.execute(dbQuery, params);
    res.status(200).json(result);
  } catch (error) {
    console.error("an error occured: ", error);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) connection.end();
  }
};

exports.getCountryByName = async (req, res) => {
  const countryName = req.params.name;
  const connection = await connectDB();

  try {
    const dbQuery = `SELECT * FROM countries WHERE name = ?`;
    const params = [countryName];
    const [result] = await connection.execute(dbQuery, params);
    if (result.length >= 1) {
      res.status(200).json(result);
    } else {
      res.status(404).json({ error: "Country not found" });
    }
  } catch (error) {
    console.error("an error occured: ", error);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) connection.end();
  }
};

exports.deleteCountry = async (req, res) => {
  const countryName = req.params.name;
  const connection = await connectDB();

  try {
    const dbQuery = `DELETE FROM countries WHERE name = ?`;
    const params = [countryName];
    const [result] = await connection.execute(dbQuery, params);
    if (result.affectedRows > 0) {
      res.status(200).json({ response: "Country deleted successfully" });
      console.log("");
    } else {
      res.status(404).json({ error: "Country not found" });
    }
  } catch (error) {
    console.error("an error occured: ", error);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) connection.end();
  }
};

exports.getStatus = async (req, res) => {
  const connection = await connectDB();

  try {
    const [rows] = await connection.execute(`
  SELECT 
    COUNT(*) AS total_countries,
    MAX(last_refreshed_at) AS last_refreshed_at
  FROM countries
`);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("an error occured: ", error);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) connection.end();
  }
};

exports.getGeneratedImage = async (req, res) => {
  const imagePath = path.join(__dirname, "/cache/summary.png");

  fs.readFile(imagePath, (err, data) => {
    if (err) {
      console.error("Error reading image: ", err);
      res.status(404).json({ error: "Summary image not found" });
    }

    res.setHeader("Content-Type", "image/png");
    res.send(data);
  });
};
