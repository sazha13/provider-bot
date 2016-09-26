var restify = require('restify');
var builder = require('botbuilder');
var webSock = require('./webSock');
var httpServ = require('./httpServ');

var db = require('./db');
var botFunc = require('./botFunc');
// constants data

var port = process.env.PORT || 3011;

// Setup Restify Server
var server = restify.createServer();
server.listen(port, function() {
  console.log('%s listening to %s', server.name, server.url);
});
// WebSocket
webSock.addServer(server);

server.post('/api/messages', botFunc.connector.listen());

// REST API
server.get('/', httpServ.respond);
server.post('/request', httpServ.handleRequestMessage);

server.use(restify.acceptParser(server.acceptable));
server.use(restify.bodyParser());
server.use(restify.authorizationParser());

server.get('/thread', httpServ.getThreads);
server.get('/thread/:THREAD_ID/messages', httpServ.getThreadMsgs);
server.post('/thread/:THREAD_ID/messages', httpServ.postThreadMsgs);
// server.post('/apns', httpServ.postAPNs);
// server.post('/createProvider', httpServ.postCreateProvider);
server.post('/thread/:THREAD_ID/message_seen/:MSG_ID', httpServ.postThreadMsgSeen);
server.post('/createShop',httpServ.postCreateShop);
server.post('/createOperator',httpServ.postCreateOperator);
server.post('/createConsultant',httpServ.postCreateConsultant);

server.post('/thread/:THREAD_ID/request',httpServ.postThreadRequest);
server.post('/thread/:THREAD_ID/response',httpServ.postThreadResponse);
// server.get('/shop/:SHOP_ID/request',httpServ.getShopRequest);
server.get('/consultant/request',httpServ.getConsultantRequest);
server.get('/shops',httpServ.getShops);
server.get('/operator',httpServ.getOperator);
server.get('/thread/:THREAD_ID/user',httpServ.getThreadUser);
server.get('/order/:ORDER_ID',httpServ.getOrder);
server.get('/shopItem/:SHOP_ITEM_ID',httpServ.getShopItem);

// REST API functions

