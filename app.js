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

server.post('/api/messages', connector.listen());
bot.dialog('/', [
    function (session) {
        // Send a greeting and show help.
        var card = new builder.HeroCard(session)
            .title("Microsoft Bot Framework")
            .text("Your bots - wherever your users are talking.")
            .images([
                 builder.CardImage.create(session, "http://docs.botframework.com/images/demo_bot_image.png")
            ]);
        var msg = new builder.Message(session).attachments([card]);
        session.send(msg);
        session.send("Hi... I'm the Microsoft Bot Framework demo bot for Skype. I can show you everything you can use our Bot Builder SDK to do on Skype.");
        session.beginDialog('/help');
    },
    function (session, results) {
        // Display menu
        session.beginDialog('/menu');
    },
    function (session, results) {
        // Always say goodbye
        session.send("Ok... See you later!");
    }
]);

bot.dialog('/menu', [
    function (session) {
        builder.Prompts.choice(session, "What demo would you like to run?", "prompts|picture|cards|list|carousel|receipt|actions|(quit)");
    },
    function (session, results) {
        if (results.response && results.response.entity != '(quit)') {
            // Launch demo dialog
            session.beginDialog('/' + results.response.entity);
        } else {
            // Exit the menu
            session.endDialog();
        }
    },
    function (session, results) {
        // The menu runs a loop until the user chooses to (quit).
        session.replaceDialog('/menu');
    }
]).reloadAction('reloadMenu', null, { matches: /^menu|show menu/i });

bot.dialog('/help', [
    function (session) {
        session.endDialog("Global commands that are available anytime:\n\n* menu - Exits a demo and returns to the menu.\n* goodbye - End this conversation.\n* help - Displays these commands.");
    }
]);

bot.dialog('/prompts', [
    function (session) {
        session.send("Our Bot Builder SDK has a rich set of built-in prompts that simplify asking the user a series of questions. This demo will walk you through using each prompt. Just follow the prompts and you can quit at any time by saying 'cancel'.");
        builder.Prompts.text(session, "Prompts.text()\n\nEnter some text and I'll say it back.");
    },
    function (session, results) {
        session.send("You entered '%s'", results.response);
        builder.Prompts.number(session, "Prompts.number()\n\nNow enter a number.");
    },
    function (session, results) {
        session.send("You entered '%s'", results.response);
        session.send("Bot Builder includes a rich choice() prompt that lets you offer a user a list choices to pick from. On Skype these choices by default surface using buttons if there are 3 or less choices. If there are more than 3 choices a numbered list will be used but you can specify the exact type of list to show using the ListStyle property.");
        builder.Prompts.choice(session, "Prompts.choice()\n\nChoose a list style (the default is auto.)", "auto|inline|list|button|none");
    },
    function (session, results) {
        var style = builder.ListStyle[results.response.entity];
        builder.Prompts.choice(session, "Prompts.choice()\n\nNow pick an option.", "option A|option B|option C", { listStyle: style });
    },
    function (session, results) {
        session.send("You chose '%s'", results.response.entity);
        builder.Prompts.confirm(session, "Prompts.confirm()\n\nSimple yes/no questions are possible. Answer yes or no now.");
    },
    function (session, results) {
        session.send("You chose '%s'", results.response ? 'yes' : 'no');
        builder.Prompts.time(session, "Prompts.time()\n\nThe framework can recognize a range of times expressed as natural language. Enter a time like 'Monday at 7am' and I'll show you the JSON we return.");
    },
    function (session, results) {
        session.send("Recognized Entity: %s", JSON.stringify(results.response));
        builder.Prompts.attachment(session, "Prompts.attachment()\n\nYour bot can wait on the user to upload an image or video. Send me an image and I'll send it back to you.");
    },
    function (session, results) {
        var msg = new builder.Message(session)
            .ntext("I got %d attachment.", "I got %d attachments.", results.response.length);
        results.response.forEach(function (attachment) {
            msg.addAttachment(attachment);
        });
        session.endDialog(msg);
    }
]);

bot.dialog('/picture', [
    function (session) {
        session.send("You can easily send pictures to a user...");
        var msg = new builder.Message(session)
            .attachments([{
                contentType: "image/jpeg",
                contentUrl: "http://www.theoldrobots.com/images62/Bender-18.JPG"
            }]);
        session.endDialog(msg);
    }
]);

