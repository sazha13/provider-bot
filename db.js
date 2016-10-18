console.log('LOAD mongoose');
var mongoose = require('mongoose');
var choiceShoesSize = require('./constants.js').choiceShoesSize;
var choiceClothesSize = require('./constants.js').choiceClothesSize;
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
var SchemaIdent = new mongoose.Schema({
  id: String,
  isGroup: Boolean,
  name: String
});
/*var SchemaChanel = new mongoose.Schema({
  address: {
    bot: SchemaIdent,
    channelId: {type: String},
    serviceUrl: {type: String},
    useAuth: {type: Boolean},
    conversation: SchemaIdent,
    user: SchemaIdent
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
  password: {type: String},
  tags: [],
  admin: {type: Number, default: 0}
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
});*/


var SchemaRequest = new mongoose.Schema({
  orderId: String,
  threadId: String,
  shopId: [],
  operatorId: String,
  sentTime: {type: Date, default: Date.now}
});
var SchemaOrder = new mongoose.Schema({
  item: String,
  color: String,
  size: [],
  photo: [],
  comments: String
});
var SchemaResponse = new mongoose.Schema({
  requestId: String,
  threadId: String,
  consultantId: String,
  operatorId: String,
  shopItemId: String,
  sentTime: {type: Date, default: Date.now}
});
var SchemaShopItem = new mongoose.Schema({
  item: String,
  color: String,
  size: [],
  photo: [],
  price: String,
  comments: String
});
var SchemaTag = new mongoose.Schema({
  tag: String,
  shopsId: []
});
var SchemaForm = new mongoose.Schema({
  name: String,
  clovesSize: [],
  shoesSize: []
});
var SchemaAddress = new mongoose.Schema({
  city: String,
  street: String,
  house: String
});
var SchemaShop = new mongoose.Schema({
  name:String,
  addressId: String,
  phone: String,
  comments: String,
});
var SchemaAuthUser = new mongoose.Schema({
  name: String,
  login: String,
  password: String,
  phone: String,
  group: String,
  shopId: String
});
var SchemaMessage = new mongoose.Schema({
  text: String,
  attachments: [],
  sentTime: {type: Date, default: Date.now},
  threadId: String,
  AI: {
    type: {type: String},
    tags: [],
    shops: []
  },
  sender: {
    type: {type: String},
    id: {type: String}
  }
});
var SchemaUser = new mongoose.Schema({
  address: {
    bot: SchemaIdent,
    channelId: {type: String},
    serviceUrl: {type: String},
    useAuth: {type: Boolean},
    conversation: SchemaIdent,
    user: SchemaIdent
  },
  username: {type: String},
  form: String,
  userData: mongoose.Schema.Types.Mixed //убрать перевести в form
});
var SchemaThreadV2 = new mongoose.Schema({
  userId: String,
  operatorId: String,
  responses: [{request: String,
              responses:[]}],
  messages: []
});
var SchemaUnderConstruction = new mongoose.Schema({
  messagesOff: String
});


/*var MsgDB = mongoose.model('MsgSchema', SchemaMsg);
var ChanelDB = mongoose.model('ChanelSchema', SchemaChanel);
var ProviderDB = mongoose.model('ProviderSchema', SchemaProvider);
var APNSDB = mongoose.model('APNSSchema', SchemaAPNS);
var ThreadDB = mongoose.model('ThreadSchema', SchemaThread);
var WelcomeMsgDB = mongoose.model('WelcomeMsgSchema', SchemaWelcomeMsg);*/
var RequestDB = mongoose.model('Request',SchemaRequest);
var ResponseDB = mongoose.model('Response',SchemaResponse);
var OrderDB = mongoose.model('Order',SchemaOrder);
var ShopItemDB = mongoose.model('ShopItem',SchemaShopItem);
var TagDB = mongoose.model('Tag',SchemaTag);
var FormDB = mongoose.model('Form',SchemaForm);
var AddressDB = mongoose.model('Address',SchemaAddress);
var ShopDB = mongoose.model('Shop',SchemaShop);
var AuthUserDB = mongoose.model('AuthUser',SchemaAuthUser);
var MessageDB = mongoose.model('Message',SchemaMessage);
var UserDB = mongoose.model('User',SchemaUser);
var ThreadV2DB = mongoose.model('ThreadV2',SchemaThreadV2);
var UnderConstructionDB = mongoose.model('UnderConstruction',SchemaUnderConstruction);

