const express = require('express');
const Queue = require('bull');
const router = express.Router();

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

// connect to redis queue
const queue = new Queue('tasks', REDIS_URL)

router.get('/', (req, res) => {
  // TODO: return all jobs (from mongodb ?)
  res.send('GET all jobs in queue');
});

router.post('/create', (req, res) => {
  // TODO: add job to queue and return job ID
  res.send('POST job to queue')
});

router.post('/:jobId/pause', (req, res) =>  {
  // TODO: pause current job using jobId
});

router.post('/:jobId/resume', (req, res) =>  {
  // TODO: resume current job using jobId
});

router.post('/:jobId/terminate', (req, res) =>  {
  // TODO: terminate current job using jobId
});