const express = require('express');
const mongoose = require('mongoose');
const Carry = require('../MongoDB/Carry');
const route = express.Router();
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

route.post('/', jsonParser, async (req, res) => {
  const { boss, discord_name, discord_id } = req.body;
  let carryData = {
    boss: boss,
    discord_name: discord_name,
    discord_id: discord_id,
  };

  let carryModel = new Carry(carryData);
  await carryModel.save();
  res.json(carryModel);
});

route.get('/', jsonParser, async (req, res) => {
  await Carry.find({}, function (err, data) {
    res.send(data);
  });
});

route.get('/:boss', jsonParser, async (req, res) => {
  const { boss } = req.params;
  await Carry.find({ boss: boss }, function (err, data) {
    res.send(data);
  });
});

route.delete('/:boss', jsonParser, async (req, res) => {
  const { boss } = req.params;
  await Carry.deleteMany({ boss: boss }, function (err, data) {
    res.send(data);
  });
});

route.delete('/:boss/:discord_name', jsonParser, async (req, res) => {
  const { boss, discord_name } = req.params;
  await Carry.deleteMany({ boss: boss, discord_name: discord_name }, function (
    err
  ) {
    res.send({ Msg: `Deleted ${discord_name} from ${boss} carry` });
  });
});

module.exports = route;
