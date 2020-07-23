/* eslint-disable no-unused-vars */
const express = require('express');
const Queue = require('bull');
const { REDIS_URL } = require('../constants');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ page: 'Jobs endpoint' });
});

router.post('/create', async (req, res) => {
  // TODO: add job to queue and return job ID
  const taskQueue = new Queue('tasks', REDIS_URL);
  try {
    const job = await taskQueue.add();
    res.json({ id: job.id });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
  }
});

router.post('/:jobId/pause', (req, res) => {
  // TODO: pause current job using jobId
});

router.post('/:jobId/resume', (req, res) => {
  // TODO: resume current job using jobId
});

router.post('/:jobId/terminate', async (req, res) => {
  // TODO: terminate current job using jobId
  const id = req.params.jobId;
  const stopQueue = new Queue('stop', REDIS_URL);
  try {
    const newJob = await stopQueue.add({}, { jobId: id });
    res.send({ id: newJob.id });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
  }
});

router.post('/:jobId', async (req, res) => {
  // TODO: get status of job from jobId
});

module.exports = router;
