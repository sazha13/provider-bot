var builder = require('botbuilder');
var db = require('./db');
// var app = require("./app.js");

var choiceFirst = ["Как я буду это делать?","Что я могу сейчас?"];
var choiceSubscribe = ["Конечно, присылай","Лучше поиск скорее включи"];

var choiceSex = ["Джентельмен","Леди"];
var choiceClothes = ["Обувь","Одежда"];
var choiceClothesSize = ["XXS","XS","S","M","L","XL","XXL"];
var choiceShoesSize = ["35","36","37","38","39","40","41","42"];


var welcomeDialogFunctions = [
function(session,args,next){
  // session.dialogData = {};
  if (args == null)
    args = {};
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
                    но всего через пару месяцев стану квалифицированным шоппинг-консультантом и обязательно закачу по этому поводу вечеринку с шампанским 🍾\
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
];

var ensureProfileFunctions = [
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
];

function resetAllData(session){
  return new Promise(function(resolve,reject){
    session.userData = {};
    session.dialogData = {};
    db.UpdateUserData(session.message.address,session.userData)
    .then(function(response){
      if (response==1){
        return resolve(true);
      }else{
        return resolve(false);
      }
    });
  });
}

function registerDialogs(bot){
  bot.dialog('/welcome',welcomeDialogFunctions);
  bot.dialog('/ensureProfile', ensureProfileFunctions);
}
exports.registerDialogs = registerDialogs;
exports.resetAllData = resetAllData;
