var builder = require('botbuilder');
var db = require("./db");

var LUISurl = process.env.LUIS_URL;

var recognizer = new builder.LuisRecognizer(LUISurl);
var intents = new builder.IntentDialog({ recognizeMode: builder.RecognizeMode.onBegin, recognizers: [recognizer] });

function registerDialogs(bot){
  bot.dialog('/LUISintent',intents);
}

intents.matches('помощь',helpDialog);
intents.matches('хочу',whantDialog);
intents.onBegin(onBegin);
intents.onDefault(onDefault);

var helpDialog = function (session, args, next){
  console.log(session.message.text);
  session.send("Покупатель попросил помощи");
  session.endDialog();
}

var whantDialog = [
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
}];

var onBegin = function (session, args, next) {
    console.log("onBegin");
    next();
};

var onDefault = function(session){
  console.log("HERE INTENTS onDefault");
  console.log(session.message.text);
  session.send("Не смог понять чего хотят");
  session.endDialog();
};

exports.registerDialogs = registerDialogs;
