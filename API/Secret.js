const express = require('express');
const mongoose = require('mongoose');
const Secret = require('../MongoDB/Secret');
const route = express.Router();
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

route.get('/', jsonParser, async (req, res) => {
  await Secret.findOne()
    .sort({ date: -1 })
    .limit(1)
    .exec((err, data) => {
      res.send(data);
    });
});

module.exports = route;
