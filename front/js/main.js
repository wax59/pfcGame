  // Extend jquery for PUT and DELETE
  jQuery.each( [ "put", "delete" ], function( i, method ) {
    jQuery[ method ] = function( url, data, callback, type ) {
      if ( jQuery.isFunction( data ) ) {
        type = type || callback;
        callback = data;
        data = undefined;
      }
  
      return jQuery.ajax({
        url: url,
        type: method,
        dataType: type,
        data: data,
        success: callback
      });
    };
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

let lobbyId = '';

$( `#createLobbyButton` ).click(function(el) {
  let username = $( "#username" ).val()
  let socketId = socket.id
  $.post( "/api/lobby", { "username": username, "socketId": socketId} )
  .then(function(response) {
    //$( `#lobby` ).html(`Lobby created : ${response}`);
    $( `#lobbyId` ).val(`${response}`);
    $( `#lobbyId` ).select();
    document.execCommand( 'copy' );
  })
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
  socket.emit('game choice', {"choice": 'pierre', "id": lobbyId})
})

$( `#feuille` ).click(function(el) {
  socket.emit('game choice', {"choice": 'feuille', "id": lobbyId})
})
$( `#ciseaux` ).click(function(el) {
  socket.emit('game choice', {"choice": 'ciseaux', "id": lobbyId})
})

let myPlayer = ''
let myScore = 0
let opponentScore = 0
//Action on new message received
socket.on('game started', function(game) {
  console.log('game started')
  lobbyId = game._id
  $( `#lobby` ).html(`Current lobby : ${lobbyId}`);
  console.log(game)
  p1Score = 0
  p2Score = 0
  $( `#game` ).removeClass('d-none')
  $( `#options` ).removeClass('show')
});

socket.on('choice ok', function(choice) {
  console.log('choice ok')
  console.log(choice)
  $( `#gameResult` ).html('OK wait')
});

function updateScoreBoard(lobbyData){
  if (myPlayer == 'p1') {
    $( `#gameScoreBoard` ).html(`<table class='table text-center'><thead><tr><th scope="col">${lobbyData.player1}</th><th scope="col">${lobbyData.player2}</th></tr></thead>
                                <tbody><tr><td>${myScore}</td><td>${opponentScore}</td></tr></tbody></table>`)
  } else {
    $( `#gameScoreBoard` ).html(`<table class='table text-center'><thead><tr><th scope="col">${lobbyData.player1}</th><th scope="col">${lobbyData.player2}</th></tr></thead>
                                <tbody><tr><td>${opponentScore}</td><td>${myScore}</td></tr></tbody></table>`)                          
  }
}

socket.on('turn done', function(lobbyData) {
  console.log('turn done')
  console.log(lobbyData)

  if (lobbyData.p1socketId == socket.id){
    myPlayer = 'p1'
    $( `#gameResult` ).html(`Your choice : ${lobbyData.p1Choice}
                          <br>Opponent choice : ${lobbyData.p2Choice}`)
  } else if (lobbyData.p2socketId == socket.id){
    myPlayer = 'p2'
    $( `#gameResult` ).html(`Your choice : ${lobbyData.p2Choice}
                          <br>Opponent choice : ${lobbyData.p1Choice}`)
  } else {
    //Error
  }
  if (lobbyData.winner){
    if (lobbyData.winner == myPlayer){
      $( `#gameResult` ).append(`<br>You won !`);
      myScore++
    } else if (lobbyData.winner == 'none') {
      $( `#gameResult` ).append(`<br>Nobody won !`);
    } else {
      $( `#gameResult` ).append(`<br>You loose`);
      opponentScore++
    }
    updateScoreBoard(lobbyData)
  }
  $( `#gameResult` ).append(`<br>You can play again if you want`);
});

//DAS save and load functions
$( "#saveUsername" ).click(function(event) {
  let username = $( "#username" ).val()
  document.cookie = `username=${username}`;
  event.preventDefault();
})

$( document ).ready(function() {
  let username = getCookie("username");
  $( "#username" ).val(username);
});