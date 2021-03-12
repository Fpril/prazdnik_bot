const express = require('express');
const app = express();
const bot = require('./bot');

app.get('/', (req, res) => res.send('Hello World!'));
// Set the bot API endpoint
app.use(bot.webhookCallback('/secret-path'));

app.listen(process.env.PORT || 5000, () => {
    console.log('App listening on port ' + process.env.PORT || 5000);
});