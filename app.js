// imports
var restify = require('restify');
var builder = require('botbuilder');

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
});

// Setup Restify Server
server.post('/api/messages', bot.verifyBotFramework(), bot.listen());
