// imports
var restify = require('restify');
var builder = require('botbuilder');
var mongoose = require('mongoose');
var msRest = require('ms-rest');
var connector = require('botconnector');
// var express = require('express');

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
// var server = express.createServer();

server.get('/', respond);
server.post('/request', handleRequestMessage);
server.use(restify.acceptParser(server.acceptable));
server.use(restify.bodyParser());
// server.use(restify.dateParser());
  // server.use(restify.queryParser());
  // server.use(restify.authorizationParser());
server.post('/sendMessageToCustomer/:ProviderId', sendMessageFromProvider);
server.get('/getContent/:ProviderId',getContentMsg);
/// New API
server.get('/threads',getThreads);
server.get('/thread/:THREAD_ID/messages',getThreadMsgs);
server.post('/thread/:THREAD_ID/messages',postThreadMsgs);
server.post('/apns',postAPNs);

server.listen(port, function() {
  console.log('%s listening at %s', server.name, server.url);

});

// bot creation
var bot = new builder.BotConnectorBot({ appId: 'ProivderBot', appSecret: '27da870722c84fa5b7f33bb1e8f3bbd8' });
bot.add('/', function (session) {
    session.send('Provider bot in operation :-)');
    var from1 = session.message;
    var recvedMsg = session.message;
    ServerMsg = 'HERE';

    MyMonngooseShema.findOne({ 'from.address': from1.from.address }, function(err, exmpl1) {
      if (err) return console.error(err);
      if (exmpl1 == null)
      {
        var item = new MyMonngooseShema(from1);
        item.save();
        ServerMsg = 'NEW RECORD ADD';
        //session.send('NEW RECORD ADD');
      };
    });
    var msg1 = new MsgTmpShema(from1);
    msg1.unRead = true;
    msg1.save();
    //new API
    ThreadsDB.findOne({ 'from.address': recvedMsg.from.address }, function(err, item) {
      if (err) return console.error(err);
      if (item == null)
      {
        var record = new ThreadsDB(recvedMsg);
        record.save();
        AddMsgInDB(record.id,recvedMsg);
      }
      else
      {
        AddMsgInDB(item.id,recvedMsg);
      }
    });
//timeout1 = setInterval(OnTimer1,10*1000);


});

function AddMsgInDB(ThreadId, msg)
{
console.log(ThreadId);
    var record = new MsgDB();
    record.created = msg.created;
    record.text = msg.text;
    record.ThreadId = ThreadId;
    record.senderName = msg.from.name
    record.fromUser = true;
    record.id = msg.id;

    record.save();
};

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

  var SchemaMsgTMP = new mongoose.Schema({
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
    id: {type: String},
    unRead: {type: Boolean},
    text: {type: String}
    });
var SchemaThread = new mongoose.Schema({
  from:{name: String,
  channelId: String,
  address: String,
  id: String,
  isBot: Boolean},
  to: {name: String,
  channelId: String,
  address: String,
  id: String,
  isBot: Boolean}
});
var SchemaMsg = new mongoose.Schema({
  ThreadId : {type: String},
  text: {type: String},
  senderName : {type: String},
  created : {type: String},
  fromUser: {type: Boolean},
  id: {type: String}
});
var MyMonngooseShema = mongoose.model('ShemaMsg', providersSchemaMsg);
var MsgTmpShema = mongoose.model('MsgTmpShema', SchemaMsgTMP);
var MsgDB = mongoose.model('MsgSchema',SchemaMsg);
var ThreadsDB = mongoose.model('ThreadSchema',SchemaThread);
function GetThreadLastMsg(threadId)
{
  var query = MsgDB.find({"ThreadId": threadId}).limit(1).select('created text').sort({"created": -1});
  return query;
};
function GetFrom()
{
  var query = ThreadsDB.find().select('from');
  return query;
};



///new API function
function getThreads(req, res, next)
{
  var result = [];
  LgetThreads();
  function LgetThreads(){
    GetFrom().exec(LonThreads);
  }

  function LonThreads(err,items){
    items.forEach(function (item,i)
    {
      result.push({});
      result[i].ThreadId = item.id;
      result[i].name = item.from.name;
    });
    LgetThreadLastMsg();
  }

  function LgetThreadLastMsg()
  {
    result.forEach(function(rec)
    {
      GetThreadLastMsg(rec.ThreadId).exec(LonThreadLastMessage);
    });
  }

  function LonThreadLastMessage(err,item)
  {
    result[result.length-1].created = item[0].created;
    result[result.length-1].text = item[0].text;
    finish();
  }
  function finish()
  {
    res.contentType = 'application/json';
    res.charset = 'utf-8';
    res.send(result);
  }
};

function getThreadMsgs(req, res, next)
{
  MsgDB.find({"ThreadId": req.params.THREAD_ID}).sort({"created" : -1}).exec(function(err,items){
    res.send(items);
  });
  //res.send('getThreadMsgs not available');
};

function postThreadMsgs(req, res, next)
{
  //res.send('postThreadMsgs not available');
  console.log("postThreadMsgs "+ req.params.THREAD_ID);
  var reply = {text : req.body.text};
  ThreadsDB.findOne().select("_id").exec(function(err,item){
    console.log(item);
  });
  ThreadsDB.findOne({"_id": req.params.THREAD_ID}).exec(LonThread);

  function LonThread(err,item)
  {

    if (item==null)
    {
      console.log("item1 " + item);
      finish(true);
      return;
    }
    reply.to = item.from;
    reply.from = item.to;
    LgetLastMsgID();
  }

  function LgetLastMsgID()
  {
    MsgDB.findOne({"ThreadId": req.params.THREAD_ID}).sort({"created" : -1}).exec(LonLastMsgID);
  }

  function LonLastMsgID(err,item)
  {
    if (item==null)
    {
      console.log("item2 " + item);
      finish(true);
      return;
    }
    reply.replyToMessageId = item.id;
    finish(false);
  }
  function finish(err)
  {
    console.log(reply);
    if (!err)
      sendMessage1(reply);
    res.contentType = 'application/json';
    res.charset = 'utf-8';
    res.send([]);
  }
};

function postAPNs(req, res, next)
{
  res.send('postThreadMsgs not available');
};

///END new API function
function getContentMsg(req, res, next)
{

  MsgTmpShema.find().sort({"from.address": 1}).exec(function(err,items)
  {
    res.contentType = 'application/json';
        res.charset = 'utf-8';
        res.send(items);
        for (var i = 0; i<items.length; i++)
        {
          items[i].unRead = false;
          items[i].save();
        }
        res.send(items);
  });
}
function sendMessageFromProvider(req, res, next)
{

  console.log(req.body.text);


  var reply = {
                  replyToMessageId: req.body.id,
                  to: req.body.from,
                  from: req.body.to,
                  text: req.body.text
              };
              sendMessage1(reply);
  res.send('Message maybe sended');
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
    //console.dir(msg.to);
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
