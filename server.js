
const express = require('express')
const app = express()
const http = require('http').createServer(app)
const io = require('socket.io')(http)
var dotenv = require('dotenv');
dotenv.config()

const PORT = process.env.PORT || 3000

app.set('view engine', 'ejs')
app.use(express.static('public'))


// const { getRandomSlide } = require('./data.js')

const games = {}

app.get('/', (req, res) => {
  res.render('index')
})

// serve present view (creates new room if needed)
app.get('/present/:roomId', (req, res) => {
  const roomId = req.params.roomId

  if (!games[roomId]) {
    const slides = [""] // get random slides later
    games[roomId] = {
      slides,
      votes: [0, 0, 0],
      audience: []
    }
  }

  res.render('present', { roomId })
})

app.get('/audience/:roomId', (req, res) => {
  const roomId = req.params.roomId

  if (!games[roomId]) {
    res.render('no-room');
  }
  else {
    res.render('audience', { roomId });
  }

})


io.on('connection', (socket) => {
  console.log(`${socket.id} connected`)

  socket.on('joinRoom', (roomId) => {
    socket.join(roomId)

    const game = games[roomId]

    if (!games[roomId].audience.includes(socket.id)){
      games[roomId].audience.push(socket.id)
    }

    console.log(`${socket.id} joined room ${roomId}. there are ${games[roomId].audience.length} players`)


    // if (game) {
      io.to(roomId).emit('audienceUpdate', game.audience)

    //   socket.emit('slides', game.slides)
    //   socket.emit('voteData', game.votes)
    //
    // }
  })

  socket.on('vote', ({ roomId, index }) => {
    const game = games[roomId]
    if (game && game.votes[index] !== undefined) {
      game.votes[index]++
      io.to(roomId).emit('voteData', game.votes)
    }
  })

  socket.on('nextRound', (roomId) => {
    const game = games[roomId]
    if (game) {
      game.slides = [""]
      game.votes = [0, 0, 0]
      io.to(roomId).emit('slides', game.slides)
      io.to(roomId).emit('voteData', game.votes)
    }
  })

  socket.on('leaveRoom', (roomId) => {
    const game = games[roomId]
    if (game) {
      let index = game.audience.indexOf(socket.id)
      if (index !== -1) game.audience.splice(index, 1);
      console.log(`${socket.id} left ${roomId}`)
    }
  })

  socket.on('disconnect', () => {
    console.log(`${socket.id} disconnected`)

  })
})

http.listen(PORT, () => {
  console.log(`listening on http://localhost:${PORT}`)
})
