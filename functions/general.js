// get discord id of a username from carries list
function discord_user_id_get(carries, username) {
  let user = carries.find((carry) => carry.discord_name === username);
  return user.discord_id;
}

function discord_role_get(msg, role_name) {
  const role = msg.guild.roles.cache.find(
    (role_element) => role_element.name.toUpperCase() === role_name
  );

  return role;
}

// get all users with specific discord role name
function discord_users_by_role_get(msg, role) {
  const role_found = msg.guild.roles.cache.find(
    (role_element) => role_element.name.toUpperCase() === role
  );

  if (!role_found) {
    return null;
  }

  const role_users = msg.guild.roles.cache
    .get(role_found.id)
    .members.map((member) => ({
      discord_name: member.user.username,
      discord_id: member.id,
    }));

  return role_users;
}

// add commas to a number
function add_commas_to_number(number) {
  if (number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  return 0;
}

// check if it's the maplestory daily reset
function check_if_maplestory_daily_reset() {
  const current_utc_hour = new Date().getUTCHours();

  // 0 for UTC Midnight (00:00)
  if (current_utc_hour === 0) {
    return true;
  }

  return false;
}

// check if it's the maplestory weekly reset
function check_if_maplestory_weekly_reset() {
  const current_utc_hour = new Date().getUTCHours();
  const current_utc_day_in_week = new Date().getUTCDay();

  // 0 for UTC Midnight (00:00)
  // 4 for UTC Thursday
  if (current_utc_hour === 0 && current_utc_day_in_week === 4) {
    return true;
  }

  return false;
}

// capitalize words
function capitalize(string) {
  let splitStr = string.toLowerCase().split(' ');
  for (let i = 0; i < splitStr.length; i++) {
    // You do not need to check if i is larger than splitStr length, as your for does that for you
    // Assign it back to the array
    splitStr[i] =
      splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);
  }
  // Directly return the joined string
  return splitStr.join(' ');
}

function check_if_ursus_daily_reset_morning() {
  const current_utc_hour = new Date().getUTCHours();

  // 1 for UTC 4AM (04:XX) until 2 for UTC 5AM (05:XX)
  if (current_utc_hour >= 1 && current_utc_hour <= 2) {
    return true;
  }

  return false;
}

function check_if_ursus_daily_reset_evening() {
  const current_utc_hour = new Date().getUTCHours();

  // 18 for UTC 21PM (21:XX) until 19 for UTC 22PM (22:XX)
  if (current_utc_hour >= 18 && current_utc_hour <= 19) {
    return true;
  }

  return false;
}

// exported functions
module.exports = {
  discord_user_id_get,
  discord_role_get,
  discord_users_by_role_get,
  add_commas_to_number,
  check_if_maplestory_daily_reset,
  check_if_maplestory_weekly_reset,
  capitalize,
  check_if_ursus_daily_reset_morning,
  check_if_ursus_daily_reset_evening,
};
