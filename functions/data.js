const got = require('got');
const cheerio = require('cheerio');
const fs = require('fs');
const powershell = require('node-powershell');
const { GoogleSpreadsheet } = require('google-spreadsheet');

const raw_data = fs.readFileSync('./config.json');
const {
  mvp_spreadsheet_id,
  google_sheets_api_email,
  google_sheets_api_key,
  mvp_spreadsheet_creds_file_name,
  link_skills_data_url,
} = JSON.parse(raw_data);

const { capitalize } = require('./general');

// get player data from maplestory.gg
async function maplestory_gg_players_data_get(region, player_name_to_search) {
  const maplestorygg_api_url = `https://api.maplestory.gg/v1/public/character/${region}/${player_name_to_search}`;
  const player_url = `https://maplestory.gg/c/${region}/${player_name_to_search}`;
  let body;
  try {
    body = await got.get(maplestorygg_api_url, {
      responseType: 'json',
    });

    body = body.body;
  } catch (UnhandledPromiseRejectionWarning) {
    return null;
  }

  if (!body.LegionCoinsPerDay) {
    body.LegionCoinsPerDay = 0;
  }

  if (!body.Class) {
    body.Class = 'N/A';
  }

  return {
    url: player_url,
    CharacterImageURL: body.CharacterImageURL,
    Class: body.Class,
    ClassRank: body.ClassRank,
    EXPPercent: body.EXPPercent,
    GlobalRanking: body.GlobalRanking,
    LegionLevel: body.LegionLevel,
    Level: body.Level,
    Name: body.Name,
    Server: body.Server,
    ServerRank: body.ServerRank,
    LegionRank: body.LegionRank,
    LegionCoinsPerDay: body.LegionCoinsPerDay,
    LegionPower: body.LegionPower,
    ServerClassRanking: body.ServerClassRanking,
  };
}

// get item data from maple wiki [fandom]
async function maple_wiki_item_data_get(item_name) {
  let maplefandom = 'https://maplestory.fandom.com/wiki/';
  let item_url = maplefandom.concat(item_name);
  let body;

  try {
    body = await got.get(item_url);
    body = body.body;
  } catch (UnhandledPromiseRejectionWarning) {
    return null;
  }

  const properties = cheerio(
    '#mw-content-text > table:nth-child(2) > tbody > tr > th',
    body
  )
    .text()
    .split(/\n/)
    .filter((p) => p.match(/\w+/));

  if (properties.length === 0) {
    return null;
  }

  const values = cheerio(
    '#mw-content-text > table:nth-child(2) > tbody > tr > td',
    body
  )
    .text()
    .split(/\n/)
    .splice(2);

  let table_values = {};
  let counter = 0;

  values.forEach((value) => {
    if (value.match(/\w+/)) {
      if (!table_values[properties[counter]]) {
        table_values[properties[counter]] = '';
      }

      table_values[properties[counter]] += `${value}, `;
    } else {
      if (table_values[properties[counter]]) {
        table_values[properties[counter]] = table_values[properties[counter]]
          .toString()
          .replace(/,\s+$/, '');

        counter++;
      }
    }
  });

  let item_string = '';

  properties.forEach((property) => {
    item_string += `**${property}**: ${table_values[property]}\n`;
  });

  const img_tmp = cheerio(
    '#mw-content-text > table:nth-child(2) > tbody > tr:nth-child(2) > td > a > img',
    body
  );

  let item_picture_url = img_tmp[0].attribs.src;

  return {
    item_string: item_string,
    item_picture_url: item_picture_url,
    item_url: item_url,
  };
}

async function latest_ban_announcement_url_get() {
  const maple_forum_announcements_url =
    'http://forums.maplestory.nexon.net/categories/announcements';
  let body;

  try {
    const response = await got(maple_forum_announcements_url);
    body = response.body;
  } catch (error) {
    return null;
  }

  const html_links = cheerio('td.DiscussionName > div.Wrap > a', body);
  const html_links_num = html_links.length;

  for (let i = 0; i < html_links_num; i++) {
    if (
      html_links[i].attribs.href &&
      html_links[i].attribs.href.match(/ban-data-from/)
    ) {
      return html_links[i].attribs.href;
    }
  }

  return null;
}

async function latest_maple_ban_post() {
  const latest_ban_announecment_url = await latest_ban_announcement_url_get();

  if (!latest_ban_announecment_url) {
    return null;
  }

  let body;

  try {
    const response = await got(latest_ban_announecment_url);
    body = response.body;
  } catch (error) {
    return null;
  }

  const maple_ban_post = cheerio(
    'div.Discussion > div.Item-BodyWrap > div > div > a',
    body
  ).text();

  if (!maple_ban_post) {
    return null;
  }

  return maple_ban_post;
}

