const mongoose = require('mongoose');

const requiredString = {
  type: String,
  required: true,
};

const requiredNumber = {
  type: String,
  required: true,
};

const InfoSchema = mongoose.Schema({
  seq: requiredNumber,
  first_name: requiredString,
  last_name: String,
  email: requiredString,
  phone: String,
});

module.exports = mongoose.model('InfoModel', InfoSchema);
