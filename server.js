require("dotenv").config();
const express = require("express");
const connectDB = require("./config/dbconfig");

const countryRoutes = require("./routes/countryRoutes");

const { getStatus } = require("./controllers/countryControllers");

const app = express();
const PORT = process.env.PORT;

const { notFound, errorHandler } = require("./middleware/errorMiddleware");

// Database connection
connectDB();

app.use(express.json());

app.use("/countries", countryRoutes);

app.get("/status", getStatus);

app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});

app.use(notFound);
app.use(errorHandler);