function isUnderConstruction()
{
  return new Promise(function(resolve,reject){
    UnderConstructionDB.findOne().exec(function(err,item){
      if (item && item.messagesOff)
        return resolve(true);
      return resolve(false);
    });
  });
}
function SetUnderConstruction(flag)
{
  return new Promise(function(resolve,reject){
    UnderConstructionDB.findOne().exec(function(err,item){
      if (!item){
        item = new UnderConstructionDB();
      }
      if (flag){
        item.messagesOff = "off";
      }else{
        item.messagesOff = "";
      }
      item.save();
      return resolve();
    });
  });
}
exports.isUnderConstruction = isUnderConstruction;
exports.SetUnderConstruction = SetUnderConstruction;
function getReadableResp(item){
  var result = {};
  result.id = item.id;
  result.requestId = item.requestId;
  result.threadId = item.threadId;
  result.consultantId = item.consultantId;
  result.operatorId = item.operatorId;
  result.shopItemId = item.shopItemId;
  result.sent = item.sentTime.getTime() / 1000 | 0;
  return result;
}
function getReadableMsg(item){
  var result = {}
  result.id = item.id;
  result.text = item.text;
  result.attachments = item.attachments ;
  result.threadId = item.threadId ;
  result.AI = item.AI ;
  result.sender = item.sender ;
  result.sent = item.sentTime.getTime() / 1000 | 0;
  return result;
}
function getReadableReq(item){
  var result = {};
  result.orderId = item.orderId;
  result.threadId = item.threadId;
  result.shopId = item.shopId;
  result.operatorId = item.operatorId;
  result.sent = item.sentTime.getTime() / 1000 | 0;
  result.id = item.id;
  return result;
}
function getReadableShop(item){
  var result = {};
  result.id = item.id;
  result.name = item.name;
  result.addressId = item.addressId;
  result.phone = item.phone;
  result.comments = item.comments;
  return result;
}
function getReadableAuthUser(item){
  var result = {};
  result.id = item.id;
  result.name = item.name;
  result.login = item.login;
  result.phone = item.phone;
  result.group = item.group;
  result.shopId = item.shopId;
  return result;
}
function getReadableUser(item){
  var result = {};
  result.id = item.id;
  result.username = item.username;
  result.form = {};
  if (!item.userData || !item.userData.profile) return result;
  result.form.name = item.userData.profile.name;
  result.form.sex = item.userData.profile.sex;
  result.form.size = {'clothes':[],'shoes':[]};

  result.form.size.clothes = choiceClothesSize.slice(item.userData.profile.choiceClothesSmall,item.userData.profile.choiceClothesLarge+1);
  result.form.size.shoes = choiceShoesSize.slice(item.userData.profile.choiceShoesSmall,item.userData.profile.choiceShoesLarge+1);
  return result;
}
function getReadableOrder(item){
  var result = {};
  result.id = item.id;
  result.item = item.item;
  result.color = item.color;
  result.size = item.size;
  result.photo = item.photo;
  result.comments = item.comments;
  return result;
}
function getReadableShopItem(item){
  var result = {};
  result.id = item.id;
  result.item = item.item;
  result.color = item.color;
  result.size = item.size;
  result.price = item.price;
  result.photo = item.photo;
  result.comments = item.comments;
  return result;
}

