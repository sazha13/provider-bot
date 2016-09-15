var db = require('./db.js');
var bot = require('./botFunc.js');

function respond(req, res, next) {
  res.contentType = 'text/plain';
  res.send('SERVER WORKING');
  next();
}

function handleRequestMessage(req, res, next) {
  res.send('POST API Response!!!');
  next();
}

function getThreads(req, res, next) {
  var resp = [];
  db.CheckAuthUser(req.authorization)
  .then(OnAuthOk);

  function OnAuthOk(result) {
    if (!result.auth) {
      res.send(401);
      return;
    };
    var promise = new Promise(function(resolve, reject) {
      db.getThreads()
      .then(function(threads) {
        var count = 0;
        for (var i = 0; i < threads.length; i++) {
          threadCreate(threads[i])
          .then(function(response) {
            count++;
            resp.push(response);
            console.log(response);
            console.log(count);
            if (count == threads.length) {
              return resolve();
            }
          });

        }
      });
    });
    promise.then(function() {
      console.log(resp);
      res.send(resp);
    });
  }
  function threadCreate(thread) {
    return new Promise(function(resolve, reject) {
      var newThread = {'threadId': thread.id};
      db.getUserById(thread.userId)
      .then(function(response) {
        if (!response) {return; };
        newThread.username = response.username;
        if (response.userData &&
            response.userData.profile &&
            response.userData.profile.name) {
          newThread.username = response.userData.profile.name;
        };
        return;
      })
      .then(function() {
        return db.getMsgById(thread.messages[thread.messages.length - 1]);
      })
      .then(function(msg) {
        if (!msg) return;
        newThread.lastMessage = {};
        newThread.lastMessage.type = 'message';
        newThread.lastMessage.sender = msg.sender;
        newThread.lastMessage.message = msg;
        console.log("HERE");
        return;
      })
      .then(function(){
         return db.getRequestById(thread.responses[thread.responses.length - 1].request);
      })
      .then(function(request){
        console.log("HERE");

         if (!request) return;
         newThread.lastRequest = {};
         newThread.lastRequest.type = 'request';
         newThread.lastRequest.sender = {'type': 'operator', 'id': request.operatorId};
         //newThread.lastRequest.order = request.orderId;
         console.log('request.orderId');
         console.log(request.orderId);
         return request.orderId;
      })
      .then(function(orderId){
        console.log(orderId);
        return db.getOrderById(orderId);
      })
      .then(function(order){
        console.log("order");
        console.log(order);
        newThread.lastRequest.order = order;
        return;
      })
      .then(function(response) {
        //result.push(newThread);
        return resolve(newThread);
      })
      .catch(function(){
        return resolve(newThread);
      });
    });
  }
};

function getThreadMsgs(req, res, next) {
  var resp = {messages: [],requests: []};
  db.CheckAuthUser(req.authorization)
  .then(OnAuthOk);

  function OnAuthOk(result) {
    if (!result.auth) {
      res.send(401);
      return;
    };
    db.getMsgsByThread(req.params.THREAD_ID)
    .then(function(response) {
      resp.messages = response;
      return;
    })
    .then(function(){
      return db.getReqResByThread(req.params.THREAD_ID);
    })
    .then(function(response){
      resp.requests = response;
      res.send(resp);
    });

  }
}

function postThreadMsgs(req, res, next) {
  var resp = {};
  db.CheckAuthUser(req.authorization)
  .then(OnAuthOk);

  function OnAuthOk(result) {
    if (!result.auth) {
      res.send(401);
      return;
    };
    if (!result.AuthUser || result.AuthUser.group != 'operator') {
      res.send(401);
      return;
    };
    db.getThreadById(req.params.THREAD_ID)
    .then(function(response){
      if (!response){
        res.send(401);
        return;
      }

      var msg = req.body;
      msg.sender = {'id': result.AuthUserId, 'type':'operator'};
      msg.threadId = req.params.THREAD_ID;
      db.saveMsgFromOperator(msg)
      .then(function(response){
        if (!response){
          res.send(401);
          return;
        };
        resp.threadId = response.threadId;
        resp.id = response._id;
        resp.sender = response.sender;
        resp.type = 'message';
        resp.text = response.text;
        resp.attachments = response.attachments;
        resp.sent = response.sentTime.getTime() / 1000 | 0;
        resp.unseen = 0;
        res.send(resp);
        db.getUserByThreadId(response.threadId)
        .then(function(user){
          bot.SendMsg(user.address,response.text,response.attachments);
        });
      });
    })
    .catch(function(){
      res.send(401);
    });


  };
};
function postAPNs(req, res, next) {
  res.send('Under construction');
};
function postCreateProvider(req, res, next) {
  res.send('Under construction');
};
function postThreadMsgSeen(req, res, next) {
  res.send('Under construction');
};

