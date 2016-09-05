var restify = require('restify');
var builder = require('botbuilder');
var apns = require("apns");
var WebSocketServer = require('ws').Server;
var db = require("./db");
// constants data

var port = process.env.PORT || 3011;
var msAppId = process.env.MICROSOFT_APP_ID;
var msAppPassword = process.env.MICROSOFT_APP_PASSWORD;
var LUISurl = process.env.LUIS_URL;

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

// APNS
var connection = new apns.Connection(options);

// Create chat bot
var connector = new builder.ChatConnector({
  appId: msAppId,
  appPassword: msAppPassword
});
var bot = new builder.UniversalBot(connector);
var recognizer = new builder.LuisRecognizer(LUISurl);
var intents = new builder.IntentDialog({ recognizeMode: builder.RecognizeMode.onBegin, recognizers: [recognizer] });

server.post('/api/messages', connector.listen());


// bot.dialog('/',function(session){
//
// });
// bot.dialog('/', intents);
bot.dialog('/',[
  function(session){
    // session.userData = {};
    // session.dialogData = {};
    console.log("HERE DIALOG ");
    var msg = new builder.Message(session);
    msg.sourceEvent({
        telegram: {
            method: "sendMessage",
            parameters: {
                // text: "This is a reply keyboard",
                // parse_mode: "Markdown",
                reply_markup: JSON.stringify({
                    "hide_keyboard": true
                })
            }
        }
    });
    session.send(msg);
// msg.sourceEvent({
//     telegram: {
//         method: "sendMessage",
//         parameters: {
//             // text: "This is a reply keyboard",
//             parse_mode: "Markdown",
//             reply_markup: JSON.stringify({
//                 "keyboard": [
//                     [{ text: "_1_" }, { text: "2" }, { text: "3" }],
//                     [{ text: "*4*" }, { text: "5" }, { text: "6" }],
//                     [{ text: "7" }, { text: "8" }, { text: "9" }],
//                     [{ text: "*" }, { text: "0" }, { text: "#" }]
//                 ],
//                 "one_time_keyboard" : true
//             })
//         }
//     }
// });
// // session.send(msg);
    db.AddChanel(session.message)
      .then(function(response){
        db.GetUserData(session.message)
          .then(function(response){
            if (response)
            {
              session.userData.subscribe = response.subscribe;
              session.userData.profile = response.profile;
            }

            session.beginDialog('/welcome', session.userData);
          });
      });

  },
  function(session,results){
    if (results.response.profile != null)
    {
      session.userData = results.response;
      db.UpdateUserData(session.message.address,session.userData)
        .then(function(response){
          console.log("HERE UpdateUserData then");
            if (response==1){
              session.send('Спасибо, %(name)s, я это запомню. Ты %(sex)s, носишь одежду с %(choiceClothesSmallstr)s по %(choiceClothesLargestr)s, а обувь c %(choiceShoesSmallstr)s по %(choiceShoesLargestr)s', session.userData.profile);
            }else{
              botDialog(session);
            }
        });

    }
  }]);

