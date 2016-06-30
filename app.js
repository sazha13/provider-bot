// imports
var restify = require('restify');
var builder = require('botbuilder');
var mongoose = require('mongoose');

// constants
var port = process.env.PORT || 3000;

function respond(req, res, next) {
  res.contentType = "text/plain";
  res.send('This is provider-bot :)');
  next();
}

// post request
function handleRequestMessage(req, res, next) {
  res.send('POST API Response!!!');
  next();
}

var server = restify.createServer();
server.get('/', respond);
server.post('/request', handleRequestMessage);

server.listen(port, function() {
  console.log('%s listening at %s', server.name, server.url);
});

// bot creation
var bot = new builder.BotConnectorBot({ appId: 'ProivderBot', appSecret: '27da870722c84fa5b7f33bb1e8f3bbd8' });
bot.add('/', function (session) {
    session.send('Provider bot in operation :-)');
    Providers.findOne({ channelId: session.from.channelId }, function(err, exmpl1) {
      if (err) return console.error(err);
      if (exmpl1 == null)
      {
        var item = new Providers(session.from);
        item.save();
      };
    });
});

var db = mongoose.connection;
db.on('error', console.error);
db.once('open', function() {
  console.log("connection DB ok");
});
var providersSchemaFrom = new mongoose.Schema({
  "name": String,
  "channelId": String,
  "address": String,
  "id": String,
  "isBot": Boolean
  });
var Providers = mongoose.model('Providers', providersSchemaFrom);

// Setup Restify Server
server.post('/api/messages', bot.verifyBotFramework(), bot.listen());
mongoose.connect(process.env.MONGO_URI||'mongodb://sazha:sazha123@ds035485.mlab.com:35485/telegrambot');