function postCreateShop(req, res, next) {
  res.contentType = 'application/json';
  res.charset = 'utf-8';
  db.CreateShop(req.body)
  .then(function(result) {
    res.send(201);
  })
  .catch(function(result) {
    res.send(401);
  });
};

function postCreateOperator(req, res, next) {
  res.contentType = 'application/json';
  res.charset = 'utf-8';
  var operator = req.body;
  if (req && req.authorization && req.authorization.basic) {
    operator.login = req.authorization.basic.username;
    operator.password = req.authorization.basic.password;
  }
  console.log(operator);
  db.CreateOperator(operator)
  .then(function(result) {
    console.log('SEND 201');
    res.send(201);
  })
  .catch(function(result) {
    console.log('SEND 401');
    res.send(401);
  });
}

function postCreateConsultant(req, res, next) {
  res.contentType = 'application/json';
  res.charset = 'utf-8';
  var consultant = req.body;
  if (req && req.authorization && req.authorization.basic) {
    consultant.login = req.authorization.basic.username;
    consultant.password = req.authorization.basic.password;
  }
  console.log(consultant);
  db.CreateConsultant(consultant,null,consultant.shop)
  .then(function(result) {
    console.log('SEND 201');
    res.send(201);
  })
  .catch(function(result) {
    console.log('SEND 401');
    res.send(401);
  });
}

function postThreadRequest(req, res, next) {
  db.CheckAuthUser(req.authorization)
  .then(OnAuthOk);

  function OnAuthOk(result) {
    if (!result.auth) {
      res.send(401);
      return;
    };
    if (!result.AuthUser || result.AuthUser.group != 'operator') {
      res.send(401);
      return;
    };
    db.getThreadById(req.params.THREAD_ID)
    .then(function(response){
      if (!response){
        res.send(401);
        return;
      }
      var request = req.body;
      request.sender = {'id': result.AuthUserId, 'type':'operator'};
      request.threadId = req.params.THREAD_ID;
      db.saveRequestFromOperator(request)
      .then(function(response){
        if (!response){
          res.send(401);
          return;
        };
        console.log('HERE');
        response.unseen = 0;
        console.log(response);
        res.send(response);
      });
    });
  }
}

function postThreadResponse(req, res, next) {
  var resp = {};
  db.CheckAuthUser(req.authorization)
  .then(OnAuthOk);

  function OnAuthOk(result) {
    if (!result.auth) {
      res.send(401);
      return;
    };

    if (!result.AuthUser || result.AuthUser.group != 'consultant') {
      res.send(401);
      return;
    };
    db.getThreadById(req.params.THREAD_ID)
    .then(function(response){
      if (!response){
        res.send(401);
        return;
      }
      resp = req.body;
      resp.sender = {'id': result.AuthUserId, 'type':'consultant'};
      resp.threadId = req.params.THREAD_ID;
      db.saveResponseFromConsultant(resp)
      .then(function(response){
        if (!response){
          res.send(401);
          return;
        };
        response.unseen = 0;
        res.send(response);
        db.getUserByThreadId(req.params.THREAD_ID)
        .then(function(user){
          if (!user) return;
          db.getShopByConsultantId(response.sender.id)
          .then(function(shop){
            bot.SendResponse(user.address, response, shop);
          });

        });
      });
    });
  }
}
function getShopRequest(req, res, next) {
  var resp = {};
  db.CheckAuthUser(req.authorization)
  .then(OnAuthOk);

  function OnAuthOk(result) {
    if (!result.auth) {
      res.send(401);
      return;
    };
  }
}

function getShops(req, res, next) {
  var resp = {};
  db.getShops()
  .then(function(response) {
    res.send(response);
  });
}

function getOperator(req, res, next) {
  var resp = {};
  db.getOperators()
  .then(function(response) {
    res.send(response);
  });
}

function getThreadUser(req, res, next) {
  var resp = {};
  db.getUserByThreadId(req.params.THREAD_ID)
  .then(function(response) {
    res.send(response);
  });
}

exports.respond = respond;
exports.handleRequestMessage = handleRequestMessage;
exports.getThreads = getThreads;//доделать
exports.getThreadMsgs = getThreadMsgs;//доделать
exports.postThreadMsgs = postThreadMsgs;
// exports.postAPNs = postAPNs;
exports.postCreateProvider = postCreateProvider;
exports.postThreadMsgSeen = postThreadMsgSeen;//сделать
exports.postCreateShop = postCreateShop;
exports.postCreateOperator = postCreateOperator;
exports.postCreateConsultant = postCreateConsultant;
exports.postThreadRequest = postThreadRequest; //заглушка
exports.postThreadResponse = postThreadResponse;//заглушка
exports.getShops = getShops;
exports.getOperator = getOperator;
exports.getThreadUser = getThreadUser;
exports.getShopRequest = getShopRequest; //не доделана
