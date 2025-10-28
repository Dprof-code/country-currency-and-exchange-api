const axios = require("axios");

const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

let countriesData, countriesRateData, data;

exports.fetchCountriesData = async (req, res) => {
  try {
    const countriesResponse = await axios.get(
      " https://restcountries.com/v2/all?fields=name,capital,region,population,flag,currencies",
      {
        timeout: 5000,
      }
    );
    countriesData = countriesResponse.data;

    const countriesRateResponse = await axios.get(
      "https://open.er-api.com/v6/latest/USD",
      {
        timeout: 5000,
      }
    );
    countriesRateData = countriesRateResponse.data.rates;

    if (countriesData) {
      for (const country of countriesData) {
        Object.keys(countriesRateData).find((countryCode) => {
          if (country.currencies) {
            if (country.currencies[0].code === countryCode) {
              country.currencies[0].rate = countriesRateData[countryCode];
              country.estimated_gdp = computeEstimatedGDP(
                country.population,
                country.currencies[0].rate
              );
            }
          } else {
            country.exchange_rate = null;
          }
        });

        if (!country.hasOwnProperty("exchange_rate")) {
          country.exchange_rate = null;
        }
      }

      return countriesData;
    }
  } catch (error) {
    if (!countriesData) {
      return -1;
    }

    if (!countriesRateData) {
      return -2;
    }
    console.log("an error occured: ", error);
    return error;
  }
};

const computeEstimatedGDP = (population, exchangeRate) => {
  const randValue = Math.floor(Math.random() * (2000 - 1000) + 1000);
  return (population * randValue) / exchangeRate;
};

exports.generateImage = async (summary) => {
  const uploadDir = path.join(__dirname, "/cache");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
  }

  const formatGDP = (value) => {
    const num = parseFloat(value);
    if (num >= 1e12)
      return (
        (num / 1e12).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") +
        " Trillion"
      );
    if (num >= 1e9)
      return (
        (num / 1e9).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") +
        " Billion"
      );
    return num.toLocaleString();
  };

  try {
    const { total_countries, last_refresh, top_5_gdp } = summary;

    const lineItems = top_5_gdp.map(
      (item, i) => `${i + 1}. ${item.name}: ${formatGDP(item.estimated_gdp)}`
    );

    const lines = [
      `Total Countries: ${total_countries}`,
      `Last Refresh: ${new Date(last_refresh).toISOString()}`,
      `Top 5 GDP Countries:`,
      ...lineItems,
    ];

    const textBody = lines
      .map((line, i) => `<tspan x="20" dy="22">${line}</tspan>`)
      .join("");

    const svg = `
      <svg width="550" height="260" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#11285F"/>
        <text x="20" y="30" font-size="18" font-family="Arial" fill="white" font-weight="600">
          <tspan x="20" dy="0">Country Summary</tspan>
        </text>
        <text x="20" y="60" font-size="14" font-family="Arial" fill="white">
          ${textBody}
        </text>
      </svg>
    `;

    const filePath = path.join(uploadDir, "summary.png");

    await sharp(Buffer.from(svg)).png().toFile(filePath);

    console.log("✅ Image created:", filePath);
    return "summary.png";
  } catch (error) {
    console.error("❌ Image generation failed:", error);
  }
};
