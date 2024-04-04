var mongoose = require("mongoose");
var Schema = mongoose.Schema;

module.exports = mongoose.model('group', new Schema({
    name: String,
    partecipants: [{ type: Schema.Types.ObjectId, ref: 'user' }],
    url: String,
    credits: [{name: String, debitors: [String], amount: Number, date: Date}],
    debits: [{name: String, creditors: [String], amount: Number, date: Date}]
}));