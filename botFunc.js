var db = require('./db');
var builder = require('botbuilder');
var onBoard = require('./onBoarding');
var intentDialog = require('./intentDialog');

var msAppId = process.env.MICROSOFT_APP_ID;
var msAppPassword = process.env.MICROSOFT_APP_PASSWORD;

// Create chat bot
var connector = new builder.ChatConnector({
  appId: msAppId,
  appPassword: msAppPassword
});


var bot = new builder.UniversalBot(connector);

// bot.dialog('/',function(session){
//
// });
// bot.dialog('/', intents);
onBoard.registerDialogs(bot);
intentDialog.registerDialogs(bot);

bot.dialog('/',[

  function(session, args, next){
    console.log("session");
    console.log(session);
    if (session.message.text == '/reset')
    {
      onBoard.resetAllData(session)
      .then(function(response){
        if (response){
          session.send('Данные удалены');
        }
        session.endDialog();
      });
    }
    next();
  },
  // function(session){
  //   db.CreateNewThreads(session)
  //     .then(function(response){
  //       db.GetUserData(session.message)
  //         .then(function(response){
  //           if (response) {
  //             session.userData.subscribe = response.subscribe;
  //             session.userData.profile = response.profile;
  //           }
  //           session.beginDialog('/welcome', session.userData);
  //         });
  //     });
  // },
  // function(session,results){
  //   if (results.response.profile != null)
  //   {
  //     session.userData = results.response;
  //     db.UpdateUserData(session.message.address,session.userData)
  //       .then(function(response){
  //           if (response==1){
  //             session.send('Спасибо, %(name)s, я это запомню. Ты %(sex)s, носишь одежду с %(choiceClothesSmallstr)s по %(choiceClothesLargestr)s, а обувь c %(choiceShoesSmallstr)s по %(choiceShoesLargestr)s', session.userData.profile);
  //           }else{
  //             session.beginDialog('/LUISintent');
  //           }
  //       });
  //   }
  // },
  // function(session,results){
  //
  //   db.saveMsgFromUser(session.message,results);
  //
  // }
  Topic2
]);

function Topic1(session)
{
  session.send();
  db.isUnderConstruction()
  .then(function(response){
    db.CreateNewThreads(session)
    .then(function(){
      if (response) {
        if(session.message.text.toLowerCase().indexOf('service on') + 1) {
          db.SetUnderConstruction(false);
          session.send("Сервис включен");
          session.endDialog();
          return;
        }
        console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        console.log(session.message.text);
        if(session.message.text.toLowerCase().indexOf('reset thread') + 1) {
          db.SetUnderConstruction(false);
          session.send("удалено возможно");
          session.endDialog();
          return;
        }
        console.log("+++++++++++++++++++++++++++++++++++++++");
        session.send("Извините, сервис на стадии разработки");
      }
      else {
        var size= ["S","M"];
        var sizestr = "S и M?";
        console.log("Привет".toLowerCase());
        if(session.message.text.toLowerCase().indexOf('привет') + 1) {
          session.send("Привет!");
        }
        if(session.message.text.toLowerCase().indexOf('пальто') + 1) {
          session.send("Какой размер вам подобрать? "+sizestr);
          needItem = "пальто";
          session.endDialog();
        }
        if(session.message.text.toLowerCase().indexOf('рубашк') + 1) {
          session.send("Какой размер вам подобрать? "+sizestr);
          needItem = "рубашка";
          session.endDialog();
        }
        if(session.message.text.toLowerCase().indexOf('пончо') + 1) {
          session.send("К сожалению сейчас у нас нету пончо, может быть, Вам подобрать пальто?");
          session.endDialog();
        }
        if(session.message.text.toLowerCase().indexOf('размер') + 1) {
          session.send("Понял! Напишу как будут результаты :)");
          db.saveGoodRequest(needItem,size,session.message);
          session.endDialog();
        }
        if(session.message.text.toLowerCase().indexOf('service off') + 1) {
          db.SetUnderConstruction(true);
          session.send("Сервис выключен");
          session.endDialog();
        }
      }
    })

  });
};

