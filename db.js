var mongoose = require('mongoose');

// mongoose
var mongodb_url = process.env.MONGODB_URL;
mongoose.connect(mongodb_url);
var db = mongoose.connection;
db.on('error', console.error);
db.once('open', function() {
  console.log("connection DB ok");
  //   var record = new WelcomeMsgDB();
  //   record.message = "Bundles объединяет шоурумы и дизайнеров одежды, чтобы помочь тебе быстро найти то, что ты хочешь." + "\r\n" +
  // "Сейчас Bundles Bot учится понимать людей с полуслова и проходит закрытое бета-тестирование. Чтобы получить доступ к публичной бете одним из первых, сохрани этот контакт, и Bundles Bot пригласит тебя, как только она будет открыта.";
  //   record.save();
});
var SchemaChanel = new mongoose.Schema({
  address: {
    bot:{
      id: String,
      isGroup: Boolean,
      name: String},
    channelId: {
      type: String
    },
    serviceUrl: {
      type: String
    },
    useAuth: {
      type: Boolean
    },
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
  username: {
    type: String
  }
});
var SchemaMsg = new mongoose.Schema({
  ChanelId: {
    type: String
  },
  type: {
    type: String
  },
  message: {
    type: String
  },
  attachments: [],
  sender: {
    name: {
      type: String
    },
    id: {
      type: String
    },
    type: {
      type: String
    }
  },
  sent: {
    type: Date,
    default: Date.now
  },
  fromUser: {
    type: Boolean
  },
  id: {
    type: String
  }
});
var SchemaProvider = new mongoose.Schema({
  name: {
    type: String
  },
  username: {
    type: String
  },
  password: {
    type: String
  }
});
var SchemaAPNS = new mongoose.Schema({
  token: {
    type: String
  }
});
var SchemaThread = new mongoose.Schema({
  consumer: {
    type: String
  },
  provider: {
    type: String
  },
  msgs: [String],
  last_seen: {
    type: String
  }
});
var SchemaWelcomeMsg = new mongoose.Schema({
  message: {
    type: String
  },
  date: {
    type: Date,
    default: Date.now
  },
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
  if (msg.sourceEvent!=null)
    record.sender.name = msg.sourceEvent.message.from.first_name + ' ' + msg.sourceEvent.message.from.last_name;
  else
    record.sender.name = msg.address.user.name;

  record.sender.id = ChanelId;
  record.sender.type = 'consumer';
  record.fromUser = true;
  record.id = msg.id;
  record.attachments = msg.attachments;
  record.save();
  return JSON.stringify(record);
}
exports.AddUserMsgInDB = AddUserMsgInDB;
