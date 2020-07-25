const mongoose = require('mongoose');

const JobSchema = mongoose.Schema({
  jobId: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model('JobModel', JobSchema);
