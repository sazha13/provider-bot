var WebSocketServer = require('ws').Server;

// var wss = new WebSocketServer({
//   server
// });
var wss = new WebSocketServer({noServer:true});
function addServer(server){
  //wss.server = server;
}
wss.on('connection', function(ws) {
  console.log("WS connection add " + wss.clients.length);
  ws.on('close', function(code, message) {
    console.log("WS CLOSE " + wss.clients.length);
  });
});

exports.addServer = addServer;
