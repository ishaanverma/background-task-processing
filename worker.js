/* eslint-disable no-await-in-loop */
const cluster = require('cluster');
const Queue = require('bull');
// eslint-disable-next-line global-require
const numCPUs = require('os').cpus().length - 2;

const { REDIS_URL } = require('./constants');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function start() {
  const taskQueue = new Queue('tasks', REDIS_URL);
  const stopQueue = new Queue('stop', REDIS_URL);
  taskQueue.process(async (job) => {
    let progress = 0;
    let stopJob = null;

    if (Math.random() < 0.05) {
      throw new Error('This job Failed!');
    }

    while (progress < 100) {
      await sleep(100);
      progress += 1;
      job.progress(progress);

      // at every iteration check if job was added to stop queue
      // a threshold can be set to check at every x iterations
      stopJob = await stopQueue.getJob(job.id);
      if (stopJob != null) {
        // graceful shutdown here
        await job.discard();
        await job.moveToFailed({ message: 'Job Interrupted by user' }, true);
        stopJob.progress(100);
        await stopJob.moveToCompleted('Job successfully stopped', true, true);
        return Promise.reject();
      }
    }
    // only commit when job is completed
    return Promise.resolve();
  });
}

if (cluster.isMaster) {
  // eslint-disable-next-line no-console
  console.log(`Master ${process.pid} is running`);

  for (let i = 0; i < numCPUs; i += 1) cluster.fork();

  cluster.on('exit', (worker, code, signal) => {
    // eslint-disable-next-line no-console
    console.log(`worker ${process.pid} died`);
  });
} else {
  // eslint-disable-next-line no-console
  console.log(`worker ${process.pid} started`);
  start();
}
