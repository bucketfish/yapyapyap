const socket = io()

let yourVote = null
let roomId = null

var showInstructions = true

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
  const container = document.getElementById('showImg')
  if (!container) return
  container.innerHTML = ''

  const img = document.createElement('img')
  img.src = winningImg
  img.width = 200
  container.appendChild(img)

  const caption = document.getElementById('showCaption');
  caption.textContent = winningCaption;

  console.log(winningCaption)

})


socket.on('voteData', (votes) => {
  const container = document.getElementById('voteResults')
  if (!container) return

  container.innerHTML = ''
  votes.forEach((count, i) => {
    const div = document.createElement('div')
    div.textContent = `Slide ${i + 1}: ${count} vote(s)`
    if (yourVote === i) {
      div.style.fontWeight = 'bold'
      div.style.color = 'green'
    }
    container.appendChild(div)
  })
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


function hideInstructions() {
  const instructions = document.getElementById('instructions');
  instructions.classList.add("display-none")
}

// CLIENT SIDE
document.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowRight') {
    nextRound()
  }
});

// LEAVING
window.addEventListener('beforeunload', () => {
  if (roomId) {
    socket.emit('leaveRoom', { roomId, isHost: true });
  }

});
