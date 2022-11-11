const app = require('express')();
const cors = require('cors')
var db = require('./db');
const Matter = require("matter-js");
var multer  = require('multer');
var path = require('path');
var util = require("util");

var bodyParser = require('body-parser');


app.use(cors())

const fs = require("fs");

const options = {
  key: fs.readFileSync("/etc/letsencrypt/live/websocket.thepicab.com/privkey.pem"),
  cert: fs.readFileSync("/etc/letsencrypt/live/websocket.thepicab.com/fullchain.pem"),
};

app.use('/images', require('express').static('images'));

const http = require('https').Server(options, app);
// const http = require('http').Server(app);
const io = require('socket.io')(http, {cors: {origin: "*"}});
const port = process.env.PORT || 4000;


var VerifyToken = require('./auth/VerifyToken');
// router.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
// router.use(bodyParser.json());
const userTable = require('./auth/user/User');
const BetHistory = require('./auth/betHistory/BetHistory');
const history = [];



// left == blue jar
// right == red jar


// Game Variable ---------------------
const pause_time = 20;
let game_time = 30;
var running = false;
var timer = 0;

const frameRate = 1000 / 60;
const canvas = {width: 1000, height: 480};
const wallThickness = 20;
const ballSize = 14;
var left = 0, right = 0;
const mid_x = canvas.width / 2;
const jar_width = 70;
const jar_height = 130;
const jar_x_offset = 130;
const jar_y = 390;

Matter.Common.setDecomp(require('poly-decomp'));

const triangle = Matter.Vertices.fromPath('-100 100 0 0 100 100');
const jar_left = Matter.Bodies.rectangle(mid_x - jar_width - jar_x_offset - 25, jar_y - jar_height / 2 + 30, 50, jar_height * 2, {isStatic: true});
const jar_right = Matter.Bodies.rectangle(mid_x + jar_width - jar_x_offset + 25, jar_y - jar_height / 2 + 30, 50, jar_height * 2, {isStatic: true});
const jar_bottom = Matter.Bodies.rectangle(mid_x - jar_x_offset, jar_y + jar_height / 2, jar_width * 2, 100, {isStatic: true});
const jar_bottom_left = Matter.Bodies.fromVertices(
  mid_x - jar_x_offset - jar_width + 20, jar_y + 60,
  Matter.Vertices.fromPath('0 0 40 10 40 100 0 100'),
  {isStatic: true} 
);
const jar_bottom_right = Matter.Bodies.fromVertices(
  mid_x - jar_x_offset + jar_width - 20, jar_y + 60,
  Matter.Vertices.fromPath('0 10 40 0 40 100 0 100'),
  {isStatic: true}
);
const jar_left_red = Matter.Bodies.rectangle(mid_x - jar_width + jar_x_offset - 25, jar_y - jar_height / 2 + 30, 50, jar_height * 2, {isStatic: true});
const jar_right_red = Matter.Bodies.rectangle(mid_x + jar_width + jar_x_offset + 25, jar_y - jar_height / 2 + 30, 50, jar_height * 2, {isStatic: true});
const jar_bottom_red = Matter.Bodies.rectangle(mid_x + jar_x_offset, jar_y + jar_height / 2, jar_width * 2, 100, {isStatic: true});
const jar_bottom_left_red = Matter.Bodies.fromVertices(
  mid_x + jar_x_offset - jar_width + 20, jar_y + 60,
  Matter.Vertices.fromPath('0 0 40 10 40 100 0 100'),
  {isStatic: true} 
);
const jar_bottom_right_red = Matter.Bodies.fromVertices(
  mid_x + jar_x_offset + jar_width - 20, jar_y + 60,
  Matter.Vertices.fromPath('0 10 40 0 40 100 0 100'),
  {isStatic: true}
);

const entities = {
  balls: [],
  jar_red: [
    jar_left,
    jar_bottom_left,
    jar_bottom,
    jar_bottom_right,
    jar_right,
  ],
  jar_blue: [
    jar_left_red,
    jar_bottom_left_red,
    jar_bottom_red,
    jar_bottom_right_red,
    jar_right_red,
  ],
  walls: [
    Matter.Bodies.fromVertices(canvas.width / 2, 200, triangle, {isStatic: true}),
    Matter.Bodies.rectangle(
      canvas.width / 2, 0, 
      canvas.width, 
      wallThickness, 
      {isStatic: true}
    ),
    Matter.Bodies.rectangle(
      0, canvas.height / 2, 
      wallThickness, 
      canvas.height, 
      {isStatic: true}
    ),
    Matter.Bodies.rectangle(
      canvas.width, 
      canvas.width / 2, 
      wallThickness, 
      canvas.width, 
      {isStatic: true}
    ),
    Matter.Bodies.rectangle(
      canvas.width / 2, 
      canvas.height, 
      canvas.width, 
      wallThickness, 
      {isStatic: true}
    ),
  ]
};

