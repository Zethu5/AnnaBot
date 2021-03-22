// module exports
const Discord = require('discord.js');
const express = require('express');
const cheerio = require('cheerio');
const got = require('got');
const fs = require('fs');

// connect to DB
const connectMongoDB = require('./MongoDB/Connection');
connectMongoDB();

// secret functions
const { secret_get } = require('./functions/secrets');

// bosses functions
const {
  bosses_get,
  bosses_post,
  bosses_delete,
  bosses_names_to_string,
} = require('./functions/bosses');

// carries functions
const {
  carries_get,
  carries_post,
  carries_delete,
  carries_combiner,
  carries_check_user_exists,
  carries_users_names_to_string,
} = require('./functions/carries');

// emojis functions
const {
  emojis_get,
  emojis_post,
  emojis_delete,
  server_emojis_get,
} = require('./functions/emojis');

// general functions
const {
  discord_user_id_get,
  discord_users_by_role_get,
  add_commas_to_number,
  check_if_maplestory_daily_reset,
  check_if_maplestory_weekly_reset,
  capitalize,
} = require('./functions/general');

// data functions
const {
  maplestory_gg_players_data_get,
  maple_wiki_item_data_get,
  ban_data_get,
  mvp_data_get,
  links_data_get,
} = require('./functions/data');

// messages functions
const {
  quests_get,
  quests_post,
  quests_delete,
  quests_delete_from_discord,
  quests_send_to_discord,
  quest_exists,
  quests_manager,
} = require('./functions/quests');

// variables
const config_raw_data = fs.readFileSync('config.json');
const {
  DEFAULT_PORT,
  quests_check_interval_minutes,
  server_id_used,
  quests_discord_channel_id_used,
  gay_commander,
  gay_commander_image_url,
  gay_commander_thumbnail_url,
} = JSON.parse(config_raw_data);

// regex expressions
const regex_prefix = new RegExp(/^!c/);
const regex_carry_help = new RegExp(/^!chelp$/);
const regex_carry_join = new RegExp(/^!cjoin\s+\w+$/);
const regex_carry = new RegExp(/^!carry\s+\w+$/);
const regex_carry_remove = new RegExp(/^!cremove\s+.+\s+.+/);
const regex_carry_list = new RegExp(/^!clist$/);
const regex_boss_add = new RegExp(/^!cboss\s+add\s+.+$/);
const regex_boss_remove = new RegExp(/^!cboss\s+remove\s+.+$/);
const regex_boss_list = new RegExp(/^!cboss\s+list$/);
const regex_player_data_get = new RegExp(/^!cuser\s+(gms|ems)\s+.+$/);
const regex_emoji_check = new RegExp(/^!cemojicheck/);
const regex_emoji_add = new RegExp(/^!cemoji\s+add\s+.+\s+(daily|weekly)$/);
const regex_emoji_remove = new RegExp(/^!cemoji\s+remove\s+.+$/);
const regex_item_data_get = new RegExp(/^!citem\s+.+$/);
const regex_banned_info_get = new RegExp(/^!cbanned$/);
const regex_links_legion_info_get = new RegExp(/^!clls\s+(\w+\s?)+/);
const regex_test = new RegExp(/^!ctest$/);

const app = express();
app.use('/api/carries', require('./API/Carry'));
app.use('/api/secret', require('./API/Secret'));
app.use('/api/bosses', require('./API/boss'));
app.use('/api/emojis', require('./API/Emoji'));
app.use('/api/quests', require('./API/Quest'));
app.listen(DEFAULT_PORT);

const client = new Discord.Client();

