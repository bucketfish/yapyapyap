const socket = io()

let yourVote = null
let roomId = null

var showInstructions = true

var currentRound = 0

// ROOM STUFF
function extractRoomId() {
  const path = window.location.pathname
  return path.split('/').pop()
}

roomId = extractRoomId()

if (roomId) {
  socket.emit('joinRoom', roomId)
}




// INFORMATION
socket.on('audienceUpdate', (audience) => {
  var audienceCount = Math.max(audience.length -1, 0);
  var counts = document.getElementsByClassName('audience-count');
  for (var i = 0; i < counts.length; i++) {
    counts[i].textContent = audienceCount;
  }
})





// GAMEPLAY
socket.on('showSlide', (winning) => {
  var winningImg = winning[0]
  var winningCaption = winning[1]
  var gameRound = winning[2]
  var totalRounds = winning[3]

  const container = document.getElementById('showImg')
  if (!container) return
  container.innerHTML = ''

  const img = document.createElement('img')
  img.src = winningImg
  container.appendChild(img)

  const caption = document.getElementById('showCaption');
  caption.textContent = winningCaption;

  const showProgress = document.getElementById('showProgress')
  showProgress.textContent = "slide " + gameRound + " of 5";
  currentRound = gameRound;

})



function nextRound() {
  console.log("next round")
  if (showInstructions) {
    showInstructions = false
    hideInstructions()
  }
  if (roomId) {
    socket.emit('nextRound', roomId)
    yourVote = null
  }
}

function endGame() {
  document.getElementById('end').classList.add('show');
  document.getElementById('show').classList.add('display-none');

}


function hideInstructions() {
  const instructions = document.getElementById('instructions');
  instructions.classList.add("display-none")
}

// CLIENT SIDE
document.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowRight') {

    if (currentRound == 5) {
      endGame()
    }
    else {
      nextRound()
    }

  }
});

// LEAVING
window.addEventListener('beforeunload', () => {
  if (roomId) {
    socket.emit('leaveRoom', { roomId, isHost: true });
  }

});