function CreateAddress(address){
    address = address || {};
    return new Promise(function(resolve,reject){
      if (!address.city) return resolve(0);
      AddressDB.findOne({'city':address.city, 'street': address.street,
                        'house': address.house}).exec(OnFind);
      function OnFind(err,item){
        if (err) return reject(err);
        if (item) return resolve(item.id);
        var record = new AddressDB(address);
        record.save();
        return resolve(record.id);
      }
    });
}
function CreateShop(shop){
  shop = shop || {};
  return new Promise(function(resolve,reject){
    ShopDB.findOne({'name':shop.name}).exec(OnFind);
    function OnFind(err,item){
      if (err) return reject(err);
      if (item) return resolve(item.id);
      CreateAddress(shop.address)
      .then(function(response){
        var record = new ShopDB(shop);
        if (response!='0') {
          record.addressId = response;
        }
        record.save();
        AddTags(shop.tags,record.id);
        return resolve(record.id);
      });
    }
  });
}
function CreateConsultant(consultant,shopId,shop){
  consultant = consultant || {};
  return new Promise(function(resolve,reject){
    AuthUserDB.findOne({'login':consultant.login}).exec(OnFind);
    function OnFind(err,item){
      if (err) return reject(err);
      if (item){
        if (shopId){
          item.shopId = shopId;
          item.save();
        }
        if (shop){
          ShopDB.findOne({'name':shop}).exec(function(err,itemShop){
            if (itemShop){
              item.shopId = itemShop.id;
              item.save();
            }
          });
        };
        return resolve(item.id);
      }
      var record = new AuthUserDB(consultant);
      if (shopId) record.shopId = shopId;
      record.group = 'consultant';
      if (shop){
        ShopDB.findOne({'name':shop}).exec(function(err,item){
          if (item){
            record.shopId = item.id;
            record.save();
          }
        });
      };
      record.save();
      return resolve(record.id);
    }
  });
}
function CreateOperator(operator){
  operator = operator || {};
  return new Promise(function(resolve,reject){
    AuthUserDB.findOne({'login':operator.login}).exec(OnFind);
    function OnFind(err,item){
      if (err){
        return reject(err);
      }
      if (item){
        return resolve(item.id);
      }
      var record = new AuthUserDB(operator);
      record.group = 'operator';
      record.save();
      return resolve(record.id);
    }
  });
}
function AddTags(tags,shopId){
  tags = tags|| [];
  if (tags.length == 0) return 0;
  for (var i = 0; i<tags.length; i++)
  {
    findOneTag(tags,i,shopId)
    .then(function(resolve){
      if (resolve.result) return;
      var record = new TagDB({'tag':resolve.tag});
      AddShop(record,shopId);
      record.save();
    });

  }

  function findOneTag(tags,i,shopId){
    return new Promise(function(resolve,reject){
      TagDB.findOne({'tag':tags[i]}).exec(OnFind);
      function OnFind(err,item){
        if (err) return reject(err);
        if (item) {
          AddShop(item,shopId);
          return resolve({'tag':tags[i], 'i':i, 'result':true});
        };
        return resolve({'tag':tags[i], 'i':i, 'result':false});
      }

    });
  }
  function AddShop(item,shopId){
    if (!shopId) return;
    if (item.shopsId.indexOf(shopId)>-1) {
      return;
    }
    item.shopsId.push(shopId);
    item.save();
  }
}
function AddChanel(msg){
  return new Promise(function(resolve,reject){
    UserDB.findOne({'address.user.id': msg.address.user.id}).exec(function(err, item) {
      if (err) return reject(err);
      if (item != null) return resolve(item.id);
      var record = new UserDB(msg);
      if (msg.sourceEvent && msg.sourceEvent.message && msg.sourceEvent.message.from) {
        record.username = msg.sourceEvent.message.from.first_name + ' ' +
          msg.sourceEvent.message.from.last_name;
      } else {
        record.username = msg.address.user.name;
      }
      record.save();
      return resolve(record.id);
    });
  });
}
function saveMsgFromUser(msg,AI){
  var record = new MessageDB({text: msg.text, attachments: msg.attachments, AI:AI});

    AddChanel(msg)
    .then(function(id){
      record.sender = {'type':'user','id':id};
      ThreadV2DB.findOne({'userId': id})
      .exec(function(err,item){
        if (err) return reject(err);
        if (item) {
          item.messages.push(record.id);
          item.save();
          record.threadId = item.id;
          record.save();
          if (AI.shops.length)
          {
            getUserById(id)
            .then(function(resp){
              var request = {};
              request.threadId = item.id;
              request.shops = AI.shops;
              request.sender = record.sender;
              var user = getReadableUser(resp);
              request.order = {item: msg.text,
                  color: "",
                  size: user.form.size.clothes,
                  photo: record.attachments,
                  comments: ""
                };
              saveRequestFromOperator(request);
            });

          };
        };

      });
    });

}
function saveMsgFromOperator(msg){
  return new Promise(function(resolve,reject){
    var record = new MessageDB(msg);
    record.save();
    getThreadById(msg.threadId)
    .then(function(response){
      if (!response) return;
      response.messages.push(record.id);
      response.save();
    });
    return resolve(record);
  });
}
function saveOrder(order){
  return new Promise(function(resolve,reject){
    var record = new OrderDB(order);
    record.save();
    return resolve(record);
  });
}
function saveRequestFromOperator(request){
  return new Promise(function(resolve,reject){
    var order = new OrderDB(request.order);
    order.save();
    var record = new RequestDB();
    record.orderId = order.id;
    record.threadId = request.threadId;
    record.shopId = request.shops;
    record.operatorId = request.sender.id;
    record.save();
    getThreadById(request.threadId)
    .then(function(response){
      if (!response) return;
      response.responses.push({'request':record.id, 'responses':[]});
      response.save();
    });
    var res = {};
    res.id = record.id;
    res.order = getReadableOrder(order);
    res.threadId = record.threadId;
    res.shops = record.shopId;
    res.sender = {'type': 'operator', 'id': record.operatorId};
    res.sent = record.sentTime.getTime() / 1000 | 0;
    return resolve(res);
  });
}
function saveResponseFromConsultant(resp){
  return new Promise(function(resolve,reject){
    var shopItem = new ShopItemDB(resp.shopItem);
    shopItem.price = ""+resp.shopItem.price;
    shopItem.save();
    var record = new ResponseDB();
    record.requestId = resp.requestId;
    record.shopItemId = shopItem.id;
    record.consultantId = resp.sender.id;
    record.threadId = resp.threadId;
    record.operatorId = "";
    record.save();
    getThreadById(record.threadId)
    .then(function(response){
      if (!response) return;
      for (var i = 0; i<response.responses.length;i++){
        if (response.responses[i].request != record.requestId) continue;
        response.responses[i].responses.push(""+record.id);
        response.save();
        break;
      }
    });
    var res = {};
    res.id = record.id;
    res.shopItem = getReadableShopItem(shopItem);
    res.threadId = record.threadId;
    res.requestId = record.requestId;
    res.operatorId = record.operatorId;
    res.sender = resp.sender;
    res.sent = record.sentTime.getTime() / 1000 | 0;

    return resolve(res);
  });
}
function UpdateUserData(address,userData){
  return new Promise(function(resolve, reject) {
    UserDB.findOne({'address.user.id': address.user.id}).exec(function(err, item) {
      if (err) {
        return reject(err);
      }
      if (item !== null) {
        if (item.userData==null) {
          item.userData = {};
        }
        if (userData === undefined) {
          if (item.userData === undefined)
            return resolve(0);
          item.userData = {};
          item.save();
          return resolve(1);
        }
        if (item.userData === undefined ||
          JSON.stringify(item.userData.profile) !== JSON.stringify(userData.profile))
        {
          item.userData = {'profile': userData.profile, 'subscribe':userData.subscribe};//userData;
          // item.userData.profile = userData.profile;
          // item.userData.subscribe = userData.subscribe;
          item.save();
          return resolve(1);
        }
        return resolve(0);
      }
      return reject(1);
    });
  });
}

