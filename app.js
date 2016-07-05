// imports
var restify = require('restify');
var builder = require('botbuilder');
var mongoose = require('mongoose');
var msRest = require('ms-rest');
var connector = require('botconnector');

// constants
var port = process.env.PORT || 3000;
var ServerMsg = 'This is provider-bot :)';
function respond(req, res, next) {
  res.contentType = "text/plain";
  res.send(ServerMsg);
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
server.post('/sendMessageToCustomer/:ProviderId', sendMessageFromProvider);

server.listen(port, function() {
  console.log('%s listening at %s', server.name, server.url);

});
// bot creation
var bot = new builder.BotConnectorBot({ appId: 'ProivderBot', appSecret: '27da870722c84fa5b7f33bb1e8f3bbd8' });
bot.add('/', function (session) {
    session.send('Provider bot in operation :-)');
    var from1 = session.message;
    ServerMsg = 'HERE';

    MyMonngooseShema.findOne({ 'from.address': from1.from.address }, function(err, exmpl1) {
      if (err) return console.error(err);
      if (exmpl1 == null)
      {
        var item = new MyMonngooseShema(from1);
        item.save();
        ServerMsg = 'NEW RECORD ADD';
        session.send('NEW RECORD ADD');
      };
    });
//timeout1 = setInterval(OnTimer1,10*1000);


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
  id: {type: String}
  });

var MyMonngooseShema = mongoose.model('ShemaMsg', providersSchemaMsg);

function sendMessageFromProvider(req, res, next)
{
  if (req.params.ProviderId != '1')
    return 0;
  MyMonngooseShema.find(function(err, items)
  {
      if (err) return console.error(err);
      for (var i = 0; i<items.length; i++)
      {
          console.log("record %d send to chatid %s username %s",i,exmpl1[i].from.channelId,exmpl1[i].from.name);
          var reply = {
                  replyToMessageId: items[i].id,
                  to: items[i].from,
                  from: items[i].to,
                  text: 'Message from provider ' + req.params.ProviderId
              };
              //console.dir(exmpl1.to);
          sendMessage1(reply);
      };
  });
  res.send('Message Sended');
};
var sendMessage1 = function(msg, cb)
{
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
    console.dir(msg.to);
};
var OnTimer1 = function()
{
  MyMonngooseShema.find(function(err, exmpl1) {
    if (err) return console.error(err);
    // console.dir(exmpl1);
    for (var i = 0; i<exmpl1.length; i++)
    {
        console.log("record %d send to chatid %s username %s",i,exmpl1[i].from.channelId,exmpl1[i].from.name);
        var reply = {
                replyToMessageId: exmpl1[i].id,
                to: exmpl1[i].from,
                from: exmpl1[i].to,
                text: 'timeout spam'
            };
            //console.dir(exmpl1.to);
        sendMessage1(reply);
    };

  });
  //clearTimeout(timeout1);
};

var timeout1 = null;// = setInterval(OnTimer1,10*1000);
// Setup Restify Server
server.post('/api/messages', bot.verifyBotFramework(), bot.listen());
mongoose.connect("mongodb://test:test@ds035485.mlab.com:35485/telegrambot");
