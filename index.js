const express = require('express')
const { MongoClient, ObjectID } = require("mongodb");

const app = express()
const http = require('http').Server(app);
const io = require('socket.io')(http);

const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser")

const uri = "mongodb://localhost:27017/pfc";
const client = new MongoClient(uri);

let db,lobby = {} 
async function connectDB() {
  try {
    await client.connect();
    db = client.db("pfc")
    await db.command({ ping: 1 });
    console.log("Connected successfully to Mongo");
    lobby = db.collection("lobby")
  } catch {
    console.dir
  }
}
connectDB()

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('front'));

http.listen(process.env.PORT || 8079, () => {
  console.log('Serveur listening on port 8079')
})

app.post('/api/lobby', async (req,res) => {
  let id = '';
  let username = req.body.username;
  let socketId = req.body.socketId
  lobby.insertOne({player1: username, p1socketId: socketId, createdAt: Date()})
  .then(result => {
    id = result.insertedId
    res.send(id);
  })
  .catch(err => console.error(`Failed to insert item: ${err}`))
})

app.get('/api/lobby/:id/:username/:socketId', async (req,res) => {
  let id = req.params.id
  let opponent = req.params.username
  let socketId = req.params.socketId
  let result = await lobby.findOne({"_id": new ObjectID(id)})
  if (result){
    if (!result.opponent) {
      let update = await lobby.updateOne({"_id": new ObjectID(id)}, {$set: {"player2": opponent, p2socketId: socketId, "joinedAt": Date()}})
      if (update.modifiedCount) {
        let updated = await lobby.findOne({"_id": new ObjectID(id)})
        io.to(updated.p2socketId).emit( 'game started', updated );
        io.to(updated.p1socketId).emit( 'game started', updated );
        res.send("{\"status\" : \"ok\"}")
      } else {
        res.send("{\"status\" : \"cannot join\"}")
      }
    } else {
      res.send("{\"status\" : \"lobby already joined by someone\"}")
    }
  } else {
    res.send("{\"status\" : \"lobby does not exists\"}")
  }
})

/*
app.get('/posts',  (req,res) => {
  posts.find({}).toArray(function(err, result) {
    if (err) throw err;
    console.log('GET /posts')
    res.send(result);
  });
})

app.get('/posts/:id', async (req,res) => {
  await posts.findOne({"_id": new ObjectID(req.params.id)}, function(err, result) {
    if (err) throw err;
    res.send(result);
  });
})

app.post('/posts', async (req,res) => {
  console.log(req.body)
  let creator = req.body.creator;
  let title = req.body.title;
  let message = req.body.message;
  await posts.insertOne({
    creator: creator,
    title: title,
    message: message,
    createdAt: Date()
  });
  await posts.findOne({"creator": creator, "title": title, "message": message}, function(err, result) {
    if (err) throw err;
    if (result) {
      console.log(result)
      res.send(result);
      io.emit('new message', result);
    } else {
      res.send("{\"status\" : \"error\"}")
    }
  });
})

app.put('/posts/:id', (req,res) => {
  let id = req.params.id;
  let message = req.body.message;
  let lastModifiedBy = req.body.lastModifiedBy;
  let lastModifyDate = req.body.lastModifyDate;
  posts.updateOne({"_id": new ObjectID(id)}, {$set: {"lastModifiedBy": lastModifiedBy, "lastModifyDate": lastModifyDate, "message": message}}, function(err, result) {
    if (err) throw err;
    if (result.modifiedCount) {
      posts.findOne({"_id": new ObjectID(id)}, function(err, result) {
        if (err) throw err;
        io.emit('updated message', result)
        res.send(`{"status" : "ok", ${result}}`)
      });
    } else {
      res.send("{\"status\" : \"error\"}")
    }
  })
})

app.delete('/posts/:id', (req,res) => {
  let id = req.params.id
  posts.deleteOne({"_id": new ObjectID(id)}, function(err, result) {
    if (err) throw err;
    if(result.deletedCount){
      res.send(`{"id": ${id}, "status" : "deleted"}`)
      io.emit('deleted message', `{"id":"${id}", "status":"deleted"}`)
    } else {
      res.send(`{"id": ${id}, "status" : "error"}`)
    } 
  })
})
*/

function winner(p1Choice, p2Choice){
  let winner = ''
  if (p1Choice == 'pierre'){
    if (p2Choice == 'feuille'){
      winner = 'p2'
    } else if (p2Choice == 'ciseaux'){
      winner = 'p1'
    } else if (p2Choice == 'pierre') {
      winner = 'none'
    } else {
      // Error
    }
  } else if (p1Choice == 'feuille'){
    if (p2Choice == 'feuille'){
      winner = 'none'
    } else if (p2Choice == 'ciseaux'){
      winner = 'p2'
    } else if (p2Choice == 'pierre') {
      winner = 'p1'
    } else {
      // Error
    }
  } else if (p1Choice == 'ciseaux'){
    if (p2Choice == 'feuille'){
      winner = 'p1'
    } else if (p2Choice == 'ciseaux'){
      winner = 'none'
    }else if (p2Choice == 'pierre') {
      winner = 'p2'
    } else {
      // Error
    }
  } else {
    //Error
  }
  return winner
}

io.on("connection", (socket) => {
  console.log('SocketIO : new user connected');
  socket.on("game choice", async (msg) => {
    let lobbyData = await lobby.findOne({"_id": new ObjectID(msg.id)}) 
    console.log(lobbyData)
    if(lobbyData.p1socketId == socket.id || lobbyData.p2socketId == socket.id) {
      if (lobbyData.p1socketId == socket.id) {
        let update = await lobby.updateOne({"_id": new ObjectID(msg.id)}, {$set: {"p1Choice": msg.choice}})
      } else if (lobbyData.p2socketId == socket.id) {
        let update = await lobby.updateOne({"_id": new ObjectID(msg.id)}, {$set: {"p2Choice": msg.choice}})
      }
      io.to(socket.id).emit( 'choice ok', msg.choice );
      lobbyData = await lobby.findOne({"_id": new ObjectID(msg.id)}) 
      if(lobbyData.p1Choice && lobbyData.p2Choice){
        let winnerPlayer = winner(lobbyData.p1Choice, lobbyData.p2Choice)
        let update = await lobby.updateOne({"_id": new ObjectID(msg.id)}, {$set: {"winner": winnerPlayer}})
        lobbyData = await lobby.findOne({"_id": new ObjectID(msg.id)}) 
        io.to(lobbyData.p1socketId).emit( 'turn done', lobbyData );
        io.to(lobbyData.p2socketId).emit( 'turn done', lobbyData );
        update = await lobby.updateOne({"_id": new ObjectID(msg.id)}, {$set: {"p1Choice": '', "p2Choice": ''}})
        io.to(lobbyData.p1socketId).emit( 'turn reseted', lobbyData );
        io.to(lobbyData.p2socketId).emit( 'turn reseted', lobbyData );
      }
    } else {
      //Error
    }
  });
});