const fs = require('fs');
const got = require('got');
const Discord = require('discord.js');

// get port from config file
const raw_data = fs.readFileSync('./config.json');
const { DEFAULT_PORT } = JSON.parse(raw_data);

// set quests api endpoint
const api_quests = `http://localhost:${DEFAULT_PORT}/api/quests`;

const {
  emojis_get,
  emojis_post,
  emojis_delete,
  server_emojis_get,
} = require('./emojis');

const {
  discord_user_id_get,
  discord_role_get,
  discord_users_by_role_get,
  add_commas_to_number,
  check_if_maplestory_daily_reset,
  check_if_maplestory_weekly_reset,
  capitalize,
  check_if_ursus_daily_reset_morning,
  check_if_ursus_daily_reset_evening,
} = require('./general');

const { mvp_data_get } = require('./data');

const { secret_get } = require('./secrets');

const {
  daily_type,
  weekly_type,
  ursus_type,
  general_channel_id_used,
  ursus_image_url,
  ursus_role_name,
  mvp_channel_id_used,
  mvp_type,
  quests_discord_channel_id_used,
} = require('../config.json');

// set discord client
const client = new Discord.Client();

secret_get().then((body) => {
  const { token } = body;
  client.login(token);
});

// get quests
async function quests_get() {
  const { body } = await got.get(api_quests, { responseType: 'json' });
  return body;
}

// post quests
async function quests_post(payload) {
  await got.post(api_quests, { json: payload, responseType: 'json' });
}

// delete quests
async function quests_delete(payload) {
  await got.delete(api_quests, { json: payload, responseType: 'json' });
}

// deletes the dailies/weeklies quests from discord
async function quests_delete_from_discord(client, quest) {
  const { channel_id, id } = quest;
  let quest_to_delete = await client.channels.cache
    .get(channel_id)
    .messages.fetch({ around: id, limit: 1 });

  quest_to_delete = quest_to_delete.get(id);
  if (quest.type != ursus_type) {
    await quest_to_delete.delete(); // delete from discord
  }

  await quests_delete(quest); // delete from db
}

// sends new daily
async function quests_send_to_discord(msg_channel_id, type) {
  const emojis = await emojis_get(type);
  let reply;

  if (type === daily_type) {
    reply = new Discord.MessageEmbed()
      .setColor('#0099ff')
      .addField(
        `${type.toString().toUpperCase()} Quest`,
        new Date().toDateString().replace(/\d+$/, '')
      );
  } else if (type === weekly_type) {
    let now = new Date();
    let later = new Date();
    later = later.setDate(now.getDate() + 7);
    later = new Date(later);

    reply = new Discord.MessageEmbed()
      .setColor('#0099ff')
      .addField(
        `${type.toString().toUpperCase()} Quest`,
        `${now
          .toDateString()
          .replace(/\d+$/, '')} - ${later.toDateString().replace(/\d+$/, '')}`
      );
  } else if (type === ursus_type) {
    reply = new Discord.MessageEmbed()
      .setColor('#0099ff')
      .addField(
        `${type.toString().toUpperCase()} Double Money Time!`,
        'Ursus double money time is now active for 2 hours'
      )
      .setThumbnail(ursus_image_url);
  } else if (type === mvp_type) {
    const data = await mvp_data_get();

    reply = new Discord.MessageEmbed()
      .setColor('#0099ff')
      .setTitle(`💎 MVPS - ${data.date_today.day}.${data.date_today.month}`);
    let teleportTo;

    // careful of 'count' instead of 'Count' - capital letters
    if (data.Count > 0) {
      data.value.forEach((record) => {
        if (record.location != 'RESET' && record.location != 'NEW DAY') {
          if (!record.teleportTo) {
            teleportTo = '🚫';
          } else {
            teleportTo = record.teleportTo;
          }

          reply.addField(
            `🕒 *${record.time}*`,
            `\`${record.location}\` | \`${teleportTo}\``
          );
        } else {
          if (record.location === 'RESET') {
            reply.addField(
              `🔄 *${record.time} - RESET*`,
              '`-----------------------------`'
            );
          } else {
            reply.addField(
              `🔄 *NEW DAY - ${data.date_tomorrow.day}.${data.date_tomorrow.month}*`,
              '`-----------------------------`'
            );
          }
        }
      });
    } else {
      reply.addField('No mvps 😔', 'feels bad man...');
    }
  }

  // TODO: fix error: UnhandledPromiseRejectionWarning: TypeError: Cannot read property 'send' of undefined
  temp = await client.channels.cache.get(msg_channel_id).send(reply);
  const ursus_role = discord_role_get(temp, ursus_role_name);

  if (type === ursus_type) {
    await client.channels.cache
      .get(msg_channel_id)
      .send(`<@&${ursus_role.id}>`);
  }

  await quests_post({
    id: temp.id,
    channel_id: temp.channel.id,
    type: type,
    timestamp: Date.now(),
  });

  emojis.forEach(async (emoji) => {
    await temp.react(emoji.id);
  });
}

// check if quest exists
function quest_exists(quests, type) {
  let quest_to_return = quests.find((quest) => quest.type === type);
  return quest_to_return;
}

// manages all daily/weekly quests (send/delete)
async function quests_manager(client) {
  const quests = await quests_get();

  // Daily quests
  if (check_if_maplestory_daily_reset()) {
    let quest = quest_exists(quests, daily_type);
    // 7200000 At least two hours passed
    if (quest) {
      if (Date.now() - quest.timestamp >= 7200000) {
        await quests_delete_from_discord(client, quest);
        await quests_send_to_discord(
          quests_discord_channel_id_used,
          daily_type
        );
      }
    } else {
      await quests_send_to_discord(quests_discord_channel_id_used, daily_type);
    }
  }

  // Weekly quests
  if (check_if_maplestory_weekly_reset()) {
    let quest = quest_exists(quests, weekly_type);
    if (quest) {
      // 7200000 At least two hours passed
      if (Date.now() - quest.timestamp >= 7200000) {
        await quests_delete_from_discord(client, quest);
        await quests_send_to_discord(
          quests_discord_channel_id_used,
          weekly_type
        );
      }
    } else {
      await quests_send_to_discord(quests_discord_channel_id_used, weekly_type);
    }
  }

  // Ursus quest
  if (
    check_if_ursus_daily_reset_morning() ||
    check_if_ursus_daily_reset_evening()
  ) {
    let quest = quest_exists(quests, ursus_type);
    if (quest) {
      // 10800000 At least three hours passed
      if (Date.now() - quest.timestamp >= 10800000) {
        await quests_delete_from_discord(client, quest);
        await quests_send_to_discord(general_channel_id_used, ursus_type);
      }
    } else {
      await quests_send_to_discord(general_channel_id_used, ursus_type);
    }
  }

  /* ========= DISABLED UNTIL WE CAN GET DATA =========
  // MVP quest
  let quest = quest_exists(quests, mvp_type);
  if (quest) {
    // 300000 At least 5 minutes passed
    if (Date.now() - quest.timestamp >= 300000) {
      await quests_delete_from_discord(client, quest);
      await quests_send_to_discord(mvp_channel_id_used, mvp_type);
    }
  } else {
    await quests_send_to_discord(mvp_channel_id_used, mvp_type);
  }
  */
}

// exported functions
module.exports = {
  quests_get,
  quests_post,
  quests_delete,
  quests_delete_from_discord,
  quests_send_to_discord,
  quest_exists,
  quests_manager,
};
