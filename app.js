var restify = require('restify');
var port = process.env.PORT || 3000;

function respond(req, res, next) {
  res.send('Your bot response :)');
  next();
}

// post request
function handleRequestMessage(req, res, next) {
  res.send('POST API Response!!!');
  next();
}

var server = restify.createServer();
server.get('/', respond);
server.post('/request', handleRequestMessage);

server.listen(port, function() {
  console.log('%s listening at %s', server.name, server.url);
});
