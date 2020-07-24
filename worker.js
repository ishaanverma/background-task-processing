/* eslint-disable no-console */
/* eslint-disable no-unused-vars */
/* eslint-disable no-await-in-loop */
const cluster = require('cluster');
const Queue = require('bull');
const Redis = require('ioredis');
// eslint-disable-next-line global-require
const numCPUs = require('os').cpus().length - 2;

const { REDIS_URL } = require('./constants');

const client = new Redis(REDIS_URL);
const subscriber = new Redis(REDIS_URL);
const opts = {
  createClient: (type) => {
    switch (type) {
      case 'client':
        return client;
      case 'subscriber':
        return subscriber;
      default:
        return new Redis(REDIS_URL);
    }
  },
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function start() {
  const taskQueue = new Queue('tasks', opts);
  const stopQueue = new Queue('stop', opts);
  const pauseQueue = new Queue('pause', opts);
  taskQueue.process(async (job) => {
    let progress = 0;
    let stopJob = null;
    let pauseJob = null;

    if (Math.random() < 0.05) {
      throw new Error('This job Failed!');
    }

    while (progress < 100) {
      // do some work
      await sleep(100);
      progress += 1;
      job.progress(progress);

      // at every iteration check if job was added to stop queue or pause queue
      // a threshold can be set to check at every x iterations
      stopJob = await stopQueue.getJob(job.id);
      pauseJob = await pauseQueue.getJob(job.id);
      if (stopJob != null) {
        // graceful shutdown here
        await job.discard();
        await job.moveToFailed({ message: 'Job Interrupted by user' }, true);
        stopJob.progress(100);
        await stopJob.moveToCompleted('Job successfully stopped', true, true);
        return Promise.reject();
      }

      if (pauseJob != null) {
        console.log(`Job ${pauseJob.id} is paused`);
        try {
          // pause till in pause queue
          await pauseJob.finished();
          await pauseJob.remove();
          console.log(`Job ${pauseJob.id} is resumed`);
        } catch (err) {
          console.log(err);
          await job.discard();
          await job.moveToFailed({ message: 'Job Failed' }, true);
          return Promise.reject();
        }
      }
    }
    // only commit when job is completed
    return Promise.resolve();
  });
}

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  for (let i = 0; i < numCPUs; i += 1) cluster.fork();

  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${process.pid} died`);
  });
} else {
  console.log(`worker ${process.pid} started`);
  start();
}