bot.dialog('/cards', [
    function (session) {
        session.send("You can use Hero & Thumbnail cards to send the user visually rich information...");

        var msg = new builder.Message(session)
            .textFormat(builder.TextFormat.xml)
            .attachments([
                new builder.HeroCard(session)
                    .title("Hero Card")
                    .subtitle("Space Needle")
                    .text("The <b>Space Needle</b> is an observation tower in Seattle, Washington, a landmark of the Pacific Northwest, and an icon of Seattle.")
                    .images([
                        builder.CardImage.create(session, "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Seattlenighttimequeenanne.jpg/320px-Seattlenighttimequeenanne.jpg")
                    ])
                    .tap(builder.CardAction.openUrl(session, "https://en.wikipedia.org/wiki/Space_Needle"))
            ]);
        session.send(msg);

        msg = new builder.Message(session)
            .textFormat(builder.TextFormat.xml)
            .attachments([
                new builder.ThumbnailCard(session)
                    .title("Thumbnail Card")
                    .subtitle("Pikes Place Market")
                    .text("<b>Pike Place Market</b> is a public market overlooking the Elliott Bay waterfront in Seattle, Washington, United States.")
                    .images([
                        builder.CardImage.create(session, "https://upload.wikimedia.org/wikipedia/en/thumb/2/2a/PikePlaceMarket.jpg/320px-PikePlaceMarket.jpg")
                    ])
                    .tap(builder.CardAction.openUrl(session, "https://en.wikipedia.org/wiki/Pike_Place_Market"))
            ]);
        session.endDialog(msg);
    }
]);

bot.dialog('/list', [
    function (session) {
        session.send("You can send the user a list of cards as multiple attachments in a single message...");

        var msg = new builder.Message(session)
            .textFormat(builder.TextFormat.xml)
            .attachments([
                new builder.HeroCard(session)
                    .title("Hero Card")
                    .subtitle("Space Needle")
                    .text("The <b>Space Needle</b> is an observation tower in Seattle, Washington, a landmark of the Pacific Northwest, and an icon of Seattle.")
                    .images([
                        builder.CardImage.create(session, "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Seattlenighttimequeenanne.jpg/320px-Seattlenighttimequeenanne.jpg")
                    ]),
                new builder.ThumbnailCard(session)
                    .title("Thumbnail Card")
                    .subtitle("Pikes Place Market")
                    .text("<b>Pike Place Market</b> is a public market overlooking the Elliott Bay waterfront in Seattle, Washington, United States.")
                    .images([
                        builder.CardImage.create(session, "https://upload.wikimedia.org/wikipedia/en/thumb/2/2a/PikePlaceMarket.jpg/320px-PikePlaceMarket.jpg")
                    ])
            ]);
        session.endDialog(msg);
    }
]);

bot.dialog('/carousel', [
    function (session) {
        session.send("You can pass a custom message to Prompts.choice() that will present the user with a carousel of cards to select from. Each card can even support multiple actions.");

        // Ask the user to select an item from a carousel.
        var msg = new builder.Message(session)
            .textFormat(builder.TextFormat.xml)
            .attachmentLayout(builder.AttachmentLayout.carousel)
            .attachments([
                new builder.HeroCard(session)
                    .title("Space Needle")
                    .text("The <b>Space Needle</b> is an observation tower in Seattle, Washington, a landmark of the Pacific Northwest, and an icon of Seattle.")
                    .images([
                        builder.CardImage.create(session, "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Seattlenighttimequeenanne.jpg/320px-Seattlenighttimequeenanne.jpg")
                            .tap(builder.CardAction.showImage(session, "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Seattlenighttimequeenanne.jpg/800px-Seattlenighttimequeenanne.jpg")),
                    ])
                    .buttons([
                        builder.CardAction.openUrl(session, "https://en.wikipedia.org/wiki/Space_Needle", "Wikipedia"),
                        builder.CardAction.imBack(session, "select:100", "Select")
                    ]),
                new builder.HeroCard(session)
                    .title("Pikes Place Market")
                    .text("<b>Pike Place Market</b> is a public market overlooking the Elliott Bay waterfront in Seattle, Washington, United States.")
                    .images([
                        builder.CardImage.create(session, "https://upload.wikimedia.org/wikipedia/en/thumb/2/2a/PikePlaceMarket.jpg/320px-PikePlaceMarket.jpg")
                            .tap(builder.CardAction.showImage(session, "https://upload.wikimedia.org/wikipedia/en/thumb/2/2a/PikePlaceMarket.jpg/800px-PikePlaceMarket.jpg")),
                    ])
                    .buttons([
                        builder.CardAction.openUrl(session, "https://en.wikipedia.org/wiki/Pike_Place_Market", "Wikipedia"),
                        builder.CardAction.imBack(session, "select:101", "Select")
                    ]),
                new builder.HeroCard(session)
                    .title("EMP Museum")
                    .text("<b>EMP Musem</b> is a leading-edge nonprofit museum, dedicated to the ideas and risk-taking that fuel contemporary popular culture.")
                    .images([
                        builder.CardImage.create(session, "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Night_Exterior_EMP.jpg/320px-Night_Exterior_EMP.jpg")
                            .tap(builder.CardAction.showImage(session, "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Night_Exterior_EMP.jpg/800px-Night_Exterior_EMP.jpg"))
                    ])
                    .buttons([
                        builder.CardAction.openUrl(session, "https://en.wikipedia.org/wiki/EMP_Museum", "Wikipedia"),
                        builder.CardAction.imBack(session, "select:102", "Select")
                    ])
            ]);
        builder.Prompts.choice(session, msg, "select:100|select:101|select:102");
    },
    function (session, results) {
        var action, item;
        var kvPair = results.response.entity.split(':');
        switch (kvPair[0]) {
            case 'select':
                action = 'selected';
                break;
        }
        switch (kvPair[1]) {
            case '100':
                item = "the <b>Space Needle</b>";
                break;
            case '101':
                item = "<b>Pikes Place Market</b>";
                break;
            case '102':
                item = "the <b>EMP Museum</b>";
                break;
        }
        session.endDialog('You %s "%s"', action, item);
    }
]);

