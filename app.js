console.log("LOAD restify");
var restify = require('restify');
console.log("LOAD builder");
var builder = require('botbuilder');
console.log("LOAD apns");
var apns = require("apns");
console.log("LOAD WebSocketServer");
var WebSocketServer = require('ws').Server;
console.log("LOAD ./db");
var db = require("./db");
console.log("HERE");
// constants data

var port = process.env.PORT || 3011;
var msAppId = process.env.MICROSOFT_APP_ID;
var msAppPassword = process.env.MICROSOFT_APP_PASSWORD;

var options = {
  keyFile: "cert/213.key.pem",
  certFile: "cert/213.crt.pem",
  debug: true
};
// Setup Restify Server
var server = restify.createServer();
server.listen(port, function() {
  console.log('%s listening to %s', server.name, server.url);
});
console.log("HERE1");
// WebSocket
var wss = new WebSocketServer({
  server
});
wss.on('connection', function(ws) {
  console.log("WS connection add " + wss.clients.length);
  ws.on('close', function(code, message) {
    console.log("WS CLOSE " + wss.clients.length);
  });
});
console.log("HERE2");
// APNS
var connection = new apns.Connection(options);

// Create chat bot
var connector = new builder.ChatConnector({
  appId: msAppId,
  appPassword: msAppPassword
});
var bot = new builder.UniversalBot(connector);

server.post('/api/messages', connector.listen());
console.log("HERE3");
// bot.dialog('/', botDialog);
bot.dialog('/',[
  function(session){
    session.beginDialog('/ensureProfile', session.userData.profile);
  },
  function(session,results){
    session.userData.profile = results.response;
    session.send('Спасибо, %(name)s, я это запомню. Ты %(sex)s, носишь %(choice)s', session.userData.profile);
  }]);

  bot.dialog('/ensureProfile', [
      function (session, args, next) {
          session.dialogData.profile = args || {};
          if (!session.dialogData.profile.name) {
              builder.Prompts.text(session, "Как я могу к тебе обращаться?");
          } else {
              next();
          }
      },
      function (session, results, next) {
          if (results.response) {
              session.dialogData.profile.name = results.response;
          }
          if (!session.dialogData.profile.sex) {
              builder.Prompts.choice(session, "" + session.dialogData.profile.name + ", ты джентльмен или леди? Не то что бы сомневался, но лучше, если ты подтвердишь мои догадки","Джентельмен|Леди");
          } else {
              next();
          }
      },
      function (session, results, next) {
          if (results.response) {
            session.dialogData.profile.sex = results.response;
          }
          if (!session.dialogData.profile.choice) {
              builder.Prompts.choiсe(session, "Не сочти за нескромность, это исключительно ради работы!\
                                          Какого размера вещи мне стоит подбирать для тебя?",["Обувь","Одежда"]);
          } else {
              next();
          }
      },
      function (session, results) {
          if (results.response) {
              session.dialogData.profile.choice = results.response;
          }
          session.endDialogWithResult({ response: session.dialogData.profile });
      }
  ]);


// REST API
server.get('/', respond);
server.post('/request', handleRequestMessage);

server.use(restify.acceptParser(server.acceptable));
server.use(restify.bodyParser());
server.use(restify.authorizationParser());

server.get('/thread', getThreads);
server.get('/thread/:THREAD_ID/messages', getThreadMsgs);
server.post('/thread/:THREAD_ID/messages', postThreadMsgs);
server.post('/apns', postAPNs);
server.post('/createProvider', postCreateProvider);
server.post('/thread/:THREAD_ID/message_seen/:MSG_ID', postThreadMsgSeen);

// REST API functions
var servermsg = " HERE";

function respond(req, res, next) {
  res.contentType = "text/plain";
  res.send(servermsg);
  next();
}

function handleRequestMessage(req, res, next) {
  res.send('POST API Response!!!');
  next();
}

