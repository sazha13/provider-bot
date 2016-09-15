var builder = require('botbuilder');
var db = require("./db");

var LUISurl = process.env.LUIS_URL;

var recognizer = new builder.LuisRecognizer(LUISurl);
var intents = new builder.IntentDialog({ recognizeMode: builder.RecognizeMode.onBegin, recognizers: [recognizer] });

function registerDialogs(bot){
  bot.dialog('/LUISintent',intents);
}



var helpDialog = function (session, args, next){
  console.log(session.message.text);
  session.send("Покупатель попросил помощи");
  session.endDialogWithResult({type:'help',tags:[],shops:[]});
};

var whantDialog = [
    function (session, args, next) {
      var promise = new Promise(function(resolve,reject){
      if (args.entities.length == 0) next();
        // Process optional entities received from LUIS
        var match;
        var entities = builder.EntityRecognizer.findAllEntities(args.entities, 'предмет');
        var msgToSend = "Обнаружены желания купить: ";
        for (var i = 0; i<entities.length; i++)
          msgToSend += entities[i].entity + ", ";
        msgToSend += "Сообщение будет разослано (теги, продавец): \n\n";

        if (entities.length) {
          db.GetTags()
          .then(function(response){

            var shops = [];
            var shopsName = [];
            var tags = [];
            var tagsFinded = [];
            for (var i = 0; i<response.length; i++) {
              tags.push(response[i].tag);
            }
            for (var j = 0; j<entities.length; j++) {
              tagsFinded.push(entities[j].entity);
              match = builder.EntityRecognizer.findAllMatches(tags, entities[j].entity);
              for (var i = 0; i<match.length; i++){
                var index = tags.indexOf(match[0].entity);
                for (var k = 0; index!=-1 && k < response[index].shopsId.length; k++){
                  if (shops.indexOf(response[index].shopsId[k])==-1){
                    shops.push(response[index].shopsId[k]);
                  }
                }

              }
              if (match.length) {
                mustSend = true;
                msgToSend += match[0].entity + ", "
              }
            }
            msgToSend += "\n\nПродавцы: ";
            var promise1 = new Promise(function(resolve,reject){
              var step = 0;
              for (var i = 0; i<shops.length; i++){
                db.GetShopById(shops[i])
                .then(function(shopName){
                  shopsName.push(shopName);
                  msgToSend += shopName + ', ';
                  step++;
                  if (step == shops.length)
                    return resolve();
                });
              }
              if (!shops.length){
                msgToSend += "Cообщение будет отправлено админу";
                return resolve();
              }
            });


            promise1.then(function(){
              console.log(shops);
              return resolve({testmsg: msgToSend, AI:{type:'wish',tags:tagsFinded,shops:shops}});
            });

          });
          /*db.GetAllProviders()
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
            });*/

        }
      })
      .then(function(response){
        // console.log(session);
        session.send(response.testmsg);
        session.endDialogWithResult(response.AI);
      });

},
function(session,args){
  session.send("Понял что есть желание, но не понял чего именно хотите");
  session.endDialogWithResult({type:'wish',tags:[],shops:[]});
}];

var onBegin = function (session, args, next) {
    console.log("onBegin");
    next();
};

var onDefault = function(session){
  console.log("HERE INTENTS onDefault");
  console.log(session.message.text);
  session.send("Не смог понять чего хотят");
  session.endDialogWithResult({type:'none',tags:[],shops:[]});
};
intents.matches('помощь',helpDialog);
intents.matches('хочу',whantDialog);
intents.onBegin(onBegin);
intents.onDefault(onDefault);
exports.registerDialogs = registerDialogs;
