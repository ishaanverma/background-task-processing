/* eslint-disable consistent-return */
/* eslint-disable no-console */
/* eslint-disable no-unused-vars */
/* eslint-disable no-await-in-loop */
const cluster = require('cluster');
const Queue = require('bull');
const Redis = require('ioredis');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
// eslint-disable-next-line global-require
const numCPUs = require('os').cpus().length - 3;

const { parseInfoCSV } = require('./jobs/parseInfo');
const InfoModel = require('./models/InfoModel');
const JobModel = require('./models/JobModel');
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
dotenv.config();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function start() {
  const taskQueue = new Queue('tasks', opts);
  const stopQueue = new Queue('stop', opts);
  const pauseQueue = new Queue('pause', opts);
  // connect to db
  mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true });
  const db = mongoose.connection;
  db.on('error', console.error.bind(console, 'connection error:'));
  db.once('open', () => {
    console.log('Connected to DB');
  });
  taskQueue.process(async (job) => {
    let stopJob = null; let pauseJob = null;
    const { filename } = job.data;
    let startRow = 0;
    const threshold = 10;
    let complete = false; let parsedDocs = []; let count = 0; let maxTries = 2;

    while (!complete && maxTries > 0) {
      // parse CSV file and return array of documents to save
      [parsedDocs, count] = await parseInfoCSV(filename, threshold, startRow);
      if (count < threshold) complete = true;

      // check if job was added to stop queue or pause queue
      stopJob = await stopQueue.getJob(job.id);
      pauseJob = await pauseQueue.getJob(job.id);
      if (stopJob != null) {
        // graceful shutdown here
        await job.discard();
        await job.moveToFailed({ message: 'Job Interrupted by user' }, true);
        stopJob.progress(100);
        await stopJob.moveToCompleted('Job successfully stopped', true, true);
        parsedDocs = [];
        // update status in db
        await JobModel.updateOne({ jobId: job.id },
          { status: 'terminated' },
          (err) => {
            if (err) return console.log(err);
          });
        return Promise.reject();
      }

      if (pauseJob != null) {
        console.log(`Job ${pauseJob.id} is paused`);
        // update status in db
        await JobModel.updateOne({ jobId: job.id },
          { status: 'paused' },
          (err) => {
            if (err) return console.log(err);
          });
        try {
          // pause till in pause queue
          // cpu cycles being wasted
          await pauseJob.finished();
          await pauseJob.remove();
          console.log(`Job ${pauseJob.id} is resumed`);
          // update status in db
          await JobModel.updateOne({ jobId: job.id },
            { status: 'working' },
            (err) => {
              if (err) return console.log(err);
            });
        } catch (err) {
          console.log(err);
          await job.discard();
          await job.moveToFailed({ message: 'Job Failed' }, true);
          return Promise.reject(new Error('Resume Failed'));
        }
      }

      // instead of saving every few iterations
      // the final save can occur when the complete document is parsed
      // provided there is enough RAM
      await InfoModel.insertMany(parsedDocs, (error, docs) => {
        if (error) {
          console.log(`Document saving failed. Job ${job.id} failed`);
        } else {
          console.log(`Documents successfully inserted: Job ${job.id}: ${docs.length} docs`);
        }
      });
      startRow += parsedDocs.length;
      maxTries -= 1;
      await sleep(10000);
    }
    // update status in db
    await JobModel.updateOne({ jobId: job.id },
      { status: 'completed' },
      (err) => {
        if (err) return console.log(err);
      });
    console.log(`Job ${job.id} Completed`);
    job.progress(100);
    return Promise.resolve('success');
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