function Topic2(session)
{
  session.send();
  db.isUnderConstruction()
  .then(function(response){
    db.CreateNewThreads(session)
    .then(function(){
      if (response) {
        if(session.message.text.toLowerCase().indexOf('service on') + 1) {
          db.SetUnderConstruction(false);
          session.send("Сервис включен");
          session.endDialog();
          return;
        }
        if(session.message.text.toLowerCase().indexOf('reset thread') + 1) {
          db.ClearThreadbyMsg(session.message);
          session.send("удалено возможно");
          session.endDialog();
          return;
        }
        session.send("Извините, сервис на стадии разработки");
      }
      else {

        var sizestr = "S и M?";
        // console.log("Привет".toLowerCase());
        var text = session.message.text.toLowerCase();
        console.log(text);
        if(text.indexOf('привет') + 1) {
          session.send("Приветствую!");
        }
        if((text.indexOf('ищу пальто') + 1)) {
          session.send("Рад видеть тебя :) В прошлый раз ты искала размер M. Ты всё в той же прекрасной форме?");
          needItem = "пальто";
          color = "винное";
        }
        if((text.indexOf('ищу рубашк') + 1)) {
          session.send("Рад видеть тебя :) В прошлый раз ты искала размер M. Ты всё в той же прекрасной форме?");
          needItem = "рубашка";
          color = "винное";
        }
        if(text.indexOf('да!') + 1) {
          session.send("Ты в отличной форме! Уточни на какой сезон мы подбираем " + needItem + "?");
          // needItem = "рубашка";
          size = ["M"];
        }
        if(text.indexOf('размер s') + 1) {
          session.send("Ты в отличной форме! Уточни на какой сезон мы подбираем " + needItem + "?");
          // needItem = "рубашка";
          size = ["S"];
        }
        if(text.indexOf('зиму') + 1) {
          session.send("Понял. Дай мне несколько мгновений и я постараюсь тебя удивить. Есть ли предпочтения по силуэту?");
          comments = needItem + " прямое на зимний сезон";
        }
        if(text.indexOf('лето') + 1) {
          session.send("Понял. Дай мне несколько мгновений и я постараюсь тебя удивить. Есть ли предпочтения по силуэту?");
          comments = needItem + " прямое на летний сезон";
        }
        if(text.indexOf('прямо') + 1) {
          session.send("ОК! Ушел на базу, скоро буду.");
          db.saveGoodRequest(needItem,size,session.message,color,comments);
        }
        if(session.message.text.toLowerCase().indexOf('service off') + 1) {
          db.SetUnderConstruction(true);
          session.send("Сервис выключен");
        }
      }
    })

  });
};
var size= ["M"];
var comments = "";
var color = "";
var needItem = "";
  function botDialog(session) {
    console.log("botDialog");
    // console.log(session);
    session.send();
    session.beginDialog('/LUISintent');

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
function SendMsg(address, text, attachments){
  console.log('SendMsg');
  console.log(address);
  console.log(text);
  console.log(attachments);
  var reply = new builder.Message();
  reply.text(text);
  reply.attachments(attachments);
  reply.address(address);
  bot.send(reply,function(err){
  });
}
function SendResponse(address, resp, shop){
  // console.log('SendResponse');
  // var receipt = new builder.ReceiptCard()
  //   .title("shop.name");
  //   var image = new builder.CardImage()
  //     .url(resp.shopItem.photo[0].contentUrl)
  //     .alt("here")
  //     .tap();
  // var receiptItem = new builder.ReceiptItem()
  //   .price("resp.shopItem.price")
  //   .title("resp.shopItem.item")
  //   .image(image.toImage());
  //   // .subtitle("resp.shopItem.size")
  //   // .text("resp.shopItem.color")
  //
  //   // .image(builder.CardImage.create(null,resp.shopItem.photo[0].contentUrl).toImage());
  // var items = [receiptItem.toItem()];
  // // for (var i = 0; i<resp.shopItem.photo.length; i++)
  // // {
  // //   var photo = new builder.CardImage();
  // //   photo.url(resp.shopItem.photo[i].contentUrl)
  // //   console.log(photo);
  // //   var item = new builder.ReceiptItem()
  // //     .price(resp.shopItem.price)
  // //     .title(resp.shopItem.item)
  // //     .subtitle(resp.shopItem.size)
  // //     .text(resp.shopItem.color)
  // //     .image([photo.toImage()]);
  // //   items.push(item.toItem());
  // //   console.log(item);
  // //   console.log(items);
  // // }
  // receipt.buttons([]);
  // receipt.facts([]);
  // // receipt.tax("tax");
  // // receipt.total("total");
  // // receipt.vat("vat");
  // // receipt.items(items);
  // receipt.items([receiptItem.toItem()]);
  // console.log("superhere");
  // var tmp = receipt.toAttachment();
  // console.log(tmp.content.items[0]);
  var reply = new builder.Message();
  var textmsg = "Магазин: " + shop.name + "\n\n";
  textmsg += "Вещь: "+ resp.shopItem.item + "\n\n";
  textmsg += "Размер: "+ resp.shopItem.size + "\n\n";
  textmsg += "Цвет: "+ resp.shopItem.color + "\n\n";
  textmsg += "Цена: "+ resp.shopItem.price + "\n\n";
  // console.log(textmsg);
  reply.text(textmsg);
  var attach =[];
  for (var i = 0; i<resp.shopItem.photo.length;i++){
    var tmp = {};
    tmp.contentUrl = resp.shopItem.photo[i].contentUrl;
    tmp.contentType = resp.shopItem.photo[i].contentType;
    if (tmp.contentUrl && tmp.contentType)
      attach.push(tmp);
  }

  reply.attachments(attach);
  reply.address(address);
  // console.log(" " +reply.toMessage().attachments);
  bot.send(reply,function(err){ });
  return;
  // var receiptMsg = new builder.Message()
  //   .addAttachment(receipt.toAttachment())
  //   .address(address)
  //   .text("");
  // // receiptMsg.text("");
  // // receiptMsg.addAttachment(receipt.toAttachment());
  //
  // // receiptMsg.address(address);
  // console.log(receipt.toAttachment());
  // console.log("HERE");
  // console.log(receiptMsg);
  // bot.send(receiptMsg,function(err){console.log(err);});
}

exports.connector = connector;
exports.SendMsg = SendMsg;
exports.SendResponse = SendResponse;
  // bot Functions
  /*function botDialog(session) {
    console.log("botDialog");
    // console.log(session);
    session.send();
    session.beginDialog('/LUISintent');

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
  }*/
