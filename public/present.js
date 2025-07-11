const socket = io()

let yourVote = null
let roomId = null


function extractRoomId() {
  const path = window.location.pathname
  return path.split('/').pop()
}

roomId = extractRoomId()

if (roomId) {
  socket.emit('joinRoom', roomId)
}

socket.on('audienceUpdate', (audience) => {
  var audienceCount = audience.length -1;
  document.getElementById('audience-count').textContent = audienceCount;
  console.log(audienceCount);
})


socket.on('slides', (slides) => {
  console.log("?")
  const container = document.getElementById('slides')
  if (!container) return
  container.innerHTML = ''
  slides.forEach((slide, i) => {
    const wrapper = document.createElement('div')
    wrapper.className = 'slide'

    const img = document.createElement('img')
    img.src = `/images/${slide.img}`
    img.width = 200
    wrapper.appendChild(img)

    if (slide.prompt) {
      const p = document.createElement('p')
      p.textContent = slide.prompt
      wrapper.appendChild(p)
    }

    const btn = document.createElement('button')
    btn.textContent = `Vote for this`
    btn.onclick = () => {
      yourVote = i
      socket.emit('vote', { roomId, index: i })
    }
    wrapper.appendChild(btn)

    container.appendChild(wrapper)
  })
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




window.addEventListener('beforeunload', () => {
  if (roomId) {
    socket.emit('leaveRoom', roomId);
  }

});



document.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowRight') {
    function nextRound() {
      if (roomId) {
        socket.emit('nextRound', roomId)
        yourVote = null
      }
    }
  }
});
