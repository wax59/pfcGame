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
/*

socket.on('deleted message', function(msg) {
console.log('SocketIO : deleted message')
msg = JSON.parse(msg)
deleteMessage(msg.id)
});

socket.on('updated message', function(msg) {
$( `#${msg._id}.messageMessage` ).html(msg.message);
updateTitle(msg)
fetch('/posts')
.then(response => response.json())
.then(response => posts = response)
})


function displayNewMessage(message){
  console.log(posts)
  let elem = document.createElement('div');
        elem.id = message._id
        elem.innerHTML =    `<li class="list-group-item mb-1">
                              <div>
                                <span class="fs-5 messageTitle" id="${message._id}"> </span>
                                <button class="btn btn-primary btn-sm float-start me-3" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${message._id}">&#10149;</button>
                                <button class="btn btn-danger btn-sm deleteButton float-end" id="${message._id}">Delete</button>
                                <button class="btn btn-secondary btn-sm editButton float-end" id="${message._id}">Edit</button>
                             </div>
                             <div class="collapse show collapse-message border-top border-1 mt-1" id="collapse${message._id}">
                              <div class="messageMessage" id="${message._id}"></div>
                             </div>
                             </li>`;
        document.getElementById('posts').appendChild(elem);
        addDeleteButtonLogic(message._id);
        addEditButtonLogic(message._id);
        updateTitle(message)
        updateMessage(message)
}

function updateMessage(message){
  if (message.lastModifyDate) {
    $( `#${message._id}.messageMessage` ).html(`${message.message} `);
    //Need to replace the message in the post array
  } else {
    $( `#${message._id}.messageMessage` ).html(`(${message.createdAt.substring(16, 21)} | ${message.creator}) : ${message.message}`);
  }
}

function updateTitle(message){
  let diff = 0;
  //If modified
  if(message.lastModifyDate){
    modify = new Date(message.lastModifyDate);
    diff = Math.floor((new Date() - modify) / 1000 / 60);
    if (diff > 59){
      min = diff % 60;
      hour = Math.floor(diff / 60);
      $( `#${message._id}.messageTitle` ).html(`${message.title} <span class="fst-italic fs-6">- modified ${hour}h${min}min ago</span>`);
    } else {
      $( `#${message._id}.messageTitle` ).html(`${message.title} <span class="fst-italic fs-6">- modified ${diff}min ago</span>`);
    }
  } else {
    //If created
    diff = Math.floor((new Date() - new Date(message.createdAt)) / 1000 / 60);
    if (diff > 59){
      min = diff % 60;
      hour = Math.floor(diff / 60);
      $( `#${message._id}.messageTitle` ).html(`${message.title} <span class="fst-italic fs-6">- created ${hour}h${min}min ago</span>`);
    } else {
      $( `#${message._id}.messageTitle` ).html(`${message.title} <span class="fst-italic fs-6">- created ${diff}min ago</span>`);
    }
  }
}

function addDeleteButtonLogic(id){
  $( `#${id}.deleteButton` ).click(function(el) {
    $.delete( `/posts/${id}`);
  });
}

function deleteMessage(id) {
  document.getElementById(id).remove()
}

function addEditButtonLogic(id){
    $( `#${id}.editButton` ).click(function(el) {
    let das = $( "#das" ).val()
    let date = new Date().toString();
    if ( $( `#collapse${id}` ).hasClass('show') != true){
      $( `#collapse${id}` ).addClass("show");
    }
    let divHtml = $(`#${id}.messageMessage`).html().replace(/<br>/g, '\n');
    let nbLines = 0;
    if(divHtml.match(/\n/g)) {
      nbLines = divHtml.match(/\n/g).length; 
    }
    let editableText = $(`<textarea class="form-control messageMessage" id="${id}" rows="${nbLines + 3}" />`);
    editableText.val(divHtml);
    $(`#${id}.messageMessage`).replaceWith(editableText);
    $(`#${id}.messageMessage`)[0].value += `\n(${date.substring(16, 21)} | ${das}) : `
    editableText.focus();
    editableText.blur(updateEditedMessage);
  });
}

function updateEditedMessage(){
  let id = $(this)[0].id
  let text = $(this).val().replace(/\n/g, "<br />");
  let das = $( "#das" ).val()
  $.put( `/posts/${id}`, { "lastModifiedBy": das, "lastModifyDate": Date(), "message": text});
  let divText = $(`<div class="messageMessage" id="${id}">`);
  divText.html(text);
  $(this).replaceWith(divText);
}

//INIT
fetch('/posts')
.then(response => response.json())
.then(response => posts = response)
.then(() => {
    posts.forEach(element => displayNewMessage(element));
})
.catch(error => alert("Erreur : " + error));

//POST new message
$( "#submitButton" ).click(function(event) {
    event.preventDefault();
    let creator = $( "#das" ).val()
    let title = $( "#newTitle" ).val()
    let message = $( "#newMessage" ).val()
    if(creator && title && message){
      $.post( "/posts", { "creator": creator, "title": title, "message": message} );
    } else {
      alert('Please enter all required fields');
    }
    $( "#addForm" ).removeClass('show')
});




//DAS save and load functions
$( "#saveDas" ).click(function(event) {
  let das = $( "#das" ).val()
  document.cookie = `das=${das}`;
  event.preventDefault();
})

$( document ).ready(function() {
  let das = getCookie("das");
  $( "#das" ).val(das);
});

//Auto Update Title every minute
setInterval(function() {
  posts.forEach(message => updateTitle(message))
}, 60 * 1000); */