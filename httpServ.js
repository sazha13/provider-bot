var db = require('./db.js');


function respond(req, res, next) {
  res.contentType = "text/plain";
  res.send('SERVER WORKING');
  next();
}

function handleRequestMessage(req, res, next) {
  res.send('POST API Response!!!');
  next();
}



function getThreads(req, res, next){
  var resp = [];
  db.CheckAuthUser(req.authorization)
  .then(OnAuthOk);

  function OnAuthOk(result){
    if (!result.auth) {
      res.send(401);
      return;
    };
    var promise = new Promise(function(resolve,reject){
      db.getThreads()
      .then(function(threads){
        var count = 0;
        for (var i = 0; i < threads.length; i++)
        {
          threadCreate(threads[i])
          .then(function(response){
            count++;
            resp.push(response);
            if (count == threads.length){
              return resolve();
            }
          });

        }
      });
    });
    promise.then(function(){
      console.log(resp);
      res.send(resp);
    });
  }
  function threadCreate(thread){
    return new Promise(function(resolve, reject) {
      var newThread = {'threadId':thread.id};
      db.getUserById(thread.userId)
      .then(function(response){
        if (!response) return;
        newThread.username = response.username;
        if (response.userData && response.userData.profile && response.userData.profile.name){
          newThread.username = response.userData.profile.name;
        };
        return;
      })
      .then(function(){
        return db.getMsgById(thread.messages[thread.messages.length-1])
      })
      .then(function(msg){
        if (!msg) return;
        newThread.last_message = {};
        newThread.last_message.type = 'message';
        newThread.last_message.sender = msg.sender;
        newThread.last_message.message = msg;
        return;
      })
      .then(function(response){
        //result.push(newThread);
        return resolve(newThread)
      });
    });
  }
};

function getThreadMsgs(req, res, next){
  res.send('Under construction');
};
function postThreadMsgs(req, res, next){
  res.send('Under construction');
};
function postAPNs(req, res, next){
  res.send('Under construction');
};
function postCreateProvider(req, res, next){
  res.send('Under construction');
};
function postThreadMsgSeen(req, res, next){
  res.send('Under construction');
};

function postCreateShop(req, res, next){
  res.contentType = 'application/json';
  res.charset = 'utf-8';
  db.CreateShop(req.body)
  .then(function(result){
    res.send(201);
  })
  .catch(function(result){
    res.send(401);
  });
};

function postCreateOperator(req, res, next){
  res.contentType = 'application/json';
  res.charset = 'utf-8';
  var operator = req.body;
  if (req && req.authorization && req.authorization.basic){
    operator.login = req.authorization.basic.username;
    operator.password = req.authorization.basic.password;
  }
  console.log(operator);
  db.CreateOperator(operator)
  .then(function(result){
    console.log('SEND 201');
    res.send(201);
  })
  .catch(function(result){
    console.log('SEND 401');
    res.send(401);
  });
}

function postCreateConsultant(req, res, next){
  res.contentType = 'application/json';
  res.charset = 'utf-8';
  var consultant = req.body;
  if (req && req.authorization && req.authorization.basic){
    consultant.login = req.authorization.basic.username;
    consultant.password = req.authorization.basic.password;
  }
  console.log(consultant);
  db.CreateConsultant(consultant,null,consultant.shop)
  .then(function(result){
    console.log('SEND 201');
    res.send(201);
  })
  .catch(function(result){
    console.log('SEND 401');
    res.send(401);
  });
}

exports.respond = respond;
exports.handleRequestMessage = handleRequestMessage;
exports.getThreads = getThreads;
// exports.getThreadMsgs = getThreadMsgs;
// exports.postThreadMsgs = postThreadMsgs;
// exports.postAPNs = postAPNs;
exports.postCreateProvider = postCreateProvider;
exports.postThreadMsgSeen = postThreadMsgSeen;
exports.postCreateShop = postCreateShop;
exports.postCreateOperator = postCreateOperator;
exports.postCreateConsultant = postCreateConsultant;
