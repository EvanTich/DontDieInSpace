//*
//* This file includes all of the "engine" components for the game.
//* The parts under the hood.
//*

// {x offset, y offset, width, height}
// probably should be an array but who cares
const typeMap = {
	// id: {img: image path, r: radius of hitbox from the center}
	'-1': {img_src: '', r: 0}, // NOTHING
    1: {img_src: 'client/imgs/star.png', r: 0}, // STAR
    2: {img_src: 'client/imgs/ship.png', r: 6}, // PLAYER
    3: {img_src: 'client/imgs/laser.png', r: 2}, // PROJECTILE
    4: {img_src: 'client/imgs/rock1.png', r: 10} // ASTEROID
}

for(let i in typeMap) {
    typeMap[i].img = new Image();
    typeMap[i].img.src = typeMap[i].img_src;
}

// Be sure to copy to engine.node.js
export class Pos {

	// x;
	// y;

	constructor(x = 0, y = 0) {
		this.x = x;
		this.y = y;
	}

	toString() {
		return `(${Math.round(this.x)}, ${Math.round(this.y)})`;
	}
}

// Be sure to copy to engine.node.js
export class GameObject {

	// pos; // Pos {x, y}
	// type;
	// _r;
	// flipped;

	constructor(x, y, type, r = 0, tag = '') {
		this.pos = new Pos(x, y); // center
		this.type = type;
		this._r = r; // degrees
		// this.flipped = false;
		if(tag) {
			this.tag = tag;
		}
	}

	static from(obj) {
		// console.log(obj);
		return new GameObject(obj.pos.x, obj.pos.y, obj.type, obj._r, obj.tag);
	}

	updateFrom(obj) {
		this.pos.x = obj.pos.x;
		this.pos.y = obj.pos.y;
		this.type = obj.type;
		this._r = obj._r; // degrees
		if(obj.tag) {
			this.tag = obj.tag;
		}
	}

	get x() {
		return this.pos.x;
	}

	set x(val) {
		this.pos.x = val;
	}

	get y() {
		return this.pos.y;
	}

	set y(val) {
		this.pos.y = val;
	}
	
	get w() {
		return 10;
	}
	
	get h() {
		return 10;
	}
	
	get r() { return this._r; }
	set r(value) { this._r = value % 360; }

	draw(g, state) {
		let w = this.w * state.cz;
		let h = this.h * state.cz;
		// if not within screen area, dont draw
		if(Math.abs(this.x - state.x) > state.cs / 2 + w || Math.abs(this.y - state.y) > state.cs / 2 + h)
			return false;
		
		g.save();
		g.translate((this.x - state.cx) * state.cz, (this.y - state.cy) * state.cz);
		g.rotate(this.r * Math.PI / 180);
		if(this.type == -1) {
			g.fillRect(-w / 2, -h / 2, w, h);
		} else {
			let t = typeMap[1];
			g.drawImage(t.img, 
				Math.round(-w / 2), Math.round(-h / 2), w, h
			);
		}

		if(this.tag) {
			g.fillStyle = 'white';
			g.fillText(this.tag, -w / 2, -h / 2 - 2);
		}
		
		g.restore();
		return true;
	}
	
	toString() { // for debugging
		return `GameObject{pos: ${this.pos.toString()}, r: ${Math.round(this.r)}, type: ${this.type}}`;
	}
}

export class InputHandler {

	// _actions;
	// _once;
	// _toggle;
	// state; // map<string, boolean>

	constructor(config) {
		this._actions = {};
		this._once = [];
		this._toggle = [];

		this.state = {};
		
		for(let key in config.keyMap) {
			this._actions[key] = config.keyMap[key];
			this.state[config.keyMap[key]] = false;
		}

		for(let action of config.once) {
			this._once.push(action);
		}

		for(let action of config.toggle) {
			this.state[action + '_raw'] = false;
			this._toggle.push(action);
		}

		// put in => functions because 'this' doesn't work otherwise
		window.addEventListener("keydown", e => this._keydown(e), false);
		window.addEventListener("keyup", e => this._keyup(e), false);
	}

	// TODO
	_keydown(e) {
		var key = this._actions[e.keyCode] || this._actions["default"];
		if(this._toggle.includes(key) && !this.state[key + '_raw']) {
			this.state[key + '_raw'] = true;
			this.state[key] = !this.state[key];
		} else {
			this.state[key] = true;
		}
	}
	
	_keyup(e) {
		var key = this._actions[e.keyCode] || this._actions["default"];

		if(this._toggle.includes(key)) {
			this.state[key + '_raw'] = false;
		} else {
			this.state[key] = false;
		}
	}

	update() {
		for(let action of this._once) {
			if(this.state[action])
				this.state[action] = false;
		}
	}

	get(action) {
		return this.state[action];
	}

	toString() { // for debugging
		let rtn = "InputHandler{";
		for(var key in this.state) {
			rtn += `${key}: ${this.state[key]}, `;
		}
		rtn = rtn.slice(0, rtn.length - 2) + "}";
		return rtn; 
	}
}

