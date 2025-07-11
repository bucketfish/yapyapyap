
const express = require('express')
const app = express()
const http = require('http').createServer(app)
const io = require('socket.io')(http)
var dotenv = require('dotenv');
dotenv.config()

const PORT = process.env.PORT || 3000

const GAME_ROUNDS = 5



app.set('view engine', 'ejs')
app.use(express.static('public'))


// const { getRandomSlide } = require('./data.js')

const games = {}

app.get('/', (req, res) => {
  res.render('index')
})

app.get('/present/:roomId', (req, res) => {
  const roomId = req.params.roomId

  if (!games[roomId]) {
    games[roomId] = {
      slides: [],
      captions: [],
      imgVotes: [[], [], [], []],
      captionVotes: [[], [], []],
      usedImgs: [],
      usedCaptions: [],
      audience: [],
      votingRound: 0
    }

    games[roomId].slides = getUnusedRandImgs(roomId)
    games[roomId].captions = getUnusedRandCaptions(roomId, games[roomId].votingRound)


    res.render('present', { roomId })
  }


  else {
    res.render('already-room', { roomId })
  }


})


const IMAGES = 38 // from 0 to this number inclusive




app.get('/audience/:roomId', (req, res) => {
  const roomId = req.params.roomId

  if (!games[roomId]) {
    res.render('no-room', { roomId });
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

    io.to(roomId).emit('slides', [game.slides, game.captions, game.votingRound])

    var emittedData = [game.imgVotes[0].length, game.imgVotes[1].length, game.imgVotes[2].length, game.imgVotes[3].length, ]
    io.to(roomId).emit('voteDataImg', emittedData)

    var emittedData = [game.captionVotes[0].length, game.captionVotes[1].length, game.captionVotes[2].length ]
    io.to(roomId).emit('voteDataCaption', emittedData)

    //
    // }
  })

  socket.on('voteImg', ({ roomId, index }) => {
    const game = games[roomId]

    if (game && game.imgVotes[index] !== undefined) {

      for (var i = 0; i < game.imgVotes.length; i++ ){
        let index = game.imgVotes[i].indexOf(socket.id)
        if (index !== -1)  game.imgVotes[i].splice(index, 1);
      }
      game.imgVotes[index].push(socket.id);

      var emittedData = [game.imgVotes[0].length, game.imgVotes[1].length, game.imgVotes[2].length, game.imgVotes[3].length, ]
      io.to(roomId).emit('voteDataImg', emittedData)
    }
  })


  socket.on('voteCaption', ({ roomId, index }) => {
    const game = games[roomId]

    if (game && game.captionVotes[index] !== undefined) {

      for (var i = 0; i < game.captionVotes.length; i++ ){
        let index = game.captionVotes[i].indexOf(socket.id)
        if (index !== -1)  game.captionVotes[i].splice(index, 1);
      }
      game.captionVotes[index].push(socket.id);

      var emittedData = [game.captionVotes[0].length, game.captionVotes[1].length, game.captionVotes[2].length ]
      io.to(roomId).emit('voteDataCaption', emittedData)
    }
  })


  socket.on('nextRound', (roomId) => {
    const game = games[roomId]
    if (game) {
      if (game.votingRound == GAME_ROUNDS) {
        io.to(roomId).emit("endGame")
        return
      }

      game.votingRound++;



      var voteData = [game.imgVotes[0].length, game.imgVotes[1].length, game.imgVotes[2].length, game.imgVotes[3].length]
      let maxVote = Math.max(...voteData);
      let maxVoteIndex = voteData.indexOf(maxVote);
      let winningImg = game.slides[maxVoteIndex];
      if (winningImg == null) winningImg = "/";

      voteData = [game.captionVotes[0].length, game.captionVotes[1].length, game.captionVotes[2].length ]

      let maxVoteCaption = Math.max(...voteData);
      let maxVoteCaptionIndex = voteData.indexOf(maxVoteCaption);
      let winningCaption = game.captions[maxVoteCaptionIndex]

      io.to(roomId).emit('showSlide', [winningImg, winningCaption, game.votingRound, GAME_ROUNDS])
      game.usedImgs.push(winningImg)
      game.usedCaptions.push(winningCaption)

      if (game.votingRound == GAME_ROUNDS) {
        io.to(roomId).emit("noMoreSlides")
      }
      else {
        game.slides = getUnusedRandImgs(roomId)
        game.captions = getUnusedRandCaptions(roomId, game.votingRound)
        game.imgVotes = [[], [], [], []]
        game.captionVotes = [[], [], []]
        io.to(roomId).emit('slides', [game.slides, game.captions, game.votingRound])
      }



    }
  })

  socket.on('leaveRoom', ({ roomId, isHost }) => {
    const game = games[roomId]
    if (game) {
      for (var i = 0; i < game.imgVotes.length; i++ ){
        let index = game.imgVotes[i].indexOf(socket.id)
        if (index !== -1)  game.imgVotes[i].splice(index, 1);
      }

      for (var i = 0; i < game.captionVotes.length; i++ ){
        let index = game.captionVotes[i].indexOf(socket.id)
        if (index !== -1)  game.captionVotes[i].splice(index, 1);
      }

      let index = game.audience.indexOf(socket.id)
      if (index !== -1) game.audience.splice(index, 1);
      console.log(`${socket.id} left ${roomId}`)

      io.to(roomId).emit('audienceUpdate', game.audience)
    }

    if (game && isHost) {
      console.log("deleting room")
      io.to(roomId).emit('roomDeleted');
      delete games[roomId];
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
  "so...", "this is me.", "since the start", "we are here.", "you may not know this:", "unfortunately", "the reason", "the problem", "the root problem", "a new direction", "our ideal", "the plan", "why?", "how?", "who?", "when?", "the future",
]

const CAPTIONS_NOTFIRST = [
  "the solution...", "however...", "on the other hand", "the cause", "fortunately", "therefore", "hence"
]

const CAPTIONS_LAST = [
  "in a nutshell", "finally", "to conclude", "in summary", "next steps"
]

var eligibleCaptions = []

function getUnusedRandCaptions(roomId, votingRound) {

  eligibleCaptions = []

  if (votingRound == 0) {
    eligibleCaptions = CAPTIONS
  } else if (votingRound == GAME_ROUNDS - 1) {
    eligibleCaptions = [...CAPTIONS, ...CAPTIONS_NOTFIRST, ...CAPTIONS_LAST]
  } else {
    eligibleCaptions = [...CAPTIONS, ...CAPTIONS_NOTFIRST]
  }

  var randInts = []
  while (randInts.length < 3) {
    let randInt = Math.floor(Math.random() * (eligibleCaptions.length));
    if (!randInts.includes(eligibleCaptions[randInt]) && !games[roomId].usedCaptions.includes(eligibleCaptions[randInt])) {
      randInts.push(eligibleCaptions[randInt]);
    }
  }

  return randInts;
}



/*

todo next
- styling for presenter OK
- mobile optimisation
- total 8 slides per game & show that too / slide progress kinda thing OK
- reset or create new game OK
- load votes when loading page too OK

*/
