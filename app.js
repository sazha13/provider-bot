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
server.use(restify.authorizationParser());
// server.use(restify.dateParser());
  // server.use(restify.queryParser());
  // server.use(restify.authorizationParser());
// server.post('/sendMessageToCustomer/:ProviderId', sendMessageFromProvider);
// server.get('/getContent/:ProviderId',getContentMsg);
/// New API
server.get('/thread',getThreads);
server.get('/thread/:THREAD_ID/messages',getThreadMsgs);
server.post('/thread/:THREAD_ID/messages',postThreadMsgs);
server.post('/apns',postAPNs);
server.post('/createProvider',postCreateProvider);

server.listen(port, function() {
  console.log('%s listening at %s', server.name, server.url);

});

// bot creation
var bot = new builder.BotConnectorBot({ appId: 'ProivderBot', appSecret: '27da870722c84fa5b7f33bb1e8f3bbd8' });
bot.add('/', function (session) {
    //session.send('Provider bot in operation :-)');
	session.message.BotPerUserInConversationData = null;
    var from1 = session.message;
    var recvedMsg = session.message;
    ServerMsg = 'HERE';

    // MyMonngooseShema.findOne({ 'from.address': from1.from.address }, function(err, exmpl1) {
    //   if (err) return console.error(err);
    //   if (exmpl1 == null)
    //   {
    //     var item = new MyMonngooseShema(from1);
    //     item.save();
    //     ServerMsg = 'NEW RECORD ADD';
    //     //session.send('NEW RECORD ADD');
    //   };
    // });
    // var msg1 = new MsgTmpShema(from1);
    // msg1.unRead = true;
    // msg1.save();
    //new API
    ChanelDB.findOne({ 'from.address': recvedMsg.from.address }, function(err, item) {
      if (err) return console.error(err);
      if (item == null)
      {
        var record = new ChanelDB(recvedMsg);
        record.save();
        CheckThreads(record.id,recvedMsg);
        //AddMsgInDB(record.id,recvedMsg);
      }
      else
      {
        CheckThreads(item.id,recvedMsg);
        //AddMsgInDB(item.id,recvedMsg);
      }
    });
    function CheckThreads(chanelId,recvedMsg)
    {
      ThreadDB.find({"consumer" : chanelId}).exec(LonFindConsumers);
      function LonFindConsumers(err,items){
        if (items.length==0)
          CreateNewThreads(chanelId,recvedMsg);
        else
        {
          var msgid = AddMsgInDB(chanelId,recvedMsg);
          ThreadDB.update({"consumer":chanelId},{$push:{msgs:msgid}},function(err, num){console.dir(num);});
        }
      }

    }
    function CreateNewThreads(chanelId,recvedMsg){
      var msgid = AddMsgInDB(chanelId,recvedMsg);
      ProviderDB.find().exec(AddThread);
        function AddThread(err,items){
          items.forEach(function(item){
            var record = new ThreadDB({"consumer": chanelId, "provider": item._id, "msgs":[msgid]});
            record.save();
          });
        }
    }
//timeout1 = setInterval(OnTimer1,10*1000);


});

function AddMsgInDB(ChanelId, msg)
{
    var record = new MsgDB();
    //record.sent = msg.created;
    record.message = msg.text;
    record.type = 'text';
    record.ChanelId = ChanelId;
    record.sender.name = msg.from.name;
    record.sender.id = ChanelId;
    record.sender.type = 'consumer';
    record.fromUser = true;
    record.id = msg.id;
    record.attachments = msg.attachments;
    record.save();
    // ProviderDB.find().exec(function(err,items){
    //   items.forEach(function(item){
    //     console.log(item._id);
    //     MsgDB.update({"_id": record._id},{$push:{thread_id:item._id}},{multi: true},function(err, numAffected){});
    //     //record.thread_id.push("item._id");
    //   });
    // });


    // ThreadDB.find({"consumer":record.ChanelId}).exec(function(err,items){
    //   items.forEach(function(item){
    //     console.log(record._id);
    //     item.msgs.push(record._id);
    //   });
    // });
    // ThreadDB.update({"consumer":record.ChanelId},{$push:{msgs:record._id}},function(err, num){console.dir(num);});
    return record._id;
};

