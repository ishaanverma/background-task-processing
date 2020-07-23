const express = require('express');
const morgan = require('morgan');
// const mongoose = require('mongoose');
// const redis = require('redis');
const Arena = require('bull-arena');
const Queue = require('bull');
const jobsPath = require('./routes/jobs');

const app = express();
const port = process.env.PORT || 3000;
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const taskQueue = new Queue('tasks', REDIS_URL);
const stopQueue = new Queue('stop', REDIS_URL);

const arenaConfig = Arena({
  queues: [
    {
      name: 'tasks',
      hostId: 'TaskQueue',
      redis: {
        port: 6379,
        host: '127.0.0.1',
      },
    },
    {
      name: 'stop',
      hostId: 'StoppedTaskQueue',
      redis: {
        port: 6379,
        host: '127.0.0.1',
      },
    },
  ],
},
{
  basePath: '/arena',
  disableListen: true,
});

// setup middlewares
app.use(morgan('dev'));
app.use(express.json());
app.use('/jobs', jobsPath);
app.use('/', arenaConfig);

// setup basic routes
app.get('/', (req, res) => {
  res.send('Hello World');
});

taskQueue.on('global:completed', (jobId, result) => {
  // eslint-disable-next-line no-console
  console.log(`Job ${jobId} completed: ${result}`);
});

taskQueue.on('global:failed', (jobId, err) => {
  // eslint-disable-next-line no-console
  console.log(`Job ${jobId} failed: ${err}`);
});

// start listening
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Listening on http://localhost:${port}`);
});
