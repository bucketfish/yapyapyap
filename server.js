
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
      slides: [],
      captions: [],
      imgVotes: [[], [], [], []],
      captionVotes: [[], [], []],
      usedImgs: [],
      usedCaptions: [],
      audience: []
    }
  }

  res.render('present', { roomId })
})


const IMAGES = 38 // from 0 to this number inclusive




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

    //
    // }
  })

  socket.on('vote', ({ roomId, index, prevvote }) => {
    const game = games[roomId]

    if (game && game.imgVotes[index] !== undefined) {

      for (var i = 0; i < game.imgVotes.length; i++ ){
        let index = game.imgVotes[i].indexOf(socket.id)
        if (index !== -1)  game.imgVotes[i].splice(index, 1);
      }
      game.imgVotes[index].push(socket.id);

      var emittedData = [game.imgVotes[0].length, game.imgVotes[1].length, game.imgVotes[2].length, game.imgVotes[3].length, ]
      io.to(roomId).emit('voteData', emittedData)
    }
  })

  socket.on('nextRound', (roomId) => {
    const game = games[roomId]
    if (game) {
      let maxVote = Math.max(...game.imgVotes);
      let maxVoteIndex = game.imgVotes.indexOf(maxVote);
      let winningImg = game.slides[maxVoteIndex];

      let maxVoteCaption = Math.max(...game.captionVotes);
      let maxVoteCaptionIndex = game.captionVotes.indexOf(maxVoteCaption);
      let winningCaption = game.captions[maxVoteCaptionIndex]

      io.to(roomId).emit('showSlide', [winningImg, winningCaption])
      game.usedImgs.push(winningImg)
      game.usedCaptions.push(winningCaption)

      game.slides = getUnusedRandImgs(roomId)
      game.captions = getUnusedRandCaptions(roomId)
      game.imgVotes = [[], [], [], []]
      game.captionVotes = [[], [], []]
      io.to(roomId).emit('slides', [game.slides, game.captions])
      io.to(roomId).emit('voteData', game.imgVotes)
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



function getUnusedRandImgs(roomId) {
  var randInts = []
  while (randInts.length < 4) {
    let randInt = Math.floor(Math.random() * (IMAGES + 1));
    if (!randInts.includes("/images/image" + randInt + '.jpg') && !games[roomId].usedImgs.includes("/images/image" + randInt + '.jpg')) {
      randInts.push("/images/image" + randInt + '.jpg');
    }
  }

  return randInts;
}


const CAPTIONS = [
  "So...", "This is me.", "The solution...", "Hence", "Since the start", "Therefore", "However...", "On the other hand", "You may not know this:", "Unfortunately", "The reason", "The cause", "The problem", "The root problem", "A new direction", "Our ideal", "The plan", "Why?", "How?", "Who?", "When?", "Fortunately", "The future",
]

function getUnusedRandCaptions(roomId) {
  var randInts = []
  while (randInts.length < 3) {
    let randInt = Math.floor(Math.random() * (CAPTIONS.length));
    if (!randInts.includes(CAPTIONS[randInt]) && !games[roomId].usedCaptions.includes(CAPTIONS[randInt])) {
      randInts.push(CAPTIONS[randInt]);
    }
  }

  return randInts;
}