var appId = process.env.appId || 'ProivderBot';
var appSecret = process.env.appSecret || '27da870722c84fa5b7f33bb1e8f3bbd8';
var credentials = new msRest.BasicAuthenticationCredentials(appId, appSecret);


var db = mongoose.connection;
db.on('error', console.error);
db.once('open', function() {
  console.log("connection DB ok");
});
// var providersSchemaMsg = new mongoose.Schema({
//   from:{name: String,
//   channelId: String,
//   address: String,
//   id: String,
//   isBot: Boolean},
//   to: {name: String,
//   channelId: String,
//   address: String,
//   id: String,
//   isBot: Boolean},
//   id: {type: String}
//   });
//
//   var SchemaMsgTMP = new mongoose.Schema({
//     from:{name: String,
//     channelId: String,
//     address: String,
//     id: String,
//     isBot: Boolean},
//     to: {name: String,
//     channelId: String,
//     address: String,
//     id: String,
//     isBot: Boolean},
//     id: {type: String},
//     unRead: {type: Boolean},
//     text: {type: String}
//     });
var SchemaChanel = new mongoose.Schema({
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
  ChanelId : {type: String},
  //thread_id : [String],
  type: {type: String},
  message: {type: String},
  attachments: [],
  sender : {
      name:{type: String},
      id:{type: String},
      type:{type: String}
  },
  sent : {type: Date, default: Date.now},
  fromUser: {type: Boolean},
  id: {type: String}
});
var SchemaProvider = new mongoose.Schema({
  name: {type: String},
  //id: {type: String},
  username: {type: String},
  password: {type: String}
});
var SchemaAPNS = new mongoose.Schema({
  token: {type: String}
});
var SchemaThread = new mongoose.Schema({
  consumer: {type: String},
  provider: {type: String},
  msgs: [String]
});
// var MyMonngooseShema = mongoose.model('ShemaMsg', providersSchemaMsg);
// var MsgTmpShema = mongoose.model('MsgTmpShema', SchemaMsgTMP);
var MsgDB = mongoose.model('MsgSchema',SchemaMsg);
var ChanelDB = mongoose.model('ChanelSchema',SchemaChanel);
var ProviderDB = mongoose.model('ProviderSchema',SchemaProvider);
var APNS = mongoose.model('APNSSchema',SchemaAPNS);
var ThreadDB = mongoose.model('ThreadSchema',SchemaThread);
function GetThreadLastMsg(threadId)
{
  var query = MsgDB.find({"ThreadId": threadId}).limit(1).select('created text').sort({"created": -1});
  return query;
};
function GetFrom(threadId)
{
  var query = ChanelDB.find().select('from');
  return query;
};



///new API function
function postCreateProvider(req, res, next)
{
  res.contentType = 'application/json';
  res.charset = 'utf-8';
  console.dir(req.authorization);
  if (req.authorization==null ||
      req.authorization.basic.username == null ||
    req.authorization.basic.password == null)
  {
    res.send(401);
    return;
  }
  ProviderDB.find({"username":req.authorization.basic.username}).limit(1).exec(function(err,items){
    if (items.length == 0)
    {
      var record = new ProviderDB({"name":req.body.name});
      record.username = req.authorization.basic.username;
      record.password = req.authorization.basic.password;
      record.save();
      res.send(201);
    }
    else
    {
      res.send(401);
    }
  });


}