/*
function postCreateProvider(req, res, next) {
  res.contentType = 'application/json';
  res.charset = 'utf-8';
  if (req.authorization === null ||
    req.authorization.basic.username === null ||
    req.authorization.basic.password === null) {
    res.send(401);
    return;
  }
  db.ProviderDB.find({
    'username': req.authorization.basic.username
  }).limit(1).exec(function(err, items) {
    if (items.length === 0) {
      var record = new db.ProviderDB({
        "name": req.body.name
      });
      record.username = req.authorization.basic.username;
      record.password = req.authorization.basic.password;
      record.tags = [];
      record.save();
      res.send(201);
    } else {
      res.send(401);
    }
  });
}

function getThreads(req, res, next) {
  res.contentType = 'application/json';
  res.charset = 'utf-8';
  var result = [];
  var tmpResult = [];
  var CountLastmesage;
  var CountConsumer;
  LgetAuth();

  function LgetAuth() {
    var query = db.ProviderDB.find({
      "username": req.authorization.basic.username,
      "password": req.authorization.basic.password
    }).limit(1).select('_id');
    query.exec(function(err, items) {
      if (items.length === 0)
        res.send(401);
      else {
        LgetThreads(items[0]._id);
      }
    });
  }

  function LgetThreads(providerId) {
    var query = db.ThreadDB.find({
      "provider": providerId
    });
    query.exec(LonThreads);
  }

  function LonThreads(err, items) {
    if (items.length === 0) {
      finish();
      return;
    }
    var itemsProcessed = 0;
    items.forEach(function(item, i, items) {
      result.push({});
      tmpResult.push(item);
      tmpResult[i].last_seen = (item.last_seen === null) ? 0 : item.last_seen;
      result[i].thread_id = item._id;
      // result[i].name = item.from.name;
      if (++itemsProcessed === items.length) {
        LWriteOther();
      };
    });

    function LWriteOther() {
      tmpResult.forEach(function(item, i) {
        LgetConsumer(item.consumer, i);
        LgetThreadLastMsg(item.msgs);
      });
    }

    function LgetConsumer(consumer_id, i) {
      // tekI = i;
      CountConsumer = 0;
      var query = db.ChanelDB.find({
        "_id": consumer_id
      }).limit(1);
      query.exec(LonConsumer);
    }

    function LonConsumer(err, items) {
      for (var i = 0; i < tmpResult.length; i++) {
        if (tmpResult[i].consumer != items[0]._id) {
          continue;
        }
        result[i].consumer = {};
        result[i].consumer.name = items[0].username;
        result[i].consumer.id = items[0]._id;
        result[i].consumer.type = 'consumer';
        LCheckConsumers();
        return;
      }
    }

    function LgetThreadLastMsg(msgs) {

      CountLastmesage = 0;
      var query = db.MsgDB.find().in("_id", msgs).sort({
        "sent": -1
      });
      query.exec(LonThreadLastMessage);
    }

    function LonThreadLastMessage(err, item) {
      for (var i = 0; i < tmpResult.length; i++) {
        if (tmpResult[i].msgs.indexOf(item[0]._id) === -1) {
          continue;
        }
        tmpResult[i].msgs = [];
        result[i].last_message = {};
        result[i].last_message.sent = item[0].sent.getTime() / 1000 | 0;
        result[i].last_message.type = item[0].type;
        result[i].last_message.message = item[0].message;
        result[i].last_message.sender = item[0].sender;
        result[i].last_message.id = item[0]._id;
        result[i].last_message.attachments = [];
        if (item[0].attachments !== null)
          result[i].last_message.attachments = item[0].attachments;
        result[i].unseen_count = 0;
        for (var j = 0; j < item.length && item[j]._id > tmpResult[i].last_seen; j++) {
          if (item[j].fromUser === true)
            result[i].unseen_count++
        }
        result[i].last_message.unseen = (result[i].unseen_count > 0 && item[0].fromUser) ? 1 : 0;
        LCheckLastMsgs();
        return;
      }
    }

    function LCheckLastMsgs() {
      CountLastmesage++;
      WaitAll();
    }

    function LCheckConsumers() {
      CountConsumer++;
      WaitAll();
    }

    function WaitAll() {
      if (CountLastmesage === result.length && CountConsumer === result.length)
        finish();
    }

  }

  function finish() {
    res.send(result);
  }
}

function getThreadMsgs(req, res, next) {
  var result = {
    "messages": []
  };
  res.contentType = 'application/json';
  res.charset = 'utf-8';
  LgetAuth();
  var last_seen = 0;

  function LgetAuth() {
    var query = db.ProviderDB.find({
      "username": req.authorization.basic.username,
      "password": req.authorization.basic.password
    }).limit(1).select('_id')
    query.exec(function(err, items) {
      if (items.length === 0)
        res.send(401);
      else {
        LauthOk();
      }
    });
  }

  function LauthOk() {
    db.ThreadDB.find({
      "_id": req.params.THREAD_ID
    }).limit(1).exec(function(err, items) {
      last_seen = items[0].last_seen;
      findmsgs(items[0].msgs);
    });
  }

  function findmsgs(msgsId) {
    db.MsgDB.find().in("_id", msgsId).sort({
      "sent": -1
    }).exec(function(err, items) {
      // items.forEach(function(item)
      for (var i = 0; i < items.length; i++) {
        var item = items[i];
        result.messages.push({});
        // var i = result.messages.length-1;
        result.messages[i].id = item._id;
        result.messages[i].sender = item.sender;
        result.messages[i].type = item.type;
        result.messages[i].message = item.message;
        result.messages[i].attachments = item.attachments;
        result.messages[i].sent = item.sent.getTime() / 1000 | 0;
        result.messages[i].unseen = (item.fromUser && item._id > last_seen) ? 1 : 0;
      }
      res.send(201, result);
    });
  }
}

function postThreadMsgs(req, res, next) {
  var msg = new db.MsgDB({});
  // msg.thread_id.push(req.params.THREAD_ID);
  msg.type = req.body.type;
  msg.message = (req.body.message !== null) ? req.body.message : "";
  msg.fromUser = false;
  msg.attachments = [];
  if (req.body.attachments !== null)
    msg.attachments = req.body.attachments;

  LgetAuth();

  function LgetAuth() {
    var query = db.ProviderDB.find({
      "username": req.authorization.basic.username,
      "password": req.authorization.basic.password
    }).limit(1).select('_id')
    query.exec(function(err, items) {
      if (items.length === 0)
        res.send(401);
      else {
        msg.sender.name = items[0].name;
        msg.sender.id = items[0]._id;
        msg.sender.type = 'provider';
        LauthOk();
      }
    });
  }
  var reply = new builder.Message();

  function LauthOk() {
    reply.text(req.body.message);
    reply.attachments(msg.attachments);
    db.ThreadDB.find({"_id": req.params.THREAD_ID}).limit(1).exec(function(err, items) {
      findChanel(items);
    });
  }

  function findChanel(items) {
    msg.ChanelId = items[0].consumer;
    db.ChanelDB.findOne({
      "_id": items[0].consumer
    }).exec(LonThread);

  }

  function LonThread(err, item) {
    if (item === null) {
      finish(true);
      return;
    }
    reply.address(item.address);
    finish(false);
  }

  function finish(err) {
    var result = {};
    if (!err) {
      bot.send(reply,function(err){
      });
      msg.save();
      db.ThreadDB.update({
        "_id": req.params.THREAD_ID
      }, {
        $push: {
          msgs: msg._id
        }
      }, function(err, num) {});
      result.sent = msg.sent.getTime() / 1000 | 0;
      result.type = msg.type;
      result.message = msg.message;
      result.id = msg._id;
      result.sender = msg.sender;
      result.attachments = msg.attachments;
      result.unseen = 0;
    }

    res.contentType = 'application/json';
    res.charset = 'utf-8';
    res.send(201, result);

  }
};

function postAPNs(req, res, next) {
  if (req.body.token === null)
    return res.send(201);
  db.APNSDB.find({
    "token": req.body.token
  }).limit(1).exec(function(err, items) {
    if (items.length === 0) {
      var provider = new db.APNSDB({});
      provider.token = req.body.token;
      provider.save();
    }
  });
  res.send(201);
};

function postThreadMsgSeen(req, res, next) {
  res.contentType = 'application/json';
  res.charset = 'utf-8';
  LgetAuth();

  function LgetAuth() {
    if (req.authorization === null) {
      res.send(401);
      return;
    }
    var query = db.ProviderDB.find({
      "username": req.authorization.basic.username,
      "password": req.authorization.basic.password
    }).limit(1).select('_id')
    query.exec(function(err, items) {
      if (items.length === 0)
        res.send(401);
      else {

        LauthOk(items[0]._id);
      }
    });
  }

  function LauthOk(providerId) {
    var query = db.ThreadDB.find({
      "provider": providerId,
      "_id": req.params.THREAD_ID
    }).limit(1);
    query.exec(function(err, items) {
      if (err || items[0] === null) {
        res.send(406);
        return;
      }
      if (items[0].msgs.indexOf(req.params.MSG_ID) === -1) {
        res.send(406);
        return;
      }
      items[0].last_seen = req.params.MSG_ID;
      items[0].save();
      res.send(200);
    });
  }
}*/
