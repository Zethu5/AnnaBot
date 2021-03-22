const fs = require('fs');
const got = require('got');

// get port from config file
const raw_data = fs.readFileSync('./config.json');
const { DEFAULT_PORT } = JSON.parse(raw_data);

// set bosses api endpoint
const api_bosses = `http://localhost:${DEFAULT_PORT}/api/bosses`;

// return array of bosses names
async function bosses_get() {
  const { body } = await got.get(api_bosses, { responseType: 'json' });
  const bosses = body.map((boss) => boss.name);
  return bosses;
}

// post new boss
async function bosses_post(name) {
  await got.post(api_bosses, { json: name, responseType: 'json' });
}

// delete existing boss
async function bosses_delete(name) {
  await got.delete(api_bosses, { json: name, responseType: 'json' });
}

// convert bosses names to string
function bosses_names_to_string(bosses) {
  const boss_names = bosses
    .map((boss) => `\`${boss}\` `)
    .toString()
    .replace(/,/g, '')
    .replace(/ $/, '');
  return boss_names;
}

// exported functions
module.exports = {
  bosses_get,
  bosses_post,
  bosses_delete,
  bosses_names_to_string,
};