// TODO CanvasHandler class
export class CanvasHandler {

	// canvas; // main canvas for all drawing needs
	// g; // 2d graphics context for main canvas
	// follow; // object to follow
	// zoom; // zoom of the camera

	// mouse; // Pos {x, y}
	// mouseOver; // bool, is the mouse over the canvas?

	constructor(id = "canvas", follow = new Pos(512, 512)) {
		this.canvas = document.getElementById(id);
		this.g = this.canvas.getContext("2d");

		// FIX THE  B L U R
		this.g.imageSmoothingEnabled = false;
		this.g.mozImageSmoothingEnabled = false;
		this.g.oImageSmoothingEnabled = false;
		this.g.webkitImageSmoothingEnabled = false;
		// AAAAHHH

		this.follow = follow; // player to follow

		this.zoom = 1;

		this.mouse = new Pos();
		this.mouseOver = false;

		this.canvas.onmouseleave = e => {
			this.mouseOver = false;
		};

		this.canvas.onmouseenter = e => {
			this.mouseOver = true;
		};

		this.canvas.onmouseover = e => {
			this.mouse.x = e.clientX - this.canvas.offsetLeft;
			this.mouse.y = e.clientY - this.canvas.offsetTop;
		};
	}

	followObj(obj) {
		if(obj == undefined)
			return;
		console.log(`now following objects's position`);
		// FIXME: position having aneurism after setting follow to it
		this.follow = obj.pos;
	}

	setClickHandler(func) {
		this.canvas.onclick = func;
	}

	setRightClickHandler(func) {
		this.canvas.oncontextmenu = func;
	}

	// UTILITY

	// TODO: fix by using old code

	getCanvasPosFromWorldPos(pos) {
		// TODO test
		return new Pos(
			(pos.x - this.cx) * this.cz,
			(pos.y - this.cy) * this.cz
		);
	}
	
	getWorldPosFromCanvasPos(pos) {
		return new Pos(
			pos.x / this.cz + this.cx, 
			pos.y / this.cz + this.cy
		);
	}
	
	getTilePosFromCanvasPos(pos) {
		let pos1 = this.getWorldPosFromCanvasPos(pos);
		pos1.x = Math.round(pos1.x / 16);
		pos1.y = Math.round(pos1.x / 16);
		return pos1;
	}
	
	getTilePosFromWorldPos(pos) {
		return new Pos(
			Math.round(pos.x / 16), 
			Math.round(pos.y / 16)
		);
	}

	getMouseWorldPos() {
		return this.getWorldPosFromCanvasPos(this.mouse);
	}

	getMouseTilePos() {
		return this.getTilePosFromCanvasPos(this.mouse);
	}

	get cx() { return this.follow.x - this.cs / 2; } // camera x (in the top right corner)
	get cy() { return this.follow.y - this.cs / 2; } // camera y ^
	get cmax() { return 256; } // max camera size
	get cs() { return this.cmax / this.cz; } // camera size
	get cz() { return 2 * this.zoom; } // camera zoom

	toString() { // for debugging
		return `CanvasHandler{follow: ${this.follow.toString()}, zoom: ${this.zoom}, cx: ${Math.round(this.cx)}, cy: ${Math.round(this.cy)}, cs: ${Math.round(this.cs)}, cz: ${this.cz}}`;
	}
}

// simplified version of MainLoop.js by Isaac Sukin (https://github.com/IceCreamYou)
export class Engine {
	
	// ch; // CanvasHandler
	// ih; // InputHandler

	// static timestep = 1 / 60; // in seconds
	
	// lastRender; // in ms
	// delta; // in s
	// currentTime; // in s
	// fps;
	// frames;
	// lastFpsUpdate; // in ms

	constructor(init, update, draw, inputConfig) {
		this.ch = new CanvasHandler();
		this.ih = new InputHandler(inputConfig);
		Engine.timestep = 1 / 60; // in seconds

		this.lastRender = 0;
		this.delta = 0;
		this.currentTime = 0;
		this.fps = 60; // maybe correct already
		this.frames = 0;
		this.lastFpsUpdate = 0;
		
		this.init = init;
		this.update = update;
		this.draw = draw;
	}

	start() {
		this.init();
		window.requestAnimationFrame(t => this.loop(t));
	}

	panic() {
		this.delta = 0;
	}

	loop(timestamp) {
		this.currentTime = timestamp / 1000;
		this.delta += (timestamp - this.lastRender) / 1000;
		this.lastRender = timestamp;
		
		var steps = 0;
		while(this.delta >= Engine.timestep) {
			this.update(Engine.timestep);
			this.delta -= Engine.timestep;
		
			if(++steps >= 240) {
				this.panic();
				break;
			}
		}
	
		// compute fps
		if(timestamp > this.lastFpsUpdate + 1000) {
			this.fps = this.frames;
			this.lastFpsUpdate = timestamp;
			this.frames = 0;
		}
		this.frames++;
		
		// draw this beaut
		this.draw(this.ch.g);
	
		window.requestAnimationFrame(t => this.loop(t));
	}
}
