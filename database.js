const mongoose = require('mongoose');
const chalk = require('chalk');
const dbURL = process.env.DB_URI;

const connected = chalk.bold.cyan;
const error = chalk.bold.yellow;
const disconnected = chalk.bold.red;

mongoose.connect(dbURL, {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true});

mongoose.connection.on('connected', () => {
    console.log(connected("Mongoose default connection is open to ", dbURL));
});

mongoose.connection.on('error', (err) => {
    console.log(error(`Mongoose default connection has occured ${err} error`));
});

mongoose.connection.on('disconnected', () => {
    console.log(disconnected("Mongoose default connection is disconnected"));
});

module.exports = mongoose;