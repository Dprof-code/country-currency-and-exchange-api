const express = require("express");

const {
  fetchCountries,
  getCountries,
  getCountryByName,
  deleteCountry,
  getGeneratedImage,
} = require("../controllers/countryControllers");

const router = express.Router();

//refresh countries
router.post("/refresh", fetchCountries);

//get all countries spporting filters
router.get("/", getCountries);

// get generated summary image
router.get("/image", getGeneratedImage);

// get country by name
router.get("/:name", getCountryByName);

// delete a country
router.delete("/:name", deleteCountry);

module.exports = router;