var engine = Matter.Engine.create();
Matter.Composite.add(engine.world, Object.values(entities).flat());
const toVertices = e => e.vertices.map(({x, y}) => ({x, y}));
const serializeCircle = e => {
  return {
    x: e.position.x,
    y: e.position.y,
    angle: e.angle,
    radius: ballSize
  }
}

var current_ball = null;

spawn_ball();



// let jars = ["blueJar", "pinkJar"]
// let score = { blueJar :0, pinkJar: 0, selectJar:""};
// let intervalGame;
// let startGame;
let betUsers = [];
// let gameId = '';
let pinkJarList= [];
let blueJarList = [];
let pinkJarListTotal = 0;
let blueJarListTotal = 0;
let winningJarHistory=[];
let lastGameWinner = [];

let playTime = 50;
let restartTime = 0;
let imageIndex = 0;

var AuthController = require('./auth/AuthController');
app.use('/api/auth', AuthController);

app.get('/admin', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});


// var storage = multer.diskStorage({
//   destination: function (req, file, callback) {
//       var dir = './images';
//       if (!fs.existsSync(dir)){
//           fs.mkdirSync(dir);
//       }
//       callback(null, dir);
//   },
//   filename: function (req, file, callback) {

//       // const totalFiles = Number(fs.readdirSync('./images').length);  
//       // const fileExtension = file.originalname.split('.')[1]
//       // const newFileName =  totalFiles.toString()+"."+fileExtension;
      
//       callback(null, file.originalname); 

//   }
// });
// var upload = multer({storage: storage}).array('files', 30);
// var uploadFilesMiddleware = util.promisify(upload);



var storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, path.join(`${__dirname}/images`));
  },
  filename: (req, file, callback) => {
    const match = ["image/png", "image/jpeg"];

    if (match.indexOf(file.mimetype) === -1) {
      var message = `<strong>${file.originalname}</strong> is invalid. Only accept png/jpeg.`;
      return callback(message, null);
    }

    // const totalFiles = Number(fs.readdirSync(path.join(`${__dirname}/images`)).length);  
    // const fileExtension = path.extname(file.originalname);
    // var filename =  totalFiles.toString()+"."+fileExtension;
    var filename = `${imageIndex}${path.extname(file.originalname)}`;
    imageIndex++
    callback(null, filename);
  }
});

var uploadFiles = multer({ storage: storage }).array("files", 50);
var uploadFilesMiddleware = util.promisify(uploadFiles);

app.post('/upload', VerifyToken, async function (req, res, next) {  
      imageIndex = 0;

      // if (req.files.length >= 30) {
      //   return res.status(200).send({ status: true, error: 'You must select at least 30 file'});
      // }

      await uploadFilesMiddleware(req, res);
      
      // return res.send(`Files has been uploaded.`);
      return res.status(200).send({ status: true, error: 'Files has been uploaded' });
})


// app.get('/updateUserBalance', (req, res) => {
//     userTable.update({ wallet: "7ejtMZgZg6wed4VsAAXBt7stEYbCAAHWvKmiM36TosDh"}, { $inc: { balance: 10 } });
// });


const updateUserbets = async(updatedata) => {

    BetHistory.insertMany(updatedata);  

    for (let i = 0; i < updatedata.length; i++) {
        userTable.findOne({ wallet: updatedata[i].wallet }, function(err, user) {
            if (err) return res.status(500).send('Error on the server.');
            const balance = Number(Number(updatedata[i].amount)+(user.balance)).toFixed(5);
            console.log("balance");
            console.log(balance);
            userTable.findByIdAndUpdate(user._id, { balance: balance }, { new: true }, function(err, user) {
              if (err) console.log(err);
              console.log(user.balance);
          });
        });
        // userTable.update({ wallet: updatedata[i].wallet}, { $inc: { balance: updatedata[i].amount } });
    }
      
}