function postCreateProvider(req, res, next) {
  res.contentType = 'application/json';
  res.charset = 'utf-8';
  console.dir(req.authorization);
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
      // console.log("forEach " + result.length);
      // console.log("itemsProcessed "+itemsProcessed);
      result.push({});
      tmpResult.push(item);
      tmpResult[i].last_seen = (item.last_seen === null) ? 0 : item.last_seen;
      result[i].thread_id = item._id;
      // result[i].name = item.from.name;
      if (++itemsProcessed === items.length) {
        // console.log(tmpResult);
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
      // console.log(item);
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
      // console.log(result);
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
    console.log( req.params.THREAD_ID);
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
      console.log(msg);
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
  console.log("thread " + req.params.THREAD_ID + " MSG " + req.params.MSG_ID);
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
}

// bot Functions
function botDialog(session) {
  session.send();
  // just test APNS
  var notification = new apns.Notification();
  notification.alert = "Hello World !";
  db.APNSDB.find().exec(function(err, items) {
    items.forEach(function(item) {
      // console.log(item.token);
      notification.device = new apns.Device(item.token);
      connection.sendNotification(notification);
    });
  });
  // end test
  var recvedMsg = session.message;
  ServerMsg = 'HERE';
  // console.log(session);
  // console.log(session.message.sourceEvent);

  // new API
  db.ChanelDB.findOne({
    'address.user.id': recvedMsg.address.user.id
  }, function(err, item) {

    if (err) return console.error(err);
    if (item === null) {
      var record = new db.ChanelDB(recvedMsg);
      if (recvedMsg.sourceEvent != null) {
        record.username = recvedMsg.sourceEvent.message.from.first_name + ' ' + recvedMsg.sourceEvent.message.from.last_name;
      } else {
        record.username = recvedMsg.address.user.name;
      }
      record.save();
      CheckThreads(record.id, recvedMsg);
    } else {
      CheckThreads(item.id, recvedMsg);
    }
  });

  function CheckThreads(chanelId, recvedMsg) {
    db.WelcomeMsgDB.find().limit(1).sort({
      "added": -1
    }).exec(function(err, items) {
      if (items.length === 0)
        return;
      if (items[0].consumersSended.indexOf(chanelId) === -1) {
        session.send(items[0].message);
        items[0].consumersSended[items[0].consumersSended.length] = chanelId;
        items[0].markModified('consumersSended');
        items[0].save();
        console.log(items[0]);
        // WelcomeMsgDB.update({"_id":items[0]._id},{$push:{consumersSended:chanelId}},function(err, num){});
      }
    });
    db.ThreadDB.find({
      "consumer": chanelId
    }).exec(LonFindConsumers);

    function LonFindConsumers(err, items) {
      if (items.length === 0)
        CreateNewThreads(chanelId, recvedMsg);
      else {
        var msgstr = db.AddUserMsgInDB(chanelId, recvedMsg);
        var msgid = JSON.parse(msgstr)._id;
        SendWSMessage(msgstr);
        db.ThreadDB.update({
          "consumer": chanelId
        }, {
          $push: {
            msgs: msgid
          }
        }, function(err, num) {});
      }
    }

  }

  function CreateNewThreads(chanelId, recvedMsg) {
    var msgstr = db.AddUserMsgInDB(chanelId, recvedMsg);
    var msgid = JSON.parse(msgstr)._id;
    SendWSMessage(msgstr);
    db.ProviderDB.find().exec(AddThread);

    function AddThread(err, items) {
      items.forEach(function(item) {
        var record = new db.ThreadDB({
          "consumer": chanelId,
          "provider": item._id,
          "msgs": [msgid],
          "last_seen": "0"
        });
        record.save();
      });
    }
  }

  function SendWSMessage(record) {
    var record1 = JSON.parse(record);
    var time1 = new Date(JSON.parse(record).sent);
    record1.sent = time1.getTime() / 1000 | 0;
    wss.clients.forEach(SendWSMsg);

    function SendWSMsg(client) {
      var res = {
        "command": 'new_message',
        "data": record1
      };
      client.send(JSON.stringify(res));
    }
  }
}
