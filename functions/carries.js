const fs = require('fs');
const got = require('got');

// get port from config file
const raw_data = fs.readFileSync('./config.json');
const { DEFAULT_PORT } = JSON.parse(raw_data);

// set secret api endpoint
const api_carries = `http://localhost:${DEFAULT_PORT}/api/carries`;

// get boss carries
async function carries_get(boss) {
  if (!boss) {
    const { body } = await got.get(api_carries, { responseType: 'json' });
    return body;
  }

  const { body } = await got.get(`${api_carries}/${boss}`, {
    responseType: 'json',
  });

  return body;
}

// post carries
async function carries_post(payload) {
  await got.post(api_carries, {
    json: payload,
    responseType: 'json',
  });
}

// check if a user exists in the carries
function carries_check_user_exists(carries, user_name) {
  const found = carries.find((carry) => carry.discord_name === user_name);
  return found ? true : false;
}

// combines boss carries and people with boss roles into a unique array
function carries_combiner(carries, users_with_role) {
  let combined_carries = [];
  let ids = [];
  let unique_carries = [];

  if (!carries) {
    combined_carries = [...users_with_role];
  } else if (!users_with_role) {
    combined_carries = [...carries];
  } else {
    combined_carries = [...carries, ...users_with_role];
  }

  combined_carries.forEach((carry) => {
    if (!ids.includes(carry.discord_id)) {
      unique_carries.push(carry);
      ids.push(carry.discord_id);
    }
  });

  return unique_carries;
}

// converts carries into a string
function carries_users_names_to_string(carries) {
  let player_names = '';
  carries.forEach((carry) => {
    player_names += carry.discord_name.replace(`\``, '') + ' ';
  });

  return player_names.replace(/ $/, '');
}

// delete carries [ single user / whole boss carries ]
async function carries_delete(payload) {
  const { boss, discord_name } = payload;

  if (discord_name) {
    await got.delete(`${api_carries}/${boss}/${discord_name}`, {
      responseType: 'json',
    });
  } else {
    await got.delete(`${api_carries}/${boss}`, {
      json: payload,
      responseType: 'json',
    });
  }
}

// exported functions
module.exports = {
  carries_get,
  carries_post,
  carries_delete,
  carries_combiner,
  carries_check_user_exists,
  carries_users_names_to_string,
};
