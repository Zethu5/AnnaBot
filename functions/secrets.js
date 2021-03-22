const fs = require('fs');
const got = require('got');

// get port from config file
const raw_data = fs.readFileSync('./config.json');
const { DEFAULT_PORT } = JSON.parse(raw_data);

// set secret api endpoint
const api_secret = `http://localhost:${DEFAULT_PORT}/api/secret`;

// get bot secret from db
async function secret_get() {
  const { body } = await got.get(api_secret, { responseType: 'json' });
  return body;
}

// exported functions
module.exports = {
  secret_get,
};
