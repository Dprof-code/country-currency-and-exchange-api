# Country Currency and Exchange API 🌍

## Overview
This is a robust RESTful API built with Node.js and Express that efficiently fetches comprehensive country data, including currency and exchange rates, from external sources. It persists this data in a MySQL database and provides powerful CRUD operations, filtering, and dynamic summary generation.

## Features
- **External Data Integration**: Fetches detailed country information from `restcountries.com` and real-time exchange rates from `open.er-api.com`.
- **MySQL Database**: Stores and manages country data efficiently using a MySQL relational database.
- **CRUD Operations**: Provides endpoints for creating (refreshing), reading (listing and by name), and deleting country records.
- **Data Filtering & Sorting**: Allows filtering countries by `region` and `currency`, and sorting by `estimated_gdp` in ascending or descending order.
- **Dynamic Image Generation**: Creates a summary image displaying total countries, last refresh timestamp, and top 5 countries by estimated GDP.
- **Robust Error Handling**: Implements middleware for effective error handling, including 404 Not Found and internal server errors.
- **Scalable Architecture**: Organized into controllers, services, routes, and middleware for maintainability and scalability.

## Getting Started
To get this project up and running on your local machine, follow these steps.

### Installation
1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/dprof-code/country-currency-and-exchange-api.git
    cd country-currency-and-exchange-api
    ```
2.  **Install Dependencies**:
    ```bash
    npm install
    ```
3.  **Database Setup**:
    *   Ensure you have a MySQL server running.
    *   Create a database named `country_db`. The application will handle table creation and updates on the first data refresh.

### Environment Variables
Create a `.env` file in the root directory of the project and provide the following variables:

```
PORT=8000
host=localhost
user=your_mysql_username
password=your_mysql_password
NODE_ENV=development
```

## API Documentation
### Base URL
`http://localhost:[PORT]` (e.g., `http://localhost:8000`)

### Endpoints
#### `POST /countries/refresh`
**Description**: Fetches the latest country data and exchange rates from external APIs, then updates or inserts the data into the database. Also triggers the generation of a summary image.

**Request**:
No request body required.

**Response**:
`201 Created`
```json
{
  "data": [
    {
      "name": "United States",
      "capital": "Washington, D.C.",
      "region": "Americas",
      "population": 323947000,
      "currency_code": "USD",
      "exchange_rate": 1,
      "estimated_gdp": 2.00e+13,
      "flag_url": "https://restcountries.com/data/usa.svg"
    }
    // ... more country objects
  ]
}
```

**Errors**:
- `503 Service Unavailable`: External data source (e.g., Rest Countries API or Open ER API) is unreachable or returns an error.
  ```json
  {
    "error": "External data source unavailable",
    "details": "Could not fetch data from rest countries api"
  }
  ```
- `500 Internal Server Error`: An unexpected server error occurred.

#### `GET /countries`
**Description**: Retrieves a list of countries. Supports optional filtering by `region`, `currency`, and sorting by `estimated_gdp`.

**Request**:
Query parameters can be used:
- `region`: (Optional) Filter countries by region (e.g., `?region=Asia`).
- `currency`: (Optional) Filter countries by currency code (e.g., `?currency=USD`).
- `sort`: (Optional) Sort by estimated GDP.
  - `gdp_desc`: Sort by GDP in descending order.
  - `gdp_asc`: Sort by GDP in ascending order.

**Example**: `GET /countries?region=Europe&sort=gdp_desc`

**Response**:
`200 OK`
```json
[
  {
    "id": 1,
    "name": "Germany",
    "capital": "Berlin",
    "region": "Europe",
    "population": 82695000,
    "currency_code": "EUR",
    "exchange_rate": 0.92,
    "estimated_gdp": 4.56e+12,
    "flag_url": "https://restcountries.com/data/deu.svg",
    "last_refreshed_at": "2024-07-20T10:00:00.000Z"
  }
  // ... more country objects
]
```

**Errors**:
- `400 Bad Request`: Invalid query parameters were provided.
  ```json
  {
    "message": "Invalid query parameter detected: invalidParam. "
  }
  ```
- `500 Internal Server Error`: An unexpected server error occurred.

#### `GET /countries/image`
**Description**: Serves the dynamically generated summary image (a PNG file) containing statistics like total countries, last refresh, and top GDP countries.

**Request**:
No request body required.

**Response**:
`200 OK` with `Content-Type: image/png` in the headers. The response body will be the binary image data.

**Errors**:
- `404 Not Found`: The summary image could not be found, possibly because `POST /countries/refresh` has not been called yet.
  ```json
  {
    "error": "Summary image not found"
  }
  ```
- `500 Internal Server Error`: An unexpected server error occurred.

#### `GET /countries/:name`
**Description**: Retrieves detailed information for a specific country by its name.

**Request**:
Path parameter `name`: The full name of the country (e.g., `Germany`).

**Example**: `GET /countries/United%20States`

