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
  var audienceCount = audience.length;
  console.log("audienceUpdate recieved")
  console.log(audienceCount);
})


socket.on('slides', (info) => {
  var slides = info[0]
  var captions = info[1]
  console.log('recieve slides')

  const imgContainer = document.getElementById('img-vote-container')
  if (!imgContainer) return
  imgContainer.innerHTML = ''

  slides.forEach((slide, i) => {
    const wrapper = document.createElement('div')
    wrapper.classList.add('img-div')
    wrapper.id = "img-div-" + i

    const img = document.createElement('img')
    img.src = slide
    wrapper.appendChild(img)


    const votePercent = document.createElement('p')
    votePercent.classList.add('vote-percentage')
    votePercent.id = 'vote-percent-' + i
    votePercent.textContent = "0% (0 votes)"

    wrapper.appendChild(votePercent)

    wrapper.onclick = () => {
      yourVote = i
      socket.emit('vote', {roomId, index: i})

      const divs = document.getElementsByClassName('img-div');

      for (var j = 0; j < divs.length; j++) {
        const div = divs[j]
        div.classList.remove('selected')

      }
      // divs.forEach((div, j) => {

      const votedFor = document.getElementById('img-div-' + i)
      votedFor.classList.add('selected')

    }

    imgContainer.appendChild(wrapper)

  })


  // captions.forEach((caption, i) => {
  //   const p = document.createElement('p');
  //   p.textContent = caption
  //   container.appendChild(p);
  // })
})


socket.on('voteData', (votes) => {
  console.log("voteData recieved")
  const container = document.getElementById('voteResults')
  if (!container) return

  container.innerHTML = ''
  votes.forEach((count, i) => {
    const div = document.getElementById('vote-percent-' + i)
    div.textContent = count + " votes"
    // const div = document.createElement('div')
    // div.textContent = `Slide ${i + 1}: ${count} vote(s)`
    // if (yourVote === i) {
    //   div.style.fontWeight = 'bold'
    //   div.style.color = 'green'
    // }
    // container.appendChild(div)
  })
})



window.addEventListener('beforeunload', () => {
  if (roomId) {
    socket.emit('leaveRoom', roomId);
  }

});
