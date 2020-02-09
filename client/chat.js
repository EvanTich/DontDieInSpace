//*
//* This class handles all chat related functionality for the user.
//* It can be modified to one's content, hopefully.
//* For any questions, please ask: evan.tichenor@gmail.com
//*

const mes = $('#messages');
const mBox = $('#m');

var prevIndex = 0;
var prevMessages = [];

var userId;

function appendMessage(type, data) {
	if(type == 'none') {
		mes.append($('<li>')
			.text(`${data.from}: ${data.msg}`));
	} else {
		mes.append($('<li>', { 'class': type })
			.text(`${data.from} to ${data.to}: ${data.msg}`));
	}
	
	mes[0].scrollTop = mes[0].scrollHeight;
}

function moveCursor(dom) {
	dom.scrollLeft = dom.scrollWidth;
	dom.setSelectionRange(dom.value.length, dom.value.length);
}

function chatKeyDown(e) {
	if(e.keyCode == 38) { // up arrow
		e.preventDefault();
		if(--prevIndex < 0) {
			prevIndex = 0;
		}
		
		mBox.val(prevMessages[prevIndex]);
		moveCursor(mBox[0]);
	} else if(e.keyCode == 40) { // down arrow
		e.preventDefault();
		if(++prevIndex >= prevMessages.length) {
			prevIndex = prevMessages.length;
			mBox.val('');
		} else {
			mBox.val(prevMessages[prevIndex]);
			moveCursor(mBox[0]);
		}
	} else if(e.keyCode == 27) { // ESC key
		mBox.blur();
	}
}

$(() => {
	if(typeof io === 'undefined') {
		alert('Socket IO not found on the server. Something is wrong!');
		return;
	}

	var chat = io.connect('/chat');
	
	// get user id before anything else
	chat.on('send id', d => {
		userId = d.id;
		// put on screen, too
		$('#userId').text(userId);
	});
	chat.emit('get id');
	// cool, we'll get the id soon; on to more important stuff
	
	mBox.keydown(chatKeyDown);
    $('#chat_form form').submit( e => {
		e.preventDefault();
		let m = mBox.val();
		
		// all message handling is done on the server
		// no fuckery allowed, and please no strings with >300 characters :)
		chat.emit('message', m);
		
		prevIndex = prevMessages.push(m);
		mBox.val('');
		mBox.blur();
		return false;
    });
    chat.on('message', d => {
		appendMessage('none', d);
    });
	chat.on('private message', d => {
		appendMessage('privateMessage', d);
	});
	chat.on('alert', d => {
		appendMessage('alertMessage', d);
	});
	chat.on('command message', d => {
		appendMessage('commandMessage', d);
	});

	chat.on('user disconnect', d => {
		mes.append($('<li>')
			.text(`User #${d.tag} disconnected.`));
	});
	
});