bot.dialog('/receipt', [
    function (session) {
        session.send("You can send a receipts for purchased good with both images and without...");

        // Send a receipt with images
        var msg = new builder.Message(session)
            .attachments([
                new builder.ReceiptCard(session)
                    .title("Recipient's Name")
                    .items([
                        builder.ReceiptItem.create(session, "$22.00", "EMP Museum").image(builder.CardImage.create(session, "https://upload.wikimedia.org/wikipedia/commons/a/a0/Night_Exterior_EMP.jpg")),
                        builder.ReceiptItem.create(session, "$22.00", "Space Needle").image(builder.CardImage.create(session, "https://upload.wikimedia.org/wikipedia/commons/7/7c/Seattlenighttimequeenanne.jpg"))
                    ])
                    .facts([
                        builder.Fact.create(session, "1234567898", "Order Number"),
                        builder.Fact.create(session, "VISA 4076", "Payment Method"),
                        builder.Fact.create(session, "WILLCALL", "Delivery Method")
                    ])
                    .tax("$4.40")
                    .total("$48.40")
            ]);
        session.send(msg);

        // Send a receipt without images
        msg = new builder.Message(session)
            .attachments([
                new builder.ReceiptCard(session)
                    .title("Recipient's Name")
                    .items([
                        builder.ReceiptItem.create(session, "$22.00", "EMP Museum"),
                        builder.ReceiptItem.create(session, "$22.00", "Space Needle")
                    ])
                    .facts([
                        builder.Fact.create(session, "1234567898", "Order Number"),
                        builder.Fact.create(session, "VISA 4076", "Payment Method"),
                        builder.Fact.create(session, "WILLCALL", "Delivery Method")
                    ])
                    .tax("$4.40")
                    .total("$48.40")
            ]);
        session.endDialog(msg);
    }
]);

bot.dialog('/signin', [
    function (session) {
        // Send a signin
        var msg = new builder.Message(session)
            .attachments([
                new builder.SigninCard(session)
                    .text("You must first signin to your account.")
                    .button("signin", "http://example.com/")
            ]);
        session.endDialog(msg);
    }
]);


bot.dialog('/actions', [
    function (session) {
        session.send("Bots can register global actions, like the 'help' & 'goodbye' actions, that can respond to user input at any time. You can even bind actions to buttons on a card.");

        var msg = new builder.Message(session)
            .textFormat(builder.TextFormat.xml)
            .attachments([
                new builder.HeroCard(session)
                    .title("Hero Card")
                    .subtitle("Space Needle")
                    .text("The <b>Space Needle</b> is an observation tower in Seattle, Washington, a landmark of the Pacific Northwest, and an icon of Seattle.")
                    .images([
                        builder.CardImage.create(session, "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Seattlenighttimequeenanne.jpg/320px-Seattlenighttimequeenanne.jpg")
                    ])
                    .buttons([
                        builder.CardAction.dialogAction(session, "weather", "Seattle, WA", "Current Weather")
                    ])
            ]);
        session.send(msg);

        session.endDialog("The 'Current Weather' button on the card above can be pressed at any time regardless of where the user is in the conversation with the bot. The bot can even show the weather after the conversation has ended.");
    }
]);

// Create a dialog and bind it to a global action
bot.dialog('/weather', [
    function (session, args) {
        session.endDialog("The weather in %s is 71 degrees and raining.", args.data);
    }
]);
// bot.dialog('/',function(session){
//
// });
// bot.dialog('/', botDialog);
/*bot.dialog('/',[
  function(session){
    console.log("RECV msg");
    // session.userData = {};
    // session.dialogData = {};
    console.log(session.userData);
    session.beginDialog('/welcome', session.userData);
  },
  function(session,results){
    console.log(results);
    if (results.response.profile != null)
    {
      session.userData = results.response;
      console.log(session.userData);
      session.send('Спасибо, %(name)s, я это запомню. Ты %(sex)s, носишь %(choice)s', session.userData.profile);
    }
  }]);*/

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
          if (!session.dialogData.profile.choice) {
              builder.Prompts.choice(session, "Не сочти за нескромность, это исключительно ради работы!\
                                          Какого размера вещи мне стоит подбирать для тебя?",choiceClothes);
          } else {
              next();
          }
      },
      function (session, results) {
          if (results.response) {
              session.dialogData.profile.choice = results.response.entity;
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
