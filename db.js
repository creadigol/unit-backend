var mongoose = require('mongoose');
mongoose.connect('mongodb://maulikpatel:maulik123@3.131.162.222:27017/unityGame', {auth:{authdb:"admin"}});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error: "));
db.once("open", function () {
  console.log("Connected successfully");
});


//admin
// db.createUser({ user: "maulik" , pwd: "maulik123", roles: ["userAdminAnyDatabase", "dbAdminAnyDatabase", "readWriteAnyDatabase"]})

// unity Game user
// db.createUser({user: 'maulikpatel',pwd: 'maulik123',roles: [{  role: 'readWrite',  db: 'unityGame'}]})
