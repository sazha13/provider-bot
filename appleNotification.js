var apns = require('apns');
var db = require('./db');

var options = {
  keyFile: 'cert/213.key.pem',
  certFile: 'cert/213.crt.pem',
  debug: true
};
// APNS
var connection = new apns.Connection(options);
// just test APNS
function sendNotification() {
  var notification = new apns.Notification();
  notification.alert = 'Hello World !';
  db.APNSDB.find().exec(function(err, items) {
    items.forEach(function(item) {
      notification.device = new apns.Device(item.token);
      connection.sendNotification(notification);
    });
  });
}
// end test

exports.sendNotification = sendNotification;