**Response**:
`200 OK`
```json
[
  {
    "id": 1,
    "name": "United States",
    "capital": "Washington, D.C.",
    "region": "Americas",
    "population": 323947000,
    "currency_code": "USD",
    "exchange_rate": 1,
    "estimated_gdp": 2.00e+13,
    "flag_url": "https://restcountries.com/data/usa.svg",
    "last_refreshed_at": "2024-07-20T10:00:00.000Z"
  }
]
```

**Errors**:
- `404 Not Found`: The specified country was not found in the database.
  ```json
  {
    "error": "Country not found"
  }
  ```
- `500 Internal Server Error`: An unexpected server error occurred.

#### `DELETE /countries/:name`
**Description**: Deletes a country record from the database by its name.

**Request**:
Path parameter `name`: The full name of the country to delete (e.g., `Canada`).

**Example**: `DELETE /countries/Canada`

**Response**:
`200 OK`
```json
{
  "response": "Country deleted successfully"
}
```

**Errors**:
- `404 Not Found`: The specified country was not found in the database.
  ```json
  {
    "error": "Country not found"
  }
  ```
- `500 Internal Server Error`: An unexpected server error occurred.

#### `GET /status`
**Description**: Provides a quick overview of the database status, including the total number of countries and the timestamp of the last data refresh.

**Request**:
No request body required.

**Response**:
`200 OK`
```json
{
  "total_countries": 250,
  "last_refreshed": "2024-07-20T10:00:00.000Z"
}
```

**Errors**:
- `500 Internal Server Error`: An unexpected server error occurred.

## Usage
Once the API is running, you can interact with it using tools like Postman, Insomnia, or `curl`.

1.  **Start the Server**:
    ```bash
    npm start
    ```
    The server will typically run on `http://localhost:8000` (or your configured `PORT`).

2.  **Refresh Country Data**:
    To populate your database with initial data or update existing data, send a `POST` request:
    ```bash
    curl -X POST http://localhost:8000/countries/refresh
    ```

3.  **View All Countries**:
    Retrieve a list of all countries:
    ```bash
    curl http://localhost:8000/countries
    ```

4.  **Filter and Sort Countries**:
    Get countries in Europe, sorted by GDP descending:
    ```bash
    curl "http://localhost:8000/countries?region=Europe&sort=gdp_desc"
    ```
    Get countries using USD currency:
    ```bash
    curl "http://localhost:8000/countries?currency=USD"
    ```

5.  **Get a Specific Country**:
    Retrieve data for a country by its name (ensure proper URL encoding for names with spaces):
    ```bash
    curl http://localhost:8000/countries/Germany
    # For names with spaces:
    curl http://localhost:8000/countries/United%20States
    ```

6.  **Delete a Country**:
    Remove a country record from the database:
    ```bash
    curl -X DELETE http://localhost:8000/countries/Canada
    ```

7.  **Check API Status**:
    Get a summary of total countries and last refresh timestamp:
    ```bash
    curl http://localhost:8000/status
    ```

8.  **Retrieve Summary Image**:
    Access the generated image summarizing country statistics:
    ```bash
    curl http://localhost:8000/countries/image --output summary.png
    ```
    This will save the image to `summary.png` in your current directory.

## Technologies Used

| Technology  | Version    | Description                                            |
| :---------- | :--------- | :----------------------------------------------------- |
| Node.js     | ^18.x      | JavaScript runtime environment                         |
| Express.js  | ^5.1.0     | Web framework for Node.js                              |
| MySQL2      | ^3.15.3    | Async MySQL driver for Node.js                         |
| Axios       | ^1.12.2    | Promise-based HTTP client for the browser and Node.js  |
| Dotenv      | ^17.2.3    | Loads environment variables from a `.env` file         |
| Nodemon     | ^3.1.10    | Auto-restarts the Node.js application during development |
| Sharp       | ^0.34.4    | High-performance Node.js image processing              |

## Contributing
We welcome contributions to this project! If you'd like to contribute, please follow these guidelines:

1.  ✨ **Fork the repository**: Start by forking the project to your GitHub account.
2.  🌱 **Create a new branch**: For each new feature or bug fix, create a dedicated branch.
    ```bash
    git checkout -b feature/your-feature-name
    ```
3.  💻 **Make your changes**: Implement your features or fixes in your new branch.
4.  🧪 **Test your changes**: Ensure your code works as expected and doesn't introduce new issues.
5.  ⬆️ **Commit your changes**: Write clear and concise commit messages.
    ```bash
    git commit -m "feat: Add new country filtering option"
    ```
6.  🚀 **Push to your fork**: Push your changes to your forked repository.
    ```bash
    git push origin feature/your-feature-name
    ```
7.  ✉️ **Open a Pull Request**: Submit a pull request to the `main` branch of the original repository, describing your changes in detail.

## License
This project is licensed under the ISC License. See the `package.json` for details.

## Author Info
**Adedamola Olawale Abraham**
*   Twitter: https://x.com/pr0devs
*   Portfolio: https://prodevx.site

---
[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-5.x-blue.svg)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-DB-blue.svg)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Readme was generated by Dokugen](https://img.shields.io/badge/Readme%20was%20generated%20by-Dokugen-brightgreen)](https://www.npmjs.com/package/dokugen)