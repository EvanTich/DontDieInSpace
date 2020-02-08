import { GameObject, Engine } from "../../lib/engine.js";
import { inputConfig } from "./config.js";

//*
//*
//*

// chat integration
const chatBox = document.getElementById('m');
function isChatInFocus() {
	return chatBox === document.activeElement;
}

// TODO make proper class
// world state
const world = {
	size: 2048,
	objects: {},
	rendered: 0,

	toString() { // for debugging
		// does not show object and terrain data because it's awful
		return `World{size: ${this.size}, total: ${Object.keys(this.objects).length}, rendered: ${this.rendered}}`;
	}
};

// fps stuff
const fpsDiv = $("#fps")[0];
// end fps

var debugMode = false;
const debugDiv = $("#debug")[0];
var renderedObjects = 0;

var game;
var objId;

// itty bitty init-y committee (that does nothing)
function init() {
	
}

// UPDATING ---------

function keys(dt) {
	if(isChatInFocus())
		return;

	// send a server update for movement
	game.emit('state keys', ih.state);

	// client side state changes
	if(ih.state.debug) {
		debugMode = !debugMode;
		if(debugMode) {
			debugDiv.style.display = "block";
		} else {
			debugDiv.style.display = "none";
		}
	}
	
	if(ih.state.chat) {
		$("#m").focus();
	}

	ih.update();
}

function update(dt) {
    // stuff

	keys(dt);
}

// UPDATING DONE
// DRAWING --------

function debug() {
	debugDiv.innerHTML = ch + "<br/>" + ih + "<br/>" + world + "<br/>" + JSON.stringify(world.objects);
}

function draw(g) {
	renderedObjects = 0;
	g.fillStyle = 'black';
	g.fillRect(0, 0, ch.canvas.width, ch.canvas.height); 

	drawTerrain(g);
	
	g.fillStyle = 'white';
	for(let objKey in world.objects) {
		var obj = world.objects[objKey];
		if(obj.draw(g, ch)) 
			renderedObjects++;
	}
	
	fpsDiv.textContent = Math.round(engine.fps) + ' fps';
	if(debugMode) {
		debug();
	}

	world.rendered = renderedObjects;
}

// DRAWING DONE

const engine = new Engine(init, update, draw, inputConfig);
const ch = engine.ch;
const ih = engine.ih;

$( () => {
	if(typeof io === 'undefined') {
		alert('Socket IO not found on the server. Something is wrong!');
		return;
	}

	//var id = 5000;
	ch.setClickHandler( e => {
		e.preventDefault();
		// change x, y to world coordinates from screen coords
		let pos = ch.getMouseTilePos();
		let type = -1; // TODO: add chooser

		console.log(pos);
		//world.objects[id++] = new GameObject(pos.x * 16, pos.y * 16, type);
		game.emit('create object', new GameObject(pos.x, pos.y, type));
	});

	ch.setRightClickHandler( e => {
		e.preventDefault();

		let pos = ch.getMouseWorldPos();

		let id = -1;
		for(let objId in world.objects) {
			let obj = world.objects[objId];
			if(pos.x > obj.x - obj.w / 2  && pos.x < obj.x + obj.w / 2 &&
				pos.y > obj.y - obj.h / 2 && pos.y < obj.y + obj.h / 2) {
				id = objId;
			}
		}

		if(id != -1) {
			game.emit('delete object', { id });
		}
	});

	game = io.connect('/game');

	game.on('object id', d => {
		objId = d.id;
		// now we can follow the player
		console.log(world.objects[objId]);
		// FIXME: not following the player for some reason
		ch.followObj(world.objects[objId]);
	});

	game.on('objects initial', initialized => {
		// add the new stuff
		for(let id in initialized) {
			world.objects[id] = GameObject.from(initialized[id]);
		}
	});

	game.on('objects updated', updated => {
		// update the other stuff
		for(let id in updated) {
			world.objects[id].updateFrom(updated[id]);
		}
	});

	game.on('objects removed', removed => {
		// remove the removed stuff
		for(let id of removed) {
			delete world.objects[id];
		}
	});

	game.on('setup', worldData => {
		world.size = worldData.size;
		world.terrain = worldData.terrain;
		for(let id in worldData.objects) {
			world.objects[id] = GameObject.from(worldData.objects[id]);
		}

		if(typeof objId !== 'undefined') {
			console.log("setup follow");
			console.log(world.objects[objId]);
			ch.followObj(world.objects[objId]);
		}
	});


	engine.start();
});
