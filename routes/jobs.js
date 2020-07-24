/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
const express = require('express');
const Queue = require('bull');
const { REDIS_URL } = require('../constants');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ page: 'Jobs endpoint' });
});

router.post('/create', async (req, res) => {
  // add job to queue and return job ID
  const taskQueue = new Queue('tasks', REDIS_URL);
  try {
    const job = await taskQueue.add();
    res.json({ id: job.id });
  } catch (err) {
    console.log(err);
    res.status(500).send();
  }
});

router.post('/:jobId/pause', async (req, res) => {
  // TODO: pause current job using jobId
  const id = req.params.jobId;
  const pauseQueue = new Queue('pause', REDIS_URL);
  try {
    const pauseJob = await pauseQueue.add({}, { jobId: id });
    res.send({ id: pauseJob.id });
  } catch (err) {
    console.log(err);
    res.status(500).send('Could not add to pause queue');
  }
});

router.post('/:jobId/resume', async (req, res, next) => {
  // resume current job using jobId
  const id = req.params.jobId;
  const pauseQueue = new Queue('pause', REDIS_URL);
  try {
    const pauseJob = await pauseQueue.getJob(id);
    if (pauseJob == null) return res.status(500).send("Job doesn't exist");

    await pauseJob.moveToCompleted(`Job ${id} resumed`, true, true);
    res.send({ id: pauseJob.id });
  } catch (err) {
    console.log(err);
    res.status(500).send();
    next(err);
  }
});

router.post('/:jobId/terminate', async (req, res) => {
  // terminate current job using jobId
  const id = req.params.jobId;
  const stopQueue = new Queue('stop', REDIS_URL);
  try {
    const newJob = await stopQueue.add({}, { jobId: id });
    res.send({ id: newJob.id });
  } catch (err) {
    console.log(err);
    res.status(500).send();
  }
});

router.post('/:jobId', async (req, res) => {
  // TODO: get status of job from jobId
});

module.exports = router;
