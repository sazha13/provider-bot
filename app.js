var express = require('express');
var app = express();
var port = process.env.PORT || 3000;
var http = require('http').Server(app);

app.get('/', function(req, res){
 res.sendFile(__dirname + '/index.html');
});

http.listen(port, function(){
 console.log('listening on ' + port);
});