io.on('connection', (socket) => {
  
  socket.on('initEvent', data => {
    console.log("initEvent")
    // if(history.length >= 50){
    //     history.shift();
    // }
    // history.push({name: data.name, message: data.message});
    socket.emit('gameStatus', {playTime:playTime, restartTime})
    // socket.broadcast.emit('updateBetHistory', betUsers)
    socket.emit('updateBetHistory', betUsers);
    socket.emit('updateBetTotal', {pinkJarBet:pinkJarListTotal, blueJarBet:blueJarListTotal})
    socket.emit('updateHistory', history);
    socket.emit('updateJarHistory', winningJarHistory)
    socket.emit('lastGameWinner', lastGameWinner)
  });

  socket.on("register", cb => cb({canvas}));

  socket.on('chat message', data => {
      if(history.length >= 50){
          history.shift();
      }
      history.push({name: data.name, message: data.message, colorscheme: data.colorscheme});
      io.sockets.emit('updateHistory', history);
  });

  socket.on('placeBid', data => {
      data.status = 2
      if(data.betJar == 'pink'){
          pinkJarListTotal += data.amount
          pinkJarList.push(data)
      }else{
          blueJarListTotal += data.amount
          blueJarList.push(data)
      }

      betUsers.push(data)

      socket.emit('updateBetHistory', betUsers)
      socket.emit('updateBetTotal', {pinkJarBet:Number(pinkJarListTotal), blueJarBet:Number(blueJarListTotal)})
  })
  
});



setInterval(() => {
  timer += 1;
}, 1000);

function spawn_ball() {
    if (!running) {
      gameId = Date.now().toString(36) + Math.random().toString(36).substr(2);
      game_time = Math.floor(Math.random() * (50 - 10 + 1)) + 10;
      setTimeout(reset, game_time * 1000);
      running = true;
      timer = 0;
    }
    current_ball = Matter.Bodies.circle(canvas.width / 2 + (Math.random() * 5 - 2.5), 50, ballSize);
    entities.balls.push(current_ball);
    Matter.Composite.add(engine.world, current_ball);
}

function game_update() {
    if (current_ball == null) return;
    if (current_ball.position.y > 250) {
        if (current_ball.position.x < 400) left += 1;
        else right += 1;
        spawn_ball();
    }
}

function reset() {

      const winJar = (right > left)?"blue":"pink"
    
      if(winJar == 'blue'){
          lastGameWinner = blueJarList;
          io.emit('lastGameWinner', blueJarList)

          pinkJarListTotal = Number(((pinkJarListTotal*95)/100));

          const blueupdateBetUsers1 = blueJarList.map(elem => ({ ...elem, game_id:gameId, winningJar:winJar, amount:Number((((Number(elem.amount)*100)/Number(blueJarListTotal)).toFixed(2)*Number(pinkJarListTotal))/100).toFixed(5), status:1 }));
          updateUserbets(blueupdateBetUsers1);

          const pinkupdateBetUsers1 = pinkJarList.map(elem => ({ ...elem, game_id:gameId, winningJar:winJar, amount:(Number(elem.amount)*-1).toFixed(5), status:0 }));
          updateUserbets(pinkupdateBetUsers1);
      }else{
          lastGameWinner = pinkJarList;
          io.sockets.emit('lastGameWinner', pinkJarList)
          blueJarListTotal = Number(((blueJarListTotal*95)/100));
          
          const pinkupdateBetUsers = pinkJarList.map(elem => ({ ...elem, game_id:gameId, winningJar:winJar, amount:Number((((Number(elem.amount)*100)/Number(pinkJarListTotal)).toFixed(2)*Number(blueJarListTotal))/100).toFixed(5), status:1 }));
          updateUserbets(pinkupdateBetUsers);
          
          const blueupdateBetUsers = blueJarList.map(elem => ({ ...elem, game_id:gameId, winningJar:winJar, amount:(Number(elem.amount)*-1).toFixed(5), status:0 }));
          updateUserbets(blueupdateBetUsers);    
      } 

      if(winningJarHistory.length >= 5){
          winningJarHistory.shift();
      }

      const winTime = (new Date()).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
      winningJarHistory.push({time:winTime, winJar:winJar})
      io.emit('updateJarHistory', winningJarHistory)
      // const updateBetUsers = betUsers.map(elem => ({ ...elem, game_id:gameId, winningJar:winJar, amount:(Number(elem.amount)*(elem.betJar === winJar)?1:-1).toFixed(5), status: (elem.betJar === winJar)?1:0}));
      // updateUserbets(updateBetUsers);
      betUsers=[]
      blueJarList= []
      pinkJarList= []
      pinkJarListTotal = 0;
      blueJarListTotal = 0;
      // io.sockets.emit('updateBetHistory', betUsers)
      io.emit('updateBetHistory', betUsers)
      io.emit('updateBetTotal', {pinkJarBet:0, blueJarBet:0})


    engine = Matter.Engine.create();
    entities.balls = [];
    left = 0;
    right = 0;
    Matter.Composite.add(engine.world, Object.values(entities).flat());
    running = false;
    timer = 0;
    setTimeout(spawn_ball, pause_time * 1000);
}