var choiceFirst = ["Как я буду это делать?","Что я могу сейчас?"];
var choiceSubscribe = ["Конечно, присылай","Лучше поиск скорее включи"];
bot.dialog('/welcome',[
  function(session,args,next){
    // session.dialogData = {};
    if (args == null)
      args = {};
    console.log(args);
    session.dialogData.subscribe = args.subscribe || {};
    session.dialogData.profile = args.profile || {};
    if (!session.dialogData.subscribe.firstChoice)
    {
      builder.Prompts.choice(session,'Привет, я бот, который найдет для тебя любой предмет гардероба. Спроси меня:',choiceFirst);
    }
    else {
      next();
    }
  },
  function(session,results,next){
    if (results.response){
      session.dialogData.subscribe.firstChoice = results.response.index;
    }
    switch (session.dialogData.subscribe.firstChoice) {
      case 0:
        session.send("Я - бот-консультант, который сотрудничает со множеством дизайнеров, \
                      магазинов одежды, обуви и аксессуаров, чтобы помочь тебе быстро найти то, что ты хочешь. \
                      Пока я только учусь понимать людей с полуслова, \
                      но всего через пару месяцев стану квалифицированным шоппинг-консультантом и обязательно закачу по этому поводу вечеринку с шампанским [эмоджи с шампанским]\
                       Так что подписывайся, чтобы первое приглашение пришло именно тебе;)");
        session.dialogData = {};
        session.endDialog();
        break;
      case 1:
          session.dialogData.subscribe.firstChoice = 2;
          builder.Prompts.choice(session,"Скоро я начну работать на полную. \
                                А пока могу раз в неделю присылать тебе информацию о новинках в шоурумах, \
                                с которыми я сотрудничаю. Хочешь?",choiceSubscribe);
        break;
      case 2:
        next();
        break;
      default:
        session.send(session,"К сожелению, я не понял твоего ответа:-(");
        session.dialogData = {};
        session.endDialog();
    }
  },
  function(session,results){
    if (results.response){
      session.dialogData.subscribe.profile = results.response.index;
    }
    switch (session.dialogData.subscribe.profile) {
      case 0:
        session.beginDialog('/ensureProfile', session.dialogData.profile);
        break;
      case 1:
        session.send("Я постараюсь как можно скорее сделать поиск.");
        session.endDialog();
        break;
      default:

    }

  },
  function(session,results){
    session.dialogData.profile = results.response;
    session.endDialogWithResult({response: session.dialogData});
  }
]);

  var choiceSex = ["Джентельмен","Леди"];
  var choiceClothes = ["Обувь","Одежда"];
  var choiceClothesSize = ["XXS","XS","S","M","L","XL","XXL"];
  var choiceShoesSize = ["35","36","37","38","39","40","41","42"];

  bot.dialog('/ensureProfile', [
      function (session, args, next) {
        // session.dialogData = {};
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
              builder.Prompts.choice(session, "" + session.dialogData.profile.name + ", ты джентльмен или леди? Не то что бы сомневался, но лучше, если ты подтвердишь мои догадки",choiceSex);
          } else {
              next();
          }
      },
      function (session, results, next) {
          if (results.response) {
            session.dialogData.profile.sex = results.response.entity;
          }
          if (!session.dialogData.profile.choiceClothesSmall) {
              session.send("Не сочти за нескромность, это исключительно ради работы!\
                            Какого размера вещи мне стоит подбирать для тебя?");
              builder.Prompts.choice(session, "Начиная с какого размера одежду ты носишь?",choiceClothesSize);
          } else {
              next();
          }
      },
      function (session, results, next) {
          if (results.response) {
            session.dialogData.profile.choiceClothesSmall = results.response.index;
            session.dialogData.profile.choiceClothesSmallstr = results.response.entity;
          }
          if (!session.dialogData.profile.choiceClothesLarge) {
            var choiceClothesSizeLarge = choiceClothesSize.slice(session.dialogData.profile.choiceClothesSmall);
              builder.Prompts.choice(session, "И какой размер одежды уже великоват для тебя?",choiceClothesSizeLarge);
          } else {
              next();
          }
      },
      function (session, results, next) {
          if (results.response) {
            session.dialogData.profile.choiceClothesLarge = results.response.index+session.dialogData.profile.choiceClothesSmall;
            session.dialogData.profile.choiceClothesLargestr = choiceClothesSize[session.dialogData.profile.choiceClothesLarge];
          }
          if (!session.dialogData.profile.choiceShoesSmall) {
            session.send("И еще пару вопросов про размер обуви");
            builder.Prompts.choice(session, "С какого размера обувь носишь?",choiceShoesSize);
          } else {
              next();
          }
      },
      function (session, results, next) {
          if (results.response) {
            session.dialogData.profile.choiceShoesSmall = results.response.index;
            session.dialogData.profile.choiceShoesSmallstr = results.response.entity;

          }
          if (!session.dialogData.profile.choiceShoesLarge) {
            var choiceShoesSizeLarge = choiceShoesSize.slice(session.dialogData.profile.choiceShoesSmall);
              builder.Prompts.choice(session, "И какой размер обуви уже великоват для тебя?",choiceShoesSizeLarge);
          } else {
              next();
          }
      },
      function (session, results) {
          if (results.response) {
              session.dialogData.profile.choiceShoesLarge = results.response.index+session.dialogData.profile.choiceShoesSmall;
              session.dialogData.profile.choiceShoesLargestr = choiceShoesSize[session.dialogData.profile.choiceShoesLarge];
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
}

// bot Functions
function botDialog(session) {
  console.log("botDialog");
  // console.log(session);
  session.beginDialog('/LUISintent');
  session.send();
  // just test APNS
  var notification = new apns.Notification();
  notification.alert = "Hello World !";
  db.APNSDB.find().exec(function(err, items) {
    items.forEach(function(item) {
      notification.device = new apns.Device(item.token);
      connection.sendNotification(notification);
    });
  });
  // end test
  var recvedMsg = session.message;
  ServerMsg = 'HERE';

  // new API
  db.ChanelDB.findOne({
    'address.user.id': recvedMsg.address.user.id
  }, function(err, item) {

    if (err) return console.error(err);
    if (item === null) {
      var record = new db.ChanelDB(recvedMsg);
      if (recvedMsg.sourceEvent != null) {
        record.username = recvedMsg.sourceEvent.message.from.first_name + ' ' +
          recvedMsg.sourceEvent.message.from.last_name;
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
    /*db.WelcomeMsgDB.find().limit(1).sort({
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
    });*/
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

bot.dialog('/LUISintent',intents);

intents.matches('помощь',
  function(session, args, next){
    console.log("HERE HELP");
    console.log(session.message.text);
    session.send("Покупатель попросил помощи");
    session.endDialog();
});



intents.matches('хочу',[
    function (session, args, next) {
      console.log("HERE WHANT");
      var promise = new Promise(function(resolve,reject){
      console.log("HERE хочу");
      console.log(session.message.text);
      if (args.entities.length == 0) next();
        // Process optional entities received from LUIS
        var match;
        var entities = builder.EntityRecognizer.findAllEntities(args.entities, 'предмет');
        console.log("find entities");
        console.log(entities);
        var msgToSend = "Обнаружены желания купить: ";
        for (var i = 0; i<entities.length; i++)
          msgToSend += entities[i].entity + ", ";
        msgToSend += "Сообщение будет разослано (теги, продавец): \n\n";

        if (entities.length) {
          db.GetAllProviders()
            .then(function(response){
              var providers = [];
              for (var i = 0; i<response.length; i++)
              {
                  // match = builder.EntityRecognizer.findBestMatch(response[i].tags, entity.entity);
                  var mustSend = false;
                  for (var j = 0; j<entities.length; j++)
                  {
                    match = builder.EntityRecognizer.findAllMatches(response[i].tags, entities[j].entity);
                    if (match.length) {
                      mustSend = true;
                      msgToSend += match[0].entity + ", "
                    }
                  }
                  if (mustSend) {
                    providers[providers.length] = response[i];
                    msgToSend+= "Продавец: "+ response[i].name + " \n\n";
                  }
              }
              if (providers.length == 0)
                msgToSend += "Cообщение будет отправлено админу"
              return resolve(msgToSend);
            });

        }
      })
      .then(function(response){
        console.log(response);
        // console.log(session);
        session.send(response);
        session.endDialog();
      });

},
function(session,args){
  session.send("Понял что есть желание, но не понял чего именно хотите");
  session.endDialog();
}]);
intents.onBegin(function (session, args, next) {
    console.log("onBegin");
    next();
});
intents.onDefault(function(session){
  console.log("HERE INTENTS onDefault");
  console.log(session.message.text);
  session.send("Не смог понять чего хотят");
  session.endDialog();
});
