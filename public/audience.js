const socket = io()

let yourVote = null
let roomId = null


var votingRound = -1;


// ROOM CONNECTION
function extractRoomId() {
  const path = window.location.pathname
  return path.split('/').pop()
}

roomId = extractRoomId()
if (roomId) {
  socket.emit('joinRoom', roomId)
}

socket.on('audienceUpdate', (audience) => {
  var audienceCount = Math.max(audience.length -1, 0);
  var counts = document.getElementsByClassName('audience-count');
  for (var i = 0; i < counts.length; i++) {
    counts[i].textContent = audienceCount;
  }
})







// GAMEPLAY

socket.on('noMoreSlides', () => {
  document.getElementById('end').classList.add('show')
  document.getElementById("img-vote-container").innerHTML = ""
  document.getElementById('caption-vote-container').innerHTML = ""
})

socket.on('slides', (info) => {
  var slides = info[0]
  var captions = info[1]
  var recievedVotingRound = info[2]

  if (recievedVotingRound != votingRound) {
    votingRound = recievedVotingRound
  }
  else {
    return
  }
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
    votePercent.textContent = "0 votes"

    wrapper.appendChild(votePercent)

    wrapper.onclick = () => {
      yourVote = i
      socket.emit('voteImg', {roomId, index: i})

      const divs = document.getElementsByClassName('img-div');

      for (var j = 0; j < divs.length; j++) {
        const div = divs[j]
        div.classList.remove('selected')

      }

      const votedFor = document.getElementById('img-div-' + i)
      votedFor.classList.add('selected')

    }

    imgContainer.appendChild(wrapper)

  })

  captionContainer = document.getElementById("caption-vote-container")
  if (!captionContainer) return
  captionContainer.innerHTML = ""
  captions.forEach((caption, i) => {
    const wrapper = document.createElement('div')
    wrapper.classList.add('caption-div')
    wrapper.id = "caption-div-" + i

    const content = document.createElement('p')
    content.textContent = caption
    wrapper.appendChild(content)


    const votePercent = document.createElement('p')
    votePercent.classList.add('vote-percentage')
    votePercent.id = 'vote-percent-cap-' + i
    votePercent.textContent = "0 votes"

    wrapper.appendChild(votePercent)


    wrapper.onclick = () => {
      yourVote = i
      socket.emit('voteCaption', {roomId, index: i})

      const divs = document.getElementsByClassName('caption-div');

      for (var j = 0; j < divs.length; j++) {
        const div = divs[j]
        div.classList.remove('selected')

      }

      const votedFor = document.getElementById('caption-div-' + i)
      votedFor.classList.add('selected')

    }

    captionContainer.appendChild(wrapper)

  })


  // captions.forEach((caption, i) => {
  //   const p = document.createElement('p');
  //   p.textContent = caption
  //   container.appendChild(p);
  // })
})


socket.on('voteDataImg', (votes) => {
  votes.forEach((count, i) => {
    const div = document.getElementById('vote-percent-' + i)
    if (count) div.textContent = count + " votes";
    else div.textContent = "0 votes";

  })
})



socket.on('voteDataCaption', (votes) => {
  votes.forEach((count, i) => {
    const div = document.getElementById('vote-percent-cap-' + i)
    if (count) div.textContent = count + " votes";
    else div.textContent = "0 votes";

  })
})



// LEAVING
window.addEventListener('beforeunload', () => {
  if (roomId) {
    socket.emit('leaveRoom', { roomId, isHost: false });
  }

});
