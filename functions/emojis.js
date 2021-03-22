const fs = require('fs');
const got = require('got');

// get port from config file
const raw_data = fs.readFileSync('./config.json');
const { DEFAULT_PORT } = JSON.parse(raw_data);

// set emoji api endpoint
const api_emojis = `http://localhost:${DEFAULT_PORT}/api/emojis`;

// get emojis
async function emojis_get(type) {
  if (type) {
    const { body } = await got.get(`${api_emojis}/${type}`, {
      responseType: 'json',
    });

    return body;
  }

  const { body } = await got.get(api_emojis, { responseType: 'json' });
  return body;
}

// post emojis
async function emojis_post(payload) {
  await got.post(api_emojis, { json: payload, responseType: 'json' });
}

// delete emojis
async function emojis_delete(payload) {
  await got.delete(api_emojis, { json: payload, responseType: 'json' });
}

// used to check manually in server, not related to bot
async function server_emojis_get(msg) {
  console.log(
    msg.guild.emojis.cache.map((emoji) => ({ name: emoji.name, id: emoji.id }))
  );
}

// exported functions
module.exports = {
  emojis_get,
  emojis_post,
  emojis_delete,
  server_emojis_get,
};
