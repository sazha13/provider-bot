// imports
var restify = require('restify');
var builder = require('botbuilder');
var mongoose = require('mongoose');
var msRest = require('ms-rest');

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
  // var item = new Providers({
  //   name: "String",
  //   channelId: "String",
  //   address: "String",
  //   id: "String",
  //   isBot: true
  // });
  // item.save();
});

// bot creation
var bot = new builder.BotConnectorBot({ appId: 'ProivderBot', appSecret: '27da870722c84fa5b7f33bb1e8f3bbd8' });
bot.add('/', function (session) {
    session.send('Provider bot in operation :-)');
    var from1 = session.message;
    MyMonngooseShema.findOne({ 'from.address': 'from1.from.address' }, function(err, exmpl1) {
      if (err) return console.error(err);
      if (exmpl1 == null)
      {
        var item = new MyMonngooseShema(from1);
        item.save();
      };
    });



});

var appId = process.env.appId || 'ProivderBot';
var appSecret = process.env.appSecret || '27da870722c84fa5b7f33bb1e8f3bbd8';
var credentials = new msRest.BasicAuthenticationCredentials(appId, appSecret);


var db = mongoose.connection;
db.on('error', console.error);
db.once('open', function() {
  console.log("connection DB ok");
});
var providersSchemaMsg = new mongoose.Schema({
  from:{name: String,
  channelId: String,
  address: String,
  id: String,
  isBot: Boolean},
  to: {name: String,
  channelId: String,
  address: String,
  id: String,
  isBot: Boolean},
  replyToMessageId: String
  });
// var providersSchemaFrom = new mongoose.Schema({
//   name: String,
//   channelId: String,
//   address: String,
//   id: String,
//   isBot: Boolean
//   });
// var Providers = mongoose.model('Providers', providersSchemaFrom);
var MyMonngooseShema = mongoose.model('ShemaMsg', providersSchemaMsg);
var SendMessage1 = function( provider1)
{
  var connector = new ConnectorClient();
  var msg = new Message();
  msg.from = botChannelAccount;
  msg.To = provider1;
  msg.Text = "Hey, what's up homey?";
  msg.Language = "ru-RU";
  connector.Messages.SendMessage(msg);
};
function sendMessage(msg, cb) {
    var client = new connector(credentials);
    var options = { customHeaders: {'Ocp-Apim-Subscription-Key': credentials.password}};
    client.messages.sendMessage(msg, options, function (err, result, request, response) {
        if (!err && response && response.statusCode >= 400) {
            err = new Error('Message rejected with "' + response.statusMessage + '"');
        }
        if (cb) {
            cb(err);
        }
    });
}
var OnTimer1 = function()
{
  Providers.find(function(err, exmpl1) {
    if (err) return console.error(err);
    // console.dir(exmpl1);
    for (var i = 0; i<exmpl1.length; i++)
    {
        console.log("record %d send to chatid %s username %s",i,exmpl1[i].channelId,exmpl1[i].name);
        var reply = {
                to: exmpl1,
                from: botChannelAccount,
                text: 'timeout'
            };
        SendMessage(reply);
    };

  });
};

// setInterval(OnTimer1,1*1000);
// Setup Restify Server
server.post('/api/messages', bot.verifyBotFramework(), bot.listen());
mongoose.connect("mongodb://test:test@ds035485.mlab.com:35485/telegrambot");