function getThreads(req, res, next)
{
  res.contentType = 'application/json';
  res.charset = 'utf-8';
  // console.dir(req.authorization);
  var result = [];
  var tmpResult = [];
  var CountLastmesage;
  var CountConsumer;
  LgetAuth();
  function LgetAuth()
  {
    var query = ProviderDB.find({"username":req.authorization.basic.username, "password":req.authorization.basic.password}).limit(1).select('_id')
    query.exec(function(err,items){
      if (items.length == 0)
        res.send(401);
      else
      {
        LgetThreads(items[0]._id);

      }
    });
  }

  function LgetThreads(providerId){
    var query = ThreadDB.find({"provider":providerId});
    query.exec(LonThreads);
  }

  function LonThreads(err,items){
    console.log("LonThreads");
    if (items.length==0)
    {
      finish();
      return;
    }
    var itemsProcessed = 0;
    items.forEach(function (item,i,items)
    {
      // console.log("forEach " + result.length);
      // console.log("itemsProcessed "+itemsProcessed);
      result.push({});
      tmpResult.push(item);
      result[i].thread_id = item._id;
      //result[i].name = item.from.name;
      if (++itemsProcessed === items.length)
      {
        //console.log(tmpResult);
        LWriteOther();
      };
    });
    function LWriteOther()
    {
      tmpResult.forEach(function(item,i){
        LgetConsumer(item.consumer,i);
        LgetThreadLastMsg(item.msgs);
      });
    }

    function LgetConsumer(consumer_id,i)
    {
      // tekI = i;
      CountConsumer = 0;
      var query = ChanelDB.find({"_id":consumer_id}).limit(1);
      query.exec(LonConsumer);
    }
    function LonConsumer(err,items)
    {
      for (var i = 0; i<tmpResult.length; i++)
      {
        if (tmpResult[i].consumer != items[0]._id)
        {
          continue;
        }
        result[i].consumer = {};
        result[i].consumer.name = items[0].from.name;
        result[i].consumer.id = items[0]._id;
        result[i].consumer.type = 'consumer';
        LCheckConsumers();
        return;
      }
    }
    function LgetThreadLastMsg(msgs)
    {

      CountLastmesage = 0;
      var query = MsgDB.find().in("_id",msgs).limit(1).sort({"sent": -1});
         query.exec(LonThreadLastMessage);
    }

    function LonThreadLastMessage(err,item)
    {
      // console.log(item);
      for (var i = 0; i<tmpResult.length; i++)
      {
        if (tmpResult[i].msgs.indexOf(item[0]._id)==-1)
        {
          continue;
        }
        tmpResult[i].msgs = [];
        result[i].last_message = {};
        result[i].last_message.sent = item[0].sent.getTime()/1000|0;
        result[i].last_message.type = item[0].type;
        result[i].last_message.message = item[0].message;
        result[i].last_message.sender = item[0].sender;
        result[i].last_message.id = item[0]._id;
        result[i].last_message.attachments = [];
        if (item[0].attachments!=null)
        	result[i].last_message.attachments = item[0].attachments;
        LCheckLastMsgs();
        return;
      }
      // console.log(result);
    }

    function LCheckLastMsgs()
    {
      CountLastmesage++;
        WaitAll();
    }
    function LCheckConsumers()
    {
      CountConsumer++;
        WaitAll();
    }
    function WaitAll()
    {
      // console.log("CountLastmesage " + CountLastmesage);
      // console.log("CountConsumer " + CountConsumer);
      if (CountLastmesage == result.length && CountConsumer == result.length)
        finish();
    }

    };

  function finish()
  {
    // console.log("result");
    // console.log(result);

    res.send(result);
  }
};

function getThreadMsgs(req, res, next)
{
  var result = {"messages":[]};
  res.contentType = 'application/json';
  res.charset = 'utf-8';
  LgetAuth();
  function LgetAuth()
  {
    var query = ProviderDB.find({"username":req.authorization.basic.username, "password":req.authorization.basic.password}).limit(1).select('_id')
    query.exec(function(err,items){
      if (items.length == 0)
        res.send(401);
      else
      {
        LauthOk();
      }
    });
  }
  function LauthOk(){
    ThreadDB.find({"_id": req.params.THREAD_ID}).limit(1).exec(function(err,items){
      findmsgs(items[0].msgs);
    });
  }
  function findmsgs(msgsId)
  {
    MsgDB.find().in("_id",msgsId).sort({"sent":-1}).exec(function(err,items){
      items.forEach(function(item){
        result.messages.push({});
        var i = result.messages.length-1;
        result.messages[i].id = item._id;
        result.messages[i].sender = item.sender;
        result.messages[i].type = item.type;
        result.messages[i].message = item.message;
        result.messages[i].attachments = item.attachments;
        result.messages[i].sent = item.sent.getTime()/1000|0;
      });
      res.send(201,result);
    });

  }

};

