const express = require('express');
const app = express();
const bot = require('./bot');
const port = 5000;

app.get('/' ,(req, res) => res.send('hello world!'));

app.use(bot.webhookCallback('/' + bot.telegram.token));

app.listen(process.env.PORT || port, () => console.log(`App listening on port ${process.env.PORT || port}!`));