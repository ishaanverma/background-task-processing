const express = require('express');
const morgan = require('morgan');
// const mongoose = require('mongoose');
// const redis = require('redis');

const app = express();
const port = process.env.PORT || 3000;


// setup middlewares
app.use(morgan('dev'));
app.use(express.json());

// setup basic routes
app.get("/", (req, res) => 
  res.send("Hello World")
);

// start listening
app.listen(port, () =>
  console.log(`Listening on http://localhost:${port}`)
);