const mongoose = require('./database');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: false
    },
    chatId: {
        type: Number,
        required: true,
        unique: true
    },
    language: {
        type: String,
        required: true,
        default: 'ru'
    },
    birthday: {
        type: Date,
        required: false
    }
});

module.exports = mongoose.model('User', userSchema);