function postThreadMsgs(req, res, next)
{
  //res.send('postThreadMsgs not available');
  var msg = new MsgDB();
  //msg.thread_id.push(req.params.THREAD_ID);
  msg.type = req.body.type;
  msg.message = (req.body.message !=null)?req.body.message:"";
  msg.fromUser = false;
  msg.attachments = [];
  if (req.body.attachments != null)
    msg.attachments = req.body.attachments;


  LgetAuth();
  function LgetAuth()
  {
    var query = ProviderDB.find({"username":req.authorization.basic.username, "password":req.authorization.basic.password}).limit(1).select('_id')
    query.exec(function(err,items){
      if (items.length == 0)
        res.send(401);
      else
      {
        msg.sender.name = items[0].name;
        msg.sender.id = items[0]._id;
        msg.sender.type = 'provider';
        LauthOk();
      }
    });
  }
  var reply = {};
  function LauthOk(){
     reply.text = req.body.message;
     reply.attachments = msg.attachments;
    ThreadDB.find({"_id": req.params.THREAD_ID}).limit(1).exec(function(err,items){
      findChanel(items);
    });
  }
  function findChanel(items)
  {
    msg.ChanelId = items[0].consumer;
    ChanelDB.findOne({"_id":items[0].consumer}).exec(LonThread);

  }
  function LonThread(err,item)
  {
    if (item==null)
    {
      finish(true);
      return;
    }
    reply.to = item.from;
    reply.from = item.to;
    finish(false);
  }
  function finish(err)
  {
    var result = {};
    if (!err)
    {
      sendMessage1(reply);
      msg.save();
      ThreadDB.update({"_id":req.params.THREAD_ID},{$push:{msgs:msg._id}},function(err, num){});
      result.sent = msg.sent.getTime()/1000|0;
      result.type = msg.type;
      result.message = msg.message;
      result.id = msg._id;
      result.sender = msg.sender;
      result.attachments = msg.attachments;

    }

    res.contentType = 'application/json';
    res.charset = 'utf-8';
    res.send(201,result);

  }
};

function postAPNs(req, res, next)
{
  if (req.body.token==null)
    return res.send(201);
  ProviderDB.find({"token": req.body.token}).limit(1).exec(function(err,items){
    if (items.length==0)
    {
      var provider = new ProviderDB({});
      provider.token = req.body.token;
      provider.save();
    }
  });
  res.send(201);
};

///END new API function
// function getContentMsg(req, res, next)
// {
//
//   MsgTmpShema.find().sort({"from.address": 1}).exec(function(err,items)
//   {
//     res.contentType = 'application/json';
//         res.charset = 'utf-8';
//         res.send(items);
//         for (var i = 0; i<items.length; i++)
//         {
//           items[i].unRead = false;
//           items[i].save();
//         }
//         res.send(items);
//   });
// }
// function sendMessageFromProvider(req, res, next)
// {
//
//   console.log(req.body.text);
//
//
//   var reply = {
//                   replyToMessageId: req.body.id,
//                   to: req.body.from,
//                   from: req.body.to,
//                   text: req.body.text
//               };
//               sendMessage1(reply);
//   res.send('Message maybe sended');
// };
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
// var OnTimer1 = function()
// {
//   MyMonngooseShema.find(function(err, exmpl1) {
//     if (err) return console.error(err);
//     // console.dir(exmpl1);
//     for (var i = 0; i<exmpl1.length; i++)
//     {
//         console.log("record %d send to chatid %s username %s",i,exmpl1[i].from.channelId,exmpl1[i].from.name);
//         var reply = {
//                 replyToMessageId: exmpl1[i].id,
//                 to: exmpl1[i].from,
//                 from: exmpl1[i].to,
//                 text: 'timeout spam'
//             };
//             //console.dir(exmpl1.to);
//         sendMessage1(reply);
//     };
//
//   });
//   //clearTimeout(timeout1);
// };
//
// var timeout1 = null;// = setInterval(OnTimer1,10*1000);
// Setup Restify Server
server.post('/api/messages', bot.verifyBotFramework(), bot.listen());
mongoose.connect("mongodb://test:test@ds035485.mlab.com:35485/telegrambot");
