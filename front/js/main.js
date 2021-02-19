let lobbyId = ''
let myPlayer = ''
 
$( `#createLobbyButton` ).click(function(el) {
  let username = $( "#username" ).val()
  if (username){
    let socketId = socket.id
    $.post( "/api/lobby", { "username": username, "socketId": socketId} )
    .then(function(response) {
      $( `#lobbyId` ).val(`${response}`);
      $( `#lobbyId` ).select();
      document.execCommand( 'copy' );
      $( `#lobby` ).html(`Lobby created and id copied to your clipboard<br>
                        Send it to your opponent and wait for him to join`);
      $( `#game` ).addClass('d-none')
    })
  } else {
    alert('Please enter your username')
  }
  
})


$( `#joinLobbyButton` ).click(function(el) {
  let id = $( "#lobbyId" ).val()
  let username = $( "#username" ).val()
  let socketId = socket.id
  fetch(`/api/lobby/${id}/${username}/${socketId}`)
  .then(response => response.json())
  .then(response => console.log(response))
  .catch(error => alert("Erreur : " + error));
})

$( `#pierre` ).click(function(el) {
  socket.emit('turn choice', {"choice": 'pierre', "id": lobbyId})
})
$( `#feuille` ).click(function(el) {
  socket.emit('turn choice', {"choice": 'feuille', "id": lobbyId})
})
$( `#ciseaux` ).click(function(el) {
  socket.emit('turn choice', {"choice": 'ciseaux', "id": lobbyId})
})


//Action on new message received
socket.on('game started', function(game) {
  if (game.p1socketId == socket.id){
    myPlayer = 'p1'
  } else if (game.p2socketId == socket.id){
    myPlayer = 'p2'
  } else {
    //Error
  }
  lobbyId = game._id
  $( `#lobby` ).html(`Current lobby : ${lobbyId}<br>
                      ${game.player1} VS ${game.player2}`);
  p1Score = 0
  p2Score = 0
  $( `#game` ).removeClass('d-none')
  $( `#options` ).removeClass('show')
});

socket.on('choice ok', function(choice) {
  $( `#gameResult` ).html('OK wait for your opponent')
});

function updateScoreBoard(lobbyData){
  if (!lobbyData.p1Score) {
    lobbyData.p1Score = 0
  }
  if (!lobbyData.p2Score) {
    lobbyData.p2Score = 0
  }
  if (myPlayer == 'p1') {
    $( `#gameScoreBoard` ).html(`<table class='table text-center'><thead><tr><th scope="col">${lobbyData.player1}</th><th scope="col">${lobbyData.player2}</th></tr></thead>
                                <tbody><tr><td>${lobbyData.p1Score}</td><td>${lobbyData.p2Score}</td></tr></tbody></table>`)
  } else {
    $( `#gameScoreBoard` ).html(`<table class='table text-center'><thead><tr><th scope="col">${lobbyData.player1}</th><th scope="col">${lobbyData.player2}</th></tr></thead>
                                <tbody><tr><td>${lobbyData.p1Score}</td><td>${lobbyData.p2Score}</td></tr></tbody></table>`)                          
  }
}

socket.on('turn done', function(lobbyData) {
  if (myPlayer == 'p1'){
    $( `#gameResult` ).html(`Your choice : ${lobbyData.p1Choice}
                          <br>Opponent choice : ${lobbyData.p2Choice}`)
  } else if (myPlayer == 'p2'){
    $( `#gameResult` ).html(`Your choice : ${lobbyData.p2Choice}
                          <br>Opponent choice : ${lobbyData.p1Choice}`)
  } else {
    //Error
  }
  if (lobbyData.winner){
    if (lobbyData.winner == myPlayer){
      $( `#gameResult` ).append(`<br>You won !`);
    } else if (lobbyData.winner == 'none') {
      $( `#gameResult` ).append(`<br>Nobody won !`);
    } else {
      console.log(lobbyData.winner)
      $( `#gameResult` ).append(`<br>You loose !`);
    }
    updateScoreBoard(lobbyData)
  }
  $( `#gameResult` ).append(`<br>You can play again if you want`);
});

//username save and load functions
$( "#saveUsername" ).click(function(event) {
  let username = $( "#username" ).val()
  document.cookie = `username=${username}`;
  event.preventDefault();
})

$( document ).ready(function() {
  let username = getCookie("username");
  $( "#username" ).val(username);
});

function getCookie(cname) {
  var name = cname + "=";
  var ca = document.cookie.split(';');
  for(var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}