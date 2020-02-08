const typeMap = {
    // id: {img: image path, r: radius of hitbox from the center}
	0: {img: 'img/path.png', r: 0}, // NOTHING
    1: {img: 'img/path.png', r: 0}, // STAR
    2: {img: 'img/path.png', r: 0}, // PLAYER
    3: {img: 'img/path.png', r: 0}, // PROJECTILE
    4: {img: 'img/path.png', r: 0} // ASTEROID
}

class Pos {

	// x;
	// y;

	constructor(x = 0, y = 0) {
		this.x = x;
		this.y = y;
	}
}

class GameObject {

	// pos; // Pos {x, y}
	// type;
	// _r;
    
    // components // array of components

	constructor(x, y, type, r = 0, tag = '') {
		this.pos = new Pos(x, y); // center
		this.type = type;
		this._r = r; // degrees
		if(tag) {
			this.tag = tag;
		}
        
        this.components = [];
	}

	static from(obj) {
		return new GameObject(obj.x, obj.y, obj.type, obj._r, obj.tag);
	}

	updateFrom(obj) {
		this.pos.x = obj.x;
		this.pos.y = obj.y;
		this.type = obj.type;
		this._r = obj._r; // degrees
		if(obj.tag) {
			this.tag = obj.tag;
		}
	}
    
    update(dt) {
        for(let comp of components) {
            comp.update(dt);
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
		return this.type == -1 ? 16 : typeMap[this.type].w;
	}
	
	get h() {
		return this.type == -1 ? 16 : typeMap[this.type].h;
	}
	
	get r() { return this._r; }
	set r(value) { this._r = value % 360; }
	
	toString() { // for debugging
		return `GameObject{x: ${Math.round(this.x)}, y: ${Math.round(this.y)}, r: ${Math.round(this.r)}, type: ${this.type}}`;
	}

	typeOf() {
		return this.type;
	}
}

class Component {
    constructor(parent, update) {
        this.parent = parent;
        this.update = update;
    }
}

class Projectile extends Component {
    
    
    // velocity
    
    constructor(parent, rotation, speed) {
        super(parent, (dt) => {
            parent.x += velocity.x * dt;
            parent.y += velocity.y * dt;
        });

        this.velocity = new Pos(speed * Math.cos(rotation), speed * Math.sin(rotation));
    }
}

class Bounce extends Component {

}

class Hitbox extends Component {
	
	// radius

	constructor(parent, radius) {

		radius = radius;

	}
}

class Movement extends Component {

	vertical; // -1 to 1
	horizontal; // -1 to 1

	constructor(parent, rotation){
		super(parent, (dt) => {
			let acc = new Pos(this.vertical * Math.cos(parent.r), this.vertical * Math.sin(parent.r));
			this.velocity.x += acc.x * dt;
			this.velocity.x *= 0.95
			this.velocity.y += acc.y * dt;
			this.velocity.y *= 0.95
			parent.x += velocity.x * dt;
			parent.y += velocity.y * dt;

			parent.r += this.horizontal * dt;
		})

		this.velocity = new Pos(0, 0);
	}

} 

class Invincible extends Component{
	
	invincible = true;
	timer = 2;
	constructor(parent){
		super(parent, (dt) => {
			timer -= dt
			if(timer <= 0) {
				invincible = false;
			}
		})
	}

}

class Player extends GameObject {

    constructor(x, y, r = 0, tag = '') {
		super(x, y, 2, r, tag);
		
		components.push(new Movement(this, r));
		this.components.push(new Hitbox(this, 12))
		this.components.push(new Invincible(this))
    }
}

class Laser extends GameObject {
    
    constructor(x, y, r) {
        super(x, y, 3, r);
        
		components.push(new Projectile(this, r, 8));
		this.components.push(this, 2)
    }
}

class Asteroid extends GameObject {
    constructor(x, y, r) {
        super(x, y, 4, r);

		components.push(new Projectile(this, r, 1));
		this.components.push(new Hitbox(this, 12))
    }
}

module.exports.Pos = Pos;
module.exports.GameObject = GameObject;
module.exports.Player = Player;
module.exports.Laser = Laser;
module.exports.Asteroid = Asteroid;