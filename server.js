const express = require('express');
const morgan = require('morgan');
// const mongoose = require('mongoose');
const Arena = require('bull-arena');
const Queue = require('bull');
const { PORT } = require('./constants');
const jobsPath = require('./routes/jobs');
const conn = require('./connection');

const app = express();

const taskQueue = new Queue('tasks', conn);
const stopQueue = new Queue('stop', conn);
const pauseQueue = new Queue('pause', conn);

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
    {
      name: 'pause',
      hostId: 'PausedTaskQueue',
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

stopQueue.on('global:completed', (jobId, result) => {
  // eslint-disable-next-line no-console
  console.log(`Job ${jobId} successfully stopped: ${result}`);
});

pauseQueue.on('global:completed', (jobId, result) => {
  // eslint-disable-next-line no-console
  console.log(`Job ${jobId} successfully resumed: ${result}`);
});

// app.use((err, req, res, next) => {
//   console.log(err.stack);
//   res.status(500).send('Server Error');
// });

// start listening
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Listening on http://localhost:${PORT}`);
});
