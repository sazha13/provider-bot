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

exports.connector = connector;
var bot = new builder.UniversalBot(connector);

// bot.dialog('/',function(session){
//
// });
// bot.dialog('/', intents);
onBoard.registerDialogs(bot);
intentDialog.registerDialogs(bot);

bot.dialog('/',[
  function(session, args, next){
    if (session.message.text == '/reset')
    {
      console.log(onBoard.resetAllData);
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
  function(session){
    db.CreateNewThreads(session)
      .then(function(response){
        db.GetUserData(session.message)
          .then(function(response){
            if (response) {
              session.userData.subscribe = response.subscribe;
              session.userData.profile = response.profile;
            }
            console.log("start welcome");
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


  // bot Functions
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
