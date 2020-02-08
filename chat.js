//*
//* This file handles all the server-side action for the chat.
//* Probably not the best implemented solution, but it works for me. :)
//*

const DEBUG = false;

function Message(
	from, // sender of message
	to, // receiver of message
	msg, // message to send
	alert = false, // is this an alert?
	pri = true, // private message?
	self = true // sent to self? (command)
	) {
	return { from, to, msg, alert, 'private': pri, self };
}

class Command {

	//aliases; // string[]
	//description; // string
	//exec; // function
	//usage; // string

	constructor(
		aliases, 
		description, 
		exec, 
		usage = '/' + aliases[0]
		) {
		this.aliases = aliases;
		this.description = description;
		this.exec = exec;
		this.usage = usage;
	}
}

function listUsers(info) {
	let str = '';
	for(let obj in info) {
		str += info[obj].tag + ', ';
	}

	return str.substring(0, str.length - 2);
}

function motd(info) {
	return `Current Users >> ${listUsers(info)} <<`;
}

// are you ready for throw up code?
const COMMANDS = [
	new Command(
		['msg', 'tell', 'whisper'], 
		'Allows private messaging from person to person.', 
		(m, user) => {
			let [ , id, ...msg ] = m.split(' ');
			return Message(user.tag, id, msg.join(' '), false, true, false);
		}, '/msg <recipiant id> <message>'
	), new Command(
		['list', 'users', 'players'], 
		'Lists all connected users.', 
		(m, user, info) => {
			return Message('SERVER', user.tag, `>> ${listUsers(info)} <<`);
		}
	), new Command(
		['help', 'h'], 
		'Helps YOU with the commands you need help with.', 
		(m, user) => {
			let msg = 'Help: <br>'; // TODO: new line in chat
			for(let command of COMMANDS) {
				msg += command.aliases.join(', ') + ': ' + command.description + ' Usage: ' + command.usage + '<br>';
			}
		
			return Message('SERVER', user.tag, msg);
		}
	)//, new Command(
		// ['nickname', 'nick'], 
		// 'Allows you to have an \'actual\' name.', 
		// (m, user) => {
			// let [ , ...nickname] = m.split(' ');
			// if(nickname) {
				// let nick = nickname.join(' ');
				// user.nickname = nick;
				// user.object.tag = user.tag;
				
				// return Message('SERVER', 'all', `User #${user.chatId} set their nickname to ${nick}.`, false, false, false);
			// }
			// return Message('SERVER', user.tag, 'Nickname command requires an argument.');
		// }, '/nickname <nickname>'
	// )
];

function doCommand(m, user, info) {
	let i = m.indexOf(' ');
	let com = m.substring(0, i == -1 ? m.length : i);
	for(let command of COMMANDS) {
		if(command.aliases.includes(com)) {
			return command.exec(m, user, info);
		}
	}
	
	return Message('SERVER', user.tag, `Failed to run "/${com}" command. It looks like it doesn't exist.`, true);
}

var lastId = 0;
var users = {};

function setupUser(socket, info) {
	let userId = lastId++;
	users[userId] = socket;

	let user = info[socket.conn.id];
	user.chatId = userId;
	return user;
}

var chat;
exports.setup = function(io, info) {
	return chat = io.of('/chat').on('connection', socket => {
		let user = setupUser(socket, info);

		if(DEBUG) console.log(`user #${user.tag} and id ${socket.id} connected`);
		
		chat.emit('message', Message('SERVER', 'all', `User #${user.tag} connected.`, false, false, false));
		socket.emit('message', Message('MOTD', user.tag, motd(info)));

		socket.on('message', m => {
			// verify data packet
			if(typeof m !== 'string' || m.length > 300) {
				console.log(`user #${user.tag} is sending unusual data for messages.`);
				return;
			}
			
			let data;
			if(m.charAt(0) == '/') {
				data = doCommand(m.substring(1), info[socket.conn.id], info);
			} else {
				data = Message(info[socket.conn.id].tag, 'all', m, false, false, false);
			}
			
			if(DEBUG) console.log(data);  
			
			if(data.alert) {
				socket.emit('alert', data);
			} else if(data.self) {
				socket.emit('command message', data);
			} else if(data['private']) { // if private message
				if(data.to in users) {
					// if other person exists, send the message to both sender and receiver
					users[data.to].emit('private message', data);
					socket.emit('private message', data);
				} else {
					// tell user that message failed to send
					socket.emit('alert', Message('SERVER', user.tag, 'Message failed to send. Use the number.', true));
				}
			} else {
				chat.emit('message', data);
			}
		});
		
		socket.on('get id', () => {
			socket.emit('send id', { id: user.chatId });
		});
		
		socket.on('disconnect', reason => {
			if(DEBUG) console.log(`user #${user.tag} and id ${socket.id} deleted`);

			chat.emit('user disconnect', { tag: user.tag });
			delete users[user.chatId];
		});
	});
}