/* eslint-disable no-console */
const csv = require('fast-csv');
const path = require('path');
const fs = require('fs');
const InfoModel = require('../models/InfoModel');

const parseInfoCSV = (filename, threshold, startRow) => new Promise((resolve) => {
  const infoDocs = [];
  let count = 0;

  fs.createReadStream(path.join(__dirname, '..', 'data', filename))
    .pipe(csv.parse({ headers: true, maxRows: threshold, skipRows: startRow }))
    .on('error', (error) => console.log(error))
    .on('data', (row) => {
      count += 1;
      infoDocs.push(new InfoModel({
        seq: row.seq,
        first_name: row.first,
        last_name: row.last,
        email: row.email,
        phone: row.phone,
      }));
    })
    .on('end', () => {
      resolve([infoDocs, count]);
    });
});

exports.parseInfoCSV = parseInfoCSV;