setInterval(() => {
  Matter.Engine.update(engine, frameRate);

  if(!running){
     io.emit('gameInterval', {timer: (pause_time - timer)});
  }

  let time = (running ? game_time - timer : pause_time - timer);
  let b = [];
  for (let i = 0; i < entities.balls.length; i++) {
    b.push(serializeCircle(entities.balls[i]));
  }
  io.emit("update state", {
    balls: b,
    jars: {
      red: entities.jar_red.map(toVertices),
      blue: entities.jar_blue.map(toVertices)
    }, 
    walls: entities.walls.map(toVertices),
    score: { left, right },
    running: running,
    time: time
  });
  game_update();
}, frameRate);

setInterval(() => {
    reset, 30000
})

// end Variable ---------------------


// setInterval(() => {
//   if(playTime > 0){

//       let selectJar = random_item(jars);
//       score[selectJar]++;
//       score["selectJar"] = selectJar;
//       io.sockets.emit('gameScore', score);

//       if(playTime == 1){
//           const winJar = (score.blueJar > score.pinkJar)?"blue":"pink"
          
//           console.log("totalPinkJarValue")
//           console.log(pinkJarList)
//           console.log("totalBlueJarValue")
//           console.log(blueJarList)
//           // const totalPinkJarValue = pinkJarList.pinkuce((total, currentValue) => total = total + currentValue.amount);
//           // const totalBlueJarValue = blueJarList.pinkuce((total, currentValue) => total = total + currentValue.amount);
//           // console.log("totalBlueJarValue")
//           // console.log(totalBlueJarValue)

//           if(winJar == 'blue'){
//               lastGameWinner = blueJarList;
//               io.sockets.emit('lastGameWinner', blueJarList)

//               pinkJarListTotal = Number(((pinkJarListTotal*95)/100));

//               const blueupdateBetUsers1 = blueJarList.map(elem => ({ ...elem, game_id:gameId, winningJar:winJar, amount:Number((((Number(elem.amount)*100)/Number(blueJarListTotal)).toFixed(2)*Number(pinkJarListTotal))/100).toFixed(5), status:1 }));
//               updateUserbets(blueupdateBetUsers1);

//               const pinkupdateBetUsers1 = pinkJarList.map(elem => ({ ...elem, game_id:gameId, winningJar:winJar, amount:(Number(elem.amount)*-1).toFixed(5), status:0 }));
//               updateUserbets(pinkupdateBetUsers1);
//           }else{
//               lastGameWinner = pinkJarList;
//               io.sockets.emit('lastGameWinner', pinkJarList)
//               blueJarListTotal = Number(((blueJarListTotal*95)/100));
              
//               const pinkupdateBetUsers = pinkJarList.map(elem => ({ ...elem, game_id:gameId, winningJar:winJar, amount:Number((((Number(elem.amount)*100)/Number(pinkJarListTotal)).toFixed(2)*Number(blueJarListTotal))/100).toFixed(5), status:1 }));
//               updateUserbets(pinkupdateBetUsers);
              
//               const blueupdateBetUsers = blueJarList.map(elem => ({ ...elem, game_id:gameId, winningJar:winJar, amount:(Number(elem.amount)*-1).toFixed(5), status:0 }));
//               updateUserbets(blueupdateBetUsers);    
//           } 

//           if(winningJarHistory.length >= 5){
//               winningJarHistory.shift();
//           }

//           const winTime = (new Date()).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
//           winningJarHistory.push({time:winTime, winJar:winJar})
//           io.sockets.emit('updateJarHistory', winningJarHistory)
//           // const updateBetUsers = betUsers.map(elem => ({ ...elem, game_id:gameId, winningJar:winJar, amount:(Number(elem.amount)*(elem.betJar === winJar)?1:-1).toFixed(5), status: (elem.betJar === winJar)?1:0}));
//           // updateUserbets(updateBetUsers);
//           betUsers=[]
//           blueJarList= []
//           pinkJarList= []
//           pinkJarListTotal = 0;
//           blueJarListTotal = 0;
//           // io.sockets.emit('updateBetHistory', betUsers)
//           io.sockets.emit('updateBetHistory', betUsers)
//           io.sockets.emit('updateBetTotal', {pinkJarBet:0, blueJarBet:0})

//           restartTime = 20;
//       }

//       playTime--;
//   }

//   if(restartTime > 0){

//     io.sockets.emit('gameInterval', {timer:restartTime});

//     if(restartTime == 1){
//       score = { blueJar :0, pinkJar: 0};

//       playTime = Math.floor(Math.random() * (50 - 10 + 1)) + 10;
//       // playTime = 50;
//       gameId = Date.now().toString(36) + Math.random().toString(36).substr(2);
//     }
      
//       restartTime--;

//   }
// }, 1000);

http.listen(port, () => {
  console.log(`Socket.IO server running at http://localhost:${port}/`);
});
