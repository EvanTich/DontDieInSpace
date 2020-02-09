import { GameObject, Engine } from "./engine.js";
import { inputConfig } from "./config.js";

//*
//*
//*

// chat integration
const chatBox = document.getElementById('m');
function isChatInFocus() {
	return chatBox === document.activeElement;
}

// world state
let world = {
	size: 2048,
    objects: {},
    static_objects: [],
	rendered: 0,

	toString() { // for debugging
		// does not show object and terrain data because it's awful
		return `World{size: ${this.size}, total: ${Object.keys(this.objects).length}, rendered: ${this.rendered}}`;
	}
};

// fps stuff
const fpsDiv = $("#fps")[0];
// end fps

const nicknameInput = $('#nickname')[0];

var debugMode = false;
const debugDiv = $("#debug")[0];
var renderedObjects = 0;

var chatDisabled = true;

var game;
var objId;

function init() {
    $('#splash_form').submit( e => {
        e.preventDefault();
        game.emit('ready', nicknameInput.value);
        return false;
    });
}

// UPDATING ---------

function keys(dt) {
	if(isChatInFocus())
		return;

	// send a server update for movement
	game.emit('key state', ih.state);

	// client side state changes
	if(ih.state.debug) {
		debugMode = !debugMode;
		if(debugMode) {
			debugDiv.style.display = "block";
		} else {
			debugDiv.style.display = "none";
		}
    }
    
	if(ih.state.chat && chatDisabled) {
		$("#m").focus();
	}

	ih.update();
}

function update(dt) {
    // stuff
    // for(let id in world.objects) {
    //     world.objects[id].r += 100 * dt;
    // }

	keys(dt);
}

// UPDATING DONE
// DRAWING --------

function debug() {
	debugDiv.innerHTML = ch + "<br/>" + ih + "<br/>" + world + "<br/>" + JSON.stringify(world.objects);
}

function drawStaticObjects(g) {
    for(let obj of world.static_objects) {
        if(obj.draw(g, ch))
            renderedObjects++;
    }

    for(let i = -10; i <= 10; i++) {
        let x = (i * world.size / 10 - ch.cx) * ch.cz,
            y = (i * world.size / 10 - ch.cy) * ch.cz;
        g.strokeStyle = 'gray';
        g.beginPath();
        if(x >= 0 && x < ch.canvas.width) {
            g.moveTo(x, 0);
            g.lineTo(x, ch.canvas.height);
        }
        if(y >= 0 && y < ch.canvas.height) {
            g.moveTo(0, y);
            g.lineTo(ch.canvas.width, y);
        }
        g.stroke();
    }
}

function draw(g) {
	renderedObjects = 0;
	g.fillStyle = 'black';
	g.fillRect(0, 0, ch.canvas.width, ch.canvas.height); 

	drawStaticObjects(g);
	
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

	game = io.connect('/game');

	game.on('ready', id => {
        objId = id;

        // now we can follow the player
        if(typeof world.objects[objId] !== undefined)
            ch.followObj(world.objects[objId]);
        $('#splash')[0].style.display = 'none';
        chatDisabled = false;
	});

	game.on('objects initial', initialized => {
		// add the new stuff
		for(let id in initialized) {
            world.objects[id] = GameObject.from(initialized[id]);
            if(id == objId)
                ch.followObj(world.objects[objId]);
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
        
		for(let obj of worldData.static_objects) {
			world.static_objects.push(GameObject.from(obj));
        }
        
		for(let id in worldData.objects) {
			world.objects[id] = GameObject.from(worldData.objects[id]);
		}

		if(typeof objId !== 'undefined') {
			ch.followObj(world.objects[objId]);
		}
    });

    game.on('death', () => {

    });
    
    game.on('leaderboard', leaderboard => {

    });


	engine.start();
});