function CheckAuthUser(authorization){
  return new Promise(function(resolve,reject){
    if (authorization === null ||
      authorization.basic === null ||
      authorization.basic.username === null ||
      authorization.basic.password === null) {
      return resolve({'auth':false});
    }
    AuthUserDB.find({
      'login': authorization.basic.username
    }).limit(1).exec(function(err, items) {
      if (items.length === 0) {
        return resolve({'auth':false});
      };
      return resolve({'auth':true, 'AuthUserId': items[0].id, 'AuthUser': items[0]});
    });
  });
}

function GetUserData(msg){
  return new Promise(function(resolve, reject) {
    UserDB.findOne({'address.user.id': msg.address.user.id}).exec(function(err, item) {
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

function CreateNewThreads(session){
  return new Promise(function(resolve,reject){
    AddChanel(session.message)
    .then(function(user){
      ThreadV2DB.findOne({'userId': user})
      .exec(function(err,item){
        if (err) return reject(err);
        if (item) return resolve(false);
        var record = new ThreadV2DB({'userId': user, 'messages':[],'responses':[],'operatorId':''});
        record.save();
      });
      return resolve(true);
    });
  });
}

function GetTags(){
  return new Promise(function(resolve,reject){
    TagDB.find().exec(function(err,items){
      if (err) return reject(err);
      return resolve(items);
    });
  });
}

function GetShopById(id){
  return new Promise(function(resolve,reject){
    ShopDB.findById(id, function(err, item){
      if (err) return reject(err);
      if (item) return resolve(item.name);
      return resolve('');
    });
  });
}

function getThreads(){
  return new Promise(function(resolve,reject){
    ThreadV2DB.find().exec(function(err,items){
      if (err) return reject(err);
      return resolve(items);
    });
  });
}

function getUserById(id){
  return new Promise(function(resolve,reject){
    UserDB.findById(id, function(err, item){
      if (err) return reject(err);
      return resolve(item);
    });
  });
}

function getMsgById(id){
  return new Promise(function(resolve,reject){
    MessageDB.findById(id, function(err, item){
      if (err) return reject(err);
      if (!item) return resolve(item);
      var result = getReadableMsg(item);
      return resolve(result);
    });
  });
}
function getThreadById(id){
  return new Promise(function(resolve,reject){
    ThreadV2DB.findById(id, function(err, item){
      if (err) return reject(err);
      return resolve(item);
    });
  });
}
function getMsgsByThread(id){
  return new Promise(function(resolve,reject){
    MessageDB.find({'threadId':id}, function(err, items){
      if (err) return reject(err);
      var result = [];
      for (var i = 0; i<items.length; i++){
        var tmp = getReadableMsg(items[i]);
        result.push(tmp);
      }
      return resolve(result);
    });
  });
}

function getRequestByThread(id){
  return new Promise(function(resolve,reject){
    RequestDB.find({'threadId':id}, function(err, items){
      if (err) return reject(err);
      var result = [];
      for (var i = 0; i<items.length; i++){
        var tmp = getReadableReq(items[i]);
        result.push(tmp);
      }
      return resolve(result);
    });
  });
}


function getReqResByThread(id){
  return new Promise(function(resolve,reject){
    RequestDB.find({'threadId':id}, function(err, items){
      if (err) return reject(err);
      var result = [];
      var count = 0;
      for (var i = 0; i<items.length; i++){
        var tmp = getReadableReq(items[i]);
        addResponse(items[i].id)
        .then(function(respons){
          result.push({'request':tmp, 'responses':respons});
          count++;
          if (count == items.length)return resolve(result);
        });
      }
    });
    function addResponse(reqid){
      return new Promise(function(resolve,reject){
        var responses = [];
        ResponseDB.find({'requestId':reqid}).exec(function(err,item){
          if (err) return reject(err);
          for (var j = 0; j<item.length; j++){
            responses.push(getReadableResp(item[j]));
          }
          return resolve(responses);
        });
      });
    }
  });
}

function getShops(){
  var resp = [];
  return new Promise(function(resolve,reject){
    ShopDB.find().exec(function(err, items){
      if (err) return reject(err);
      var count = 0;
      for(var i = 0; i<items.length; i++){
        var shop = getReadableShop(items[i]);
        addTags2Shop(shop)
        .then(function(response){
          count++;
          resp.push(response);
          if (count == items.length){
            return resolve(resp);
          };
        });
      }
      //return resolve(items);
    });
  });
  function addTags2Shop(shop){
    return new Promise(function(resolve,reject){

      TagDB.find({'shopsId':shop.id}).exec(function(err,items){
        if (err) return reject(err);
        shop.tags = [];
        for (var j = 0; j<items.length; j++){
          shop.tags.push(items[j].tag);
        }
        //resp.push(shop);
        return resolve(shop);
      });
    });
  }
}

function getOperators(){
  return new Promise(function(resolve,reject){
    AuthUserDB.find({'group':'operator'}).exec(function(err,items){
      if (err) return reject(err);
      var result = [];
      for (var i = 0; i<items.length; i++){
        result.push(getReadableAuthUser(items[i]));
      }
      return resolve(result);
    });
  });
}

function getUserByThreadId(id){
  return new Promise(function(resolve,reject){
    ThreadV2DB.findById(id).exec(function(err,item){
      if (err) return reject(err);
      if (!item) return resolve({});
      UserDB.findById(item.userId).exec(function(err,item){
        if (err) return reject(err);
        if (!item) return resolve(item);
        var result = getReadableUser(item);
        return resolve(result);
      });
    });
  });
}

function getUserByThreadIdforSend(id){
  return new Promise(function(resolve,reject){
    ThreadV2DB.findById(id).exec(function(err,item){
      if (err) return reject(err);
      if (!item) return resolve({});
      UserDB.findById(item.userId).exec(function(err,item){
        if (err) return reject(err);
        return resolve(item);
      });
    });
  });
}

function getShopByConsultantId(id){
  return new Promise(function(resolve,reject){
    AuthUserDB.findById(id).exec(function(err,item){
      if (err) return reject(err);
      if (!item) return reject();
      ShopDB.findById(item.shopId).exec(function(err,item){
        if (err) return reject(err);
        if (!item) return reject();
        return resolve(item);
      });
    });
  });
}

function getRequestById(id){
  return new Promise(function(resolve,reject){
    RequestDB.findById(id, function(err, item){
      if (err) return reject(err);
      return resolve(item);
    });
  });
}

function getResponseById(id){
  return new Promise(function(resolve,reject){
    ResponseDB.findById(id, function(err, item){
      if (err) return reject(err);
      return resolve(item);
    });
  });
}

function getOrderById(id){
  return new Promise(function(resolve,reject){
    OrderDB.findById(id, function(err, item){
      if (err) return reject(err);
      if (!item) return resolve();
      var result = getReadableOrder(item);

      return resolve(result);
    });
  });
}

function getResponseByConsultantId(id){
  return new Promise(function(resolve,reject){
    ResponseDB.find('consultantId' == id, function(err, items){
      if (err) return reject(err);
      if (!items.length) return resolve([]);
      var result = [];
      for (var i = 0; i<items.length;i++){
        result.push(getReadableResp(items[i]));
      }
      return resolve(result);
    });
  });
}

function getRequestByShopId(id){
  return new Promise(function(resolve,reject){
    RequestDB.find({'shopId':id} , function(err, items){
      if (err) return reject(err);
      if (!items.length) return resolve([]);
      var result = [];
      for (var i = 0; i<items.length;i++){
        result.push(getReadableReq(items[i]));
      }
      return resolve(result);
    });
  });
}

function getReqRespByConsultant(consult){
  return new Promise(function(resolve,reject){
    var result = [];
    getRequestByShopId(consult.shopId)
    .then(function(requests){
      if (requests.length == 0){
        return resolve([]);
      }
      getResponseByConsultantId(consult.id)
      .then(function(responses){
        var count = 0;

        for (var i = 0; i<requests.length; i++){

          addReadableOrder(i)
          .then(function(){
            count++;
            if (count==requests.length){
              return resolve(result);
            }

          })
        }
        function addReadableOrder(tmpi){
          return new Promise(function(resolve,reject){
            getOrderById(requests[tmpi].orderId)
            .then(function(order){
              requests[tmpi].order = order;
              delete requests[tmpi].orderId;
              result.push({'request':requests[tmpi],'responses':[]});
              // console.log(result);
              var countj=0;
              var flag = false;
              for (var j = 0 ; j<responses.length;j++){
                if (requests[tmpi].id == responses[j].requestId){
                  flag = true;
                  addReadableShopItem(j)
                  .then(function(resp1){
                    countj++;
                    if (resp1.length)
                      result[tmpi].responses.push(resp1[0]);
                    if(countj==responses.length){
                      return resolve(result);
                    }
                  })

                }
                else
                {countj++;}
              }
              if (!flag){
                return resolve();
              }

              function addReadableShopItem(tmpj){

                return new Promise(function(resolve,reject){
                  var resp = [];
                  // return resolve(resp);
                  getShopItemId(responses[tmpj].shopItemId)
                  .then(function(shopItem){
                    responses[tmpj].shopItem = shopItem;
                    delete responses[tmpj].shopItemId;
                    resp.push(responses[tmpj]);
                    return resolve(resp);
                  });
                });
              };//addReadableShopItem
            });
          });

        };

      });
    });
  });
}

function getShopItemId(id){
  return new Promise(function(resolve,reject){
    ShopItemDB.findById( id, function(err, item){
      if (err) return reject(err);
      if (!item) return resolve();
      var result = getReadableShopItem(item);
      return resolve(result);
    });
  });
}

function getLastReqOrResByThreadId(threadId){
  return new Promise(function(resolve,reject){
    getLastReqByThreadId(threadId)
    .then(function(req){
      getLastResByThreadId(threadId)
      .then(function(res){
        if (!res || (req && req.sent>=res.sent)) {
          return resolve(req);
        }
        return resolve(res);
      });
    });
  });
  function getLastReqByThreadId(threadId){
    return new Promise(function(resolve,reject){
      RequestDB.findOne({'threadId': threadId}).sort({"sentTime":-1}).exec(function(err,item){
        if (err) return reject();
        if (!item) return resolve();
        var result = getReadableReq(item);
        getOrderById(item.orderId)
        .then(function(order){
          result.order = order;
          delete result.orderId;
          result.type = 'request';
          return resolve(result);
        });
      });
    });
  }
  function getLastResByThreadId(threadId){
    return new Promise(function(resolve,reject){
      ResponseDB.findOne({'threadId':threadId}).sort({"sentTime":-1}).exec(function(err,item){
        if (err) return reject();
        if (!item) return resolve();
        var result = getReadableResp(item);
        getShopItemId(item.shopItemId)
        .then(function(shopItem){
          result.shopItem = shopItem;
          delete result.shopItemId;
          result.type = 'response';
          return resolve(result);
        });
      });
    });
  }
}

function saveGoodRequest(clothes,size,msg){
  var record = {};
  AddChanel(msg)
  .then(function(id){
    record.sender = {'type':'user','id':id};
    ThreadV2DB.findOne({'userId': id})
    .exec(function(err,item){
      if (err) return reject(err);
      if (item) {
        record.threadId = item.id;
        var AI = {shops:["580608573c40411055ec8342"], item: clothes};
        if (AI.shops.length)
        {
          getUserById(id)
          .then(function(resp){
            var request = {};
            request.threadId = item.id;
            request.shops = AI.shops;
            request.sender = record.sender;
            var user = getReadableUser(resp);
            request.order = {item: AI.item,
                color: "",
                size: size,
                photo: [],
                comments: ""
              };
            console.log("HERE");
            saveRequestFromOperator(request);
          });

        };
      };

    });
  });

}
exports.saveGoodRequest = saveGoodRequest;
exports.CreateShop = CreateShop;
exports.CreateAddress = CreateAddress;
exports.CreateConsultant = CreateConsultant;
exports.AddTags = AddTags;
exports.CheckAuthUser = CheckAuthUser;
exports.CreateOperator = CreateOperator;
exports.CreateConsultant = CreateConsultant;
exports.UpdateUserData = UpdateUserData;
exports.GetUserData = GetUserData;
exports.CreateNewThreads = CreateNewThreads;
exports.GetTags = GetTags;
exports.GetShopById = GetShopById;
exports.saveMsgFromUser = saveMsgFromUser;
exports.getThreads = getThreads;
exports.getUserById = getUserById;
exports.getMsgById = getMsgById;
exports.getThreadById = getThreadById;
exports.getMsgsByThread = getMsgsByThread;
exports.getShops = getShops;
exports.getOperators = getOperators;
exports.getUserByThreadId = getUserByThreadId;
exports.getUserByThreadIdforSend = getUserByThreadIdforSend;
exports.saveMsgFromOperator = saveMsgFromOperator;
exports.saveRequestFromOperator = saveRequestFromOperator;
exports.saveResponseFromConsultant = saveResponseFromConsultant;
exports.getShopByConsultantId = getShopByConsultantId;
exports.getRequestById = getRequestById;
exports.getRequestByThread = getRequestByThread;
exports.getReqResByThread = getReqResByThread;
exports.getResponseById = getResponseById;
exports.getOrderById = getOrderById;
exports.getReqRespByConsultant = getReqRespByConsultant;
exports.getShopItemId = getShopItemId;
exports.getLastReqOrResByThreadId = getLastReqOrResByThreadId;
/*exports.MsgDB = MsgDB;
exports.ChanelDB = ChanelDB;
exports.ProviderDB = ProviderDB;
exports.APNSDB = APNSDB;
exports.ThreadDB = ThreadDB;
exports.WelcomeMsgDB = WelcomeMsgDB;

//function AddRequest

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

function GetUserData(msg) {
  return new Promise(function(resolve, reject) {
    ChanelDB.findOne({'address.user.id': msg.address.user.id}).exec(function(err, item) {
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
        if (item.userData==null)
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

function AddChanel(msg){
  return new Promise(function(resolve,reject){
    ChanelDB.findOne({'address.user.id': msg.address.user.id}).exec(function(err, item) {
      if (err) return reject(err);
      if (item != null) return resolve(item._id);
      var record = new ChanelDB(msg);
      if (msg.sourceEvent != null) {
        record.username = msg.sourceEvent.message.from.first_name + ' ' +
          msg.sourceEvent.message.from.last_name;
      } else {
        record.username = msg.address.user.name;
      }
      record.save();
      return resolve(record._id);
    });
  });
}
function GetAllProviders(){
  return new Promise(function(resolve,reject){
    ProviderDB.find().exec(function(err, items) {
      if (err) return reject(err);
      return resolve(items.length?items:[]);
    });
  });
}

function CreateNewThreads(session){
  return new Promise(function(resolve,reject){
    AddChanel(session.message)
    .then(function(customer){
      GetAllProviders()
      .then(function(providers){
        for (var i = 0; i < providers.length; i++){
          ThreadDB.findOne({'customer': customer, 'provider': providers[i]})
          .exec(function(err,item){
            if (err) return reject(err);
            if (item) return;
            var record = new ThreadDB({'customer': customer, 'provider': providers[i]});
            record.save();
          });
        };
        return resolve(true);
      })
    })
  });
}


exports.AddUserMsgInDB = AddUserMsgInDB;
exports.GetUserData = GetUserData;
exports.UpdateUserData = UpdateUserData;
exports.AddChanel = AddChanel;
exports.GetAllProviders = GetAllProviders;
exports.CreateNewThreads = CreateNewThreads;*/
