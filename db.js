console.log('LOAD mongoose');
var mongoose = require('mongoose');
//var Promise = require('Promise');

// mongoose
var mongodbURL = process.env.MONGODB_URL;
mongoose.connect(mongodbURL);
var db = mongoose.connection;
db.on('error', console.error);
db.once('open', function() {
  console.log('Connection DB ok');
  //   var record = new WelcomeMsgDB();
  //   record.message = "Bundles объединяет шоурумы и дизайнеров одежды, чтобы помочь тебе быстро найти то, что ты хочешь." + "\r\n" +
  // "Сейчас Bundles Bot учится понимать людей с полуслова и проходит закрытое бета-тестирование. Чтобы получить доступ к публичной бете одним из первых, сохрани этот контакт, и Bundles Bot пригласит тебя, как только она будет открыта.";
  //   record.save();
});
var SchemaChanel = new mongoose.Schema({
  address: {
    bot: {
      id: String,
      isGroup: Boolean,
      name: String},
    channelId: {type: String},
    serviceUrl: {type: String},
    useAuth: {type: Boolean},
    conversation: {
      id: String,
      isGroup: Boolean,
      name: String
    },
    user: {
      id: String,
      isGroup: Boolean,
      name: String
    }
  },
  username: {type: String},
  userData: mongoose.Schema.Types.Mixed
});
var SchemaMsg = new mongoose.Schema({
  ChanelId: {type: String},
  type: {type: String},
  message: {type: String},
  attachments: [],
  sender: {
    name: {type: String},
    id: {type: String},
    type: {type: String}
  },
  sent: {type: Date, default: Date.now},
  fromUser: {type: Boolean},
  id: {type: String}
});
var SchemaProvider = new mongoose.Schema({
  name: {type: String},
  username: {type: String},
  password: {type: String}
});
var SchemaAPNS = new mongoose.Schema({
  token: {type: String}
});
var SchemaThread = new mongoose.Schema({
  consumer: {type: String},
  provider: {type: String},
  msgs: [String],
  last_seen: {type: String}
});
var SchemaWelcomeMsg = new mongoose.Schema({
  message: {type: String},
  date: {type: Date, default: Date.now},
  consumersSended: []
});

var MsgDB = mongoose.model('MsgSchema', SchemaMsg);
var ChanelDB = mongoose.model('ChanelSchema', SchemaChanel);
var ProviderDB = mongoose.model('ProviderSchema', SchemaProvider);
var APNSDB = mongoose.model('APNSSchema', SchemaAPNS);
var ThreadDB = mongoose.model('ThreadSchema', SchemaThread);
var WelcomeMsgDB = mongoose.model('WelcomeMsgSchema', SchemaWelcomeMsg);
exports.MsgDB = MsgDB;
exports.ChanelDB = ChanelDB;
exports.ProviderDB = ProviderDB;
exports.APNSDB = APNSDB;
exports.ThreadDB = ThreadDB;
exports.WelcomeMsgDB = WelcomeMsgDB;

function AddUserMsgInDB(ChanelId, msg) {
  var record = new MsgDB();
  record.message = msg.text;
  record.type = 'text';
  record.ChanelId = ChanelId;

  // record.sender.name = msg.sourceEvent.message.from.first_name + ' ' + msg.sourceEvent.message.from.last_name;
  if (msg.sourceEvent != null) {
    record.sender.name = msg.sourceEvent.message.from.first_name + ' ' +
                          msg.sourceEvent.message.from.last_name;
  } else {
    record.sender.name = msg.address.user.name;
  }
  record.sender.id = ChanelId;
  record.sender.type = 'consumer';
  record.fromUser = true;
  record.id = msg.id;
  record.attachments = msg.attachments;
  record.save();
  return JSON.stringify(record);
}
/*function AddUserInDB(msg) {
  ChanelDB.findOne({
    'address.user.id': msg.address.user.id
  }, function(err, item) {
    if (err) {
      return console.error(err);
    }
    if (item === null) {
      var record = new ChanelDB(msg);
      if (msg.sourceEvent != null) {
        record.username = msg.sourceEvent.message.from.first_name + ' ' +
                          msg.sourceEvent.message.from.last_name;
      } else {
        record.username = msg.address.user.name;
      }
      record.save();
      CheckThreads(record.id, msg);
    } else {
      CheckThreads(item.id, msg);
    }
  });
}*/
function GetUserData(address) {
  return new Promise(function(resolve, reject) {
    ChanelDB.findOne({'address.user.id': address.user.id}).exec(function(err, item) {
      if (err) {
        return reject(err);
      }

      if (item !== null) {
        return resolve(item.userData);
      }
      return resolve({});
    });
  });
}
function UpdateUserData(address, userData){
  return new Promise(function(resolve, reject) {
    ChanelDB.findOne({'address.user.id': address.user.id}).exec(function(err, item) {
      if (err) {
        return reject(err);
      }

      if (item !== null) {
        if (item.userData===null)
        {
          item.userData = {}
        }
        if (JSON.stringify(item.userData.profile) !== JSON.stringify(userData.profile))
        {
          item.userData = {};//userData;
          item.userData.profile = userData.profile;
          item.userData.subscribe = userData.subscribe;
          item.save();
          return resolve(1);
        }
        return resolve(0);
      }
      return reject(1);
    });
  });
}
// exports.AddUserInDB = AddUserInDB;
exports.AddUserMsgInDB = AddUserMsgInDB;
exports.GetUserData = GetUserData;
exports.UpdateUserData = UpdateUserData;

/*function CheckThreads(chanelId, recvedMsg) {
  ThreadDB.find({
    'consumer': chanelId
  }).exec(LonFindConsumers);

  function LonFindConsumers(err, items) {
    if (items.length === 0) {
      CreateNewThreads(chanelId, recvedMsg);
    } else {
      var msgstr = AddUserMsgInDB(chanelId, recvedMsg);
      var msgid = JSON.parse(msgstr)._id;
      SendWSMessage(msgstr);
      ThreadDB.update({
        'consumer': chanelId
      }, {
        $push: {
          msgs: msgid
        }
      }, function(err, num) {});
    }
  }

}

function CreateNewThreads(chanelId, recvedMsg) {
  var msgstr = AddUserMsgInDB(chanelId, recvedMsg);
  var msgid = JSON.parse(msgstr)._id;
  SendWSMessage(msgstr);
  ProviderDB.find().exec(AddThread);

  function AddThread(err, items) {
    items.forEach(function(item) {
      var record = new ThreadDB({
        'consumer': chanelId,
        'provider': item._id,
        'msgs': [msgid],
        'last_seen': '0'
      });
      record.save();
    });
  }
}*/