async function ban_data_get() {
  const maple_ban_post_url = await latest_maple_ban_post();

  if (!maple_ban_post_url) {
    return null;
  }

  let body;

  try {
    const response = await got(maple_ban_post_url);
    body = response.body;
  } catch (error) {
    return null;
  }

  const html_data = cheerio('.article-content', body)
    .text()
    .split(/\n/)
    .splice(1);
  const html_data_length = html_data.length;

  let data = [];
  data.push({ property: 'url', value: maple_ban_post_url });
  let count, property;

  for (let i = 0; i < html_data_length; i++) {
    if (!html_data[i].match(/\w+/)) {
      continue;
    }

    if (i % 2) {
      count = html_data[i].split(',').length;
    } else {
      property = html_data[i].replace(/\t+/, '');
    }

    if (property && count) {
      data.push({ property: property, value: count });
      property = null;
      count = null;
    }
  }

  return data;
}

async function mvp_spreadsheet_download() {
  let ps = new powershell({
    executionPolicy: 'Bypass',
    noProfile: true,
  });

  ps.addCommand('./download_mvp_spreadsheet.ps1 ' + mvp_spreadsheet_id);
  await ps.invoke();
}

async function mvp_spreadsheet_date_get() {
  const doc = new GoogleSpreadsheet(mvp_spreadsheet_id);
  await doc.useServiceAccountAuth(
    require(`..\\${mvp_spreadsheet_creds_file_name}`)
  );
  await doc.loadInfo(); // loads document properties and worksheets

  let title;

  Object.keys(doc._rawSheets).forEach((sheet) => {
    if (doc._rawSheets[sheet]._rawProperties.index === 0) {
      title = doc._rawSheets[sheet]._rawProperties.title;
    }
  });

  return title;
}

async function mvp_spreadsheet_convert_data() {
  let ps = new powershell({
    executionPolicy: 'Bypass',
    noProfile: true,
  });

  const mvp_spreadsheet_date = await mvp_spreadsheet_date_get();

  ps.addCommand('./get_data_from_spreadsheet.ps1');
  ps.addParameter({ spreadsheet_date: mvp_spreadsheet_date });
  try {
    await ps.invoke();
  } catch {}
}

async function mvp_data_get() {
  await mvp_spreadsheet_download();
  await mvp_spreadsheet_convert_data();
  let data = JSON.parse(fs.readFileSync('..\\mvp_data.json'));
  let new_day_date;

  for (let i = 0; i < data.value.length; i++) {
    if (data.value[i].dateString) {
      new_day_date = data.value[i].dateString;
    }
  }

  const doc = new GoogleSpreadsheet(mvp_spreadsheet_id);
  await doc.useServiceAccountAuth(
    require(`..\\${mvp_spreadsheet_creds_file_name}`)
  );

  await doc.loadInfo(); // loads document properties and worksheets
  const sheet = doc.sheetsByIndex[0];

  const month = sheet.title.match(/^\d+/)[0];
  const day = sheet.title.match(/\d+$/)[0];
  data['date_today'] = { month: month, day: day };

  if (new_day_date) {
    const date_array = new_day_date.split(/-/);
    const tomorrow_year = date_array[0];
    const tomorrow_month = date_array[1];
    const tomorrow_day = date_array[2];

    data['date_tomorrow'] = {
      month: tomorrow_month,
      day: tomorrow_day,
    };
  }

  fs.unlinkSync('..\\mvp_data.json');
  fs.unlinkSync('..\\mvp_spreadsheet.xlsx');

  return data;
}

async function links_data_get(char) {
  const capitlized_char = capitalize(char);
  const { body } = await got(link_skills_data_url);

  const re = new RegExp(capitlized_char, 'g');
  const titles = cheerio('div.article-content > div > h3 > strong', body);
  let title;
  Object.keys(titles).forEach((key) => {
    if (
      titles[key].children &&
      titles[key].children[0] &&
      titles[key].children[0].data &&
      re.test(titles[key].children[0].data)
    ) {
      title = titles[key].children[0].data;
    }
  });

  const links_tables_data = cheerio('div.article-content > div > table', body);
  console.log(links_tables_data[0].prev);
}

// exported functions
module.exports = {
  maplestory_gg_players_data_get,
  maple_wiki_item_data_get,
  ban_data_get,
  mvp_data_get,
  links_data_get,
};