(async () => {
  client.on('ready', async () => {
    console.log('[AnnaBot] Online');

    setInterval(async function () {
      quests_manager(client);
    }, quests_check_interval_minutes * 60 * 1000);
  });

  client.on('message', async (msg) => {
    if (msg.guild && msg.guild.id === server_id_used) {
      const msg_user_name = msg.author.username;
      const msg_user_id = msg.author.id;
      const msg_channel_id = msg.channel.id;
      const msg_text = msg.toString();

      try {
        msg_user_has_admin = msg.member.guild.me.hasPermission('ADMINISTRATOR');
      } catch {
        msg_user_has_admin = false;
      }

      if (msg_text.match(regex_carry_help)) {
        let reply = new Discord.MessageEmbed()
          .setColor('#0099ff')
          .addField('*Join Carry*', '`!cjoin <boss_name>`')
          .addField('*Carry boss*', '`!carry <boss_name>`')
          .addField('*List Carries*', '`!clist`')
          .addField('*List Bosses*', '`!cboss list`');

        if (msg_user_has_admin) {
          reply
            .addField(
              '*Add boss to list [Admin only]*',
              '`!cboss add <boss_name>`'
            )
            .addField(
              '*Remove boss and it`s carries from list [Admin only]*',
              '`!cboss remove <boss_name>`'
            )
            .addField(
              '*Remove user from carry [Admin only]*',
              '`!cremove <boss_name> <user_name>`'
            );
        }

        if (msg_user_has_admin) {
          reply
            .addField(
              '*Add emojis for daily/weekly quests [Admin only]*',
              '`!cemoji add <emoji_name> [daily|weekly]`'
            )
            .addField(
              '*Remove emojis from daily/weekly quests [Admin only]*',
              '`!cemoji remove <emoji_name>`'
            );
        }
        reply
          .addField(
            'Check user stats (`gms` for global, `ems` for europe)',
            '`!cuser [gms|ems] <username>`'
          )
          .addField('*Find maplestory item*', '`!citem <item_name>`')
          .addField('*Get most recent maplestory bans*', '`!cbanned`')
          .addField('*Help*', '`!chelp`')
          .setFooter('* Report any bugs/new ideas to Zethus');
        client.channels.cache.get(msg_channel_id).send(reply);
      } else if (msg_text.match(regex_carry_join)) {
        const boss = msg_text.split(/\s+/)[1].toString().toUpperCase();
        const bosses = await bosses_get();
        const carries = await carries_get(boss);

        if (bosses.includes(boss)) {
          if (carries_check_user_exists(carries, msg_user_name)) {
            const reply = new Discord.MessageEmbed()
              .setColor('#0099ff')
              .addField(
                `\`${msg_user_name}\` already in \`${boss}\` participents: `,
                `${carries_users_names_to_string(carries)}`
              );
            client.channels.cache.get(msg_channel_id).send(reply);
          } else {
            await carries_post({
              boss: boss,
              discord_name: msg_user_name,
              discord_id: msg_user_id,
            });

            const reply = new Discord.MessageEmbed()
              .setColor('#0099ff')
              .addField(`${msg_user_name} joined:`, `\`${boss}\``)
              .addField(
                `Current \`${boss}\` participents: `,
                `${carries_users_names_to_string(carries)} \`${msg_user_name}\``
              );
            client.channels.cache.get(msg_channel_id).send(reply);
          }
        } else {
          const reply = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .addField('boss not found', `No such boss: \`${boss}\``)
            .addField(
              'Bosses available: ',
              `${bosses_names_to_string(bosses)}`
            );
          client.channels.cache.get(msg_channel_id).send(reply);
        }
      } else if (msg_text.match(regex_carry_remove)) {
        const boss = msg_text.split(/\s+/)[1].toString().toUpperCase();
        const username = msg_text.split(/\s+/)[2].toString();
        const bosses = await bosses_get();
        const carries = await carries_get(boss);

        // if no player stated remove self
        if (username.length == 0) {
          username = msg_user_name;
        }

        if (bosses.includes(boss)) {
          if (carries_check_user_exists(carries, username)) {
            if (msg_user_has_admin) {
              let payload = {
                boss: boss,
                discord_name: username,
              };

              await carries_delete(payload);
              let reply = new Discord.MessageEmbed()
                .setColor('#0099ff')
                .addField(
                  'Carry',
                  `\`${username}\` was removed from: \`${boss}\``
                );
              client.channels.cache.get(msg_channel_id).send(reply);

              reply = new Discord.MessageEmbed()
                .setColor('#0099ff')
                .addField(
                  'Carry',
                  `You were removed from the \`${boss}\` carry by \`${msg_user_name}\``
                );

              const user_id = discord_user_id_get(carries, username);
              client.users.cache.get(user_id).send(reply);
            } else {
              let reply = new Discord.MessageEmbed()
                .setColor('#0099ff')
                .addField(
                  'Permission Error',
                  'You are not an administrator in this discord'
                );
              client.channels.cache.get(msg_channel_id).send(reply);
            }
          } else {
            let reply = new Discord.MessageEmbed()
              .setColor('#0099ff')
              .addField(
                `\`${username}\` was not found in the \`${boss}\` participents:`,
                `${carries_users_names_to_string(carries)}`
              );
            client.channels.cache.get(msg_channel_id).send(reply);
          }
        } else {
          const reply = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .addField('boss not found', `No such boss: \`${boss}\``)
            .addField(
              'Bosses available: ',
              `${bosses_names_to_string(bosses)}`
            );
          client.channels.cache.get(msg_channel_id).send(reply);
        }
      } else if (msg_text.match(regex_carry)) {
        const boss = msg_text.split(/\s+/)[1].toString().toUpperCase();
        const bosses = await bosses_get();
        const carries = await carries_get(boss);
        const role_users = await discord_users_by_role_get(msg, boss);
        const carries_combined = carries_combiner(carries, role_users);

        if (bosses.includes(boss)) {
          if (carries_combined.length > 0) {
            let reply = new Discord.MessageEmbed()
              .setColor('#0099ff')
              .addField('Carry', `${msg_user_name} is carrying: \`${boss}\``)
              .addField(
                'Sending messages to: ',
                `\`${carries_users_names_to_string(carries_combined)}\``
              );
            client.channels.cache.get(msg_channel_id).send(reply);

            reply = new Discord.MessageEmbed()
              .setColor('#0099ff')
              .addField(
                'Carry',
                `\`${msg_user_name}\` is carrying: \`${boss}\`, join the discord!`
              );

            carries_combined.forEach((carry) => {
              client.users.cache
                .get(carry.discord_id)
                .send(reply)
                .catch((error) => {
                  null; // Dont do anything on error - fuck it
                });
            });

            let payload = { boss: boss };
            await carries_delete(payload);
          } else {
            let reply = new Discord.MessageEmbed()
              .setColor('#0099ff')
              .addField('Carry', `No one registered for: \`${boss}\``);
            client.channels.cache.get(msg_channel_id).send(reply);
          }
        } else {
          const reply = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .addField('boss not found', `No such boss: \`${boss}\``)
            .addField(
              'Bosses available: ',
              `${bosses_names_to_string(bosses)}`
            );
          client.channels.cache.get(msg_channel_id).send(reply);
        }
      } else if (msg_text.match(regex_carry_list)) {
        const carries = await carries_get();

        if (carries.length > 0) {
          const bosses = await bosses_get();
          let people_in_same_party = '';
          let found_people;
          let reply = new Discord.MessageEmbed().setColor('#0099ff');

          bosses.forEach((boss) => {
            found_people = false;
            people_in_same_party = '';
            carries.forEach((carry) => {
              if (carry.boss === boss) {
                found_people = true;
                people_in_same_party += `\`${carry.discord_name}\` `;
              }
            });

            if (found_people) {
              people_in_same_party = people_in_same_party.replace(/, $/, '');
              reply.addField(
                `\`${boss}\` carry participents: `,
                people_in_same_party
              );
            }
          });

          client.channels.cache.get(msg_channel_id).send(reply);
        } else {
          const reply = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .addField('Carries', 'No carry requests found');
          client.channels.cache.get(msg_channel_id).send(reply);
        }
      } else if (msg_text.match(regex_boss_add)) {
        let bosses = await bosses_get();
        const boss = msg_text.split(/\s+/)[2].toString().toUpperCase();
        let bosses_names = bosses_names_to_string(bosses);

        if (msg_user_has_admin) {
          if (bosses.includes(boss)) {
            const reply = new Discord.MessageEmbed()
              .setColor('#0099ff')
              .addField(`\`${boss}\` already exists, bosses:`, bosses_names);
            client.channels.cache.get(msg_channel_id).send(reply);
          } else {
            await bosses_post({ name: boss });
            bosses = await bosses_get();
            bosses_names = bosses_names_to_string(bosses);
            const reply = new Discord.MessageEmbed()
              .setColor('#0099ff')
              .addField(
                `\`${boss}\` was added to the bosses list:`,
                bosses_names
              );
            client.channels.cache.get(msg_channel_id).send(reply);
          }
        } else {
          let reply = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .addField(
              'Permission Error',
              'You are not an administrator in this discord'
            );
          client.channels.cache.get(msg_channel_id).send(reply);
        }
      } else if (msg_text.match(regex_boss_remove)) {
        let bosses = await bosses_get();
        const boss = msg_text.split(/\s+/)[2].toString().toUpperCase();
        let bosses_names = bosses_names_to_string(bosses);

        if (msg_user_has_admin) {
          if (!bosses.includes(boss)) {
            const reply = new Discord.MessageEmbed()
              .setColor('#0099ff')
              .addField(`\`${boss}\` doesn't exist, bosses:`, bosses_names);
            client.channels.cache.get(msg_channel_id).send(reply);
          } else {
            await bosses_delete({ name: boss });
            bosses = await bosses_get();
            bosses_names = bosses_names_to_string(bosses);
            await carries_delete({ boss: boss });
            const reply = new Discord.MessageEmbed()
              .setColor('#0099ff')
              .addField(
                `\`${boss}\` and all its carries was removed from the list:`,
                bosses_names
              );
            client.channels.cache.get(msg_channel_id).send(reply);
          }
        } else {
          let reply = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .addField(
              'Permission Error',
              'You are not an administrator in this discord'
            );
          client.channels.cache.get(msg_channel_id).send(reply);
        }
      } else if (msg_text.match(regex_boss_list)) {
        const bosses = await bosses_get();
        const bosses_names = bosses_names_to_string(bosses);

        let reply = new Discord.MessageEmbed()
          .setColor('#0099ff')
          .addField('Bosses:', bosses_names);
        client.channels.cache.get(msg_channel_id).send(reply);
      } else if (msg_text.match(regex_player_data_get)) {
        const region = msg_text.split(/\s+/)[1].toString();
        const username_to_search = msg_text.split(/\s+/)[2].toString();

        let player_data = await maplestory_gg_players_data_get(
          region,
          username_to_search
        );

        if (player_data) {
          let reply = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle(player_data.Name)
            .setURL(player_data.url)
            .addField('Name:', player_data.Name, true)
            .addField(
              'Level:',
              `${player_data.Level} (${player_data.EXPPercent}%)`,
              true
            )
            .addField('Class:', player_data.Class, true)
            .addField(
              'Legion Level:',
              add_commas_to_number(player_data.LegionLevel),
              true
            )
            .addField(
              'Legion Coins Per Day:',
              add_commas_to_number(player_data.LegionCoinsPerDay),
              true
            )
            .addField(
              'Legion Power:',
              add_commas_to_number(player_data.LegionPower),
              true
            )
            .addField('Legion Rank', player_data.LegionRank, true)
            .addField('Server:', player_data.Server, true)
            .addField(
              'Server Ranking:',
              add_commas_to_number(player_data.ServerRank),
              true
            )
            .addField(
              'Class Rank:',
              add_commas_to_number(player_data.ClassRank),
              true
            )
            .addField(
              'Server Class Ranking:',
              add_commas_to_number(player_data.ServerClassRanking),
              true
            )
            .addField(
              'Global Ranking:',
              add_commas_to_number(player_data.GlobalRanking),
              true
            )
            .setThumbnail(player_data.CharacterImageURL);

          client.channels.cache.get(msg_channel_id).send(reply);
        } else if (username_to_search === gay_commander) {
          let reply = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle(gay_commander)
            .setURL(gay_commander_image_url)
            .addField('name:', gay_commander, true)
            .addField('Level:', 'Gay', true)
            .addField('Class:', 'Gay Commander', true)
            .addField('Legion Level:', 'Fucking garbage', true)
            .addField('Legion Rank', 'trash', true)
            .addField('Server:', 'Reboot (NA) unfortunately...', true)
            .addField('Server Ranking:', '0', true)
            .addField('Class Rank:', '0', true)
            .addField('Global Ranking:', '0', true)
            .setThumbnail(gay_commander_thumbnail_url);

          client.channels.cache.get(msg_channel_id).send(reply);
        } else {
          let reply = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .addField('No player found matching the name: ', username_to_search)
            .setFooter('Off-ranks players will not be found!');
          client.channels.cache.get(msg_channel_id).send(reply);
        }
        // here for manual check of emojis
      } else if (msg_text.match(regex_emoji_check)) {
        server_emojis_get(msg);
      } else if (msg_text.match(regex_emoji_add)) {
        const emoji_name = msg_text.split(/\s+/)[2].toString();
        const emoji_time = msg_text.split(/\s+/)[3].toString();
        const emoji = await client.emojis.cache.find(
          (e) => e.name === emoji_name
        );
        const emojis = await emojis_get();
        const emojis_names = emojis.map((m) => m.name);

        if (emoji) {
          if (emojis_names.includes(emoji_name)) {
            let reply = new Discord.MessageEmbed()
              .setColor('#0099ff')
              .addField(
                'Emoji already exists',
                'reacting with it to this message'
              );

            let temp = await client.channels.cache
              .get(msg_channel_id)
              .send(reply);

            await temp.react(emoji.id);
          } else {
            await emojis_post({
              name: emoji.name,
              id: emoji.id,
              time: emoji_time,
            });

            let reply = new Discord.MessageEmbed()
              .setColor('#0099ff')
              .addField(
                `${emoji_time} emoji added!`,
                'Reacting with it to this message'
              );

            let temp = await client.channels.cache
              .get(msg_channel_id)
              .send(reply);
            await temp.react(emoji.id);
          }
        } else {
          let reply = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .addField('No such emoji:', emoji_name);

          await client.channels.cache.get(msg_channel_id).send(reply);
        }
      } else if (msg_text.match(regex_emoji_remove)) {
        const emoji_name = msg_text.split(/\s+/)[2].toString();
        const emojis = await emojis_get();
        const emojis_names = emojis.map((m) => m.name);

        if (emojis_names.includes(emoji_name)) {
          const emoji = emojis.find((e) => e.name === emoji_name);

          let payload = {
            name: emoji.name,
            id: emoji.id,
            time: emoji.time,
          };

          await emojis_delete(payload);

          let reply = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .addField(`${emoji.time} emoji removed:`, `\`${emoji.name}\``);

          await client.channels.cache.get(msg_channel_id).send(reply);
        } else {
          let reply = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .addField(`${emoji_name} emoji doesn\`t exist`, 'Nothing to do');

          await client.channels.cache.get(msg_channel_id).send(reply);
        }
      } else if (msg_text.match(regex_item_data_get)) {
        let tmp_name = msg_text.replace(/\w+\s+/, '').replace(/\W/, '');
        let item_name = '';
        let item_capitalized = '';

        tmp_name.split(/\s+/).forEach((word) => {
          item_name += `${capitalize(word)} `;
          item_capitalized += `${capitalize(word)} `;
        });

        item_name = item_name.replace(/\s+$/, '').replace(/\s+/g, '_');
        const item_data = await maple_wiki_item_data_get(item_name);

        if (item_data) {
          let reply = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle(item_capitalized)
            .setURL(item_data.item_url)
            .addField('Stats:', item_data.item_string)
            .setThumbnail(item_data.item_picture_url);

          await client.channels.cache.get(msg_channel_id).send(reply);
        } else {
          let reply = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .addField("Couldn't find item:", tmp_name);

          await client.channels.cache.get(msg_channel_id).send(reply);
        }
      } else if (msg_text.match(regex_links_legion_info_get)) {
        const char = msg_text.replace(/^!\w+\s+/, '');
        const links_data = await links_data_get(char);
      } else if (msg_text.match(regex_test)) {
        null;
      } else if (msg_text.match(regex_banned_info_get)) {
        const ban_data = await ban_data_get();
        let reply = new Discord.MessageEmbed()
          .setColor('#0099ff')
          .setTitle('Latest Bans')
          .setURL(ban_data[0].value);

        for (let i = 1; i < ban_data.length; i++) {
          reply.addField(
            `${ban_data[i].property}:`,
            `**${ban_data[i].value}** players`
          );
        }

        await client.channels.cache.get(msg_channel_id).send(reply);
      } else if (msg_text.match(regex_prefix)) {
        let reply = new Discord.MessageEmbed()
          .setColor('#0099ff')
          .addField(
            `No such command: ${msg_text}`,
            'Type **!chelp** for the help menu'
          );

        await client.channels.cache.get(msg_channel_id).send(reply);
      }
    }
  });

  const { token } = await secret_get();
  client.login(token);
})();
