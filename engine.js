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
        for(let comp of this.components) {
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
		return 32;
	}
	
	get h() {
		return 32;
	}
	
	get r() { return this._r; }
	set r(value) { this._r = value % 360; }
	
	toString() { // for debugging
		return `GameObject{x: ${Math.round(this.x)}, y: ${Math.round(this.y)}, r: ${Math.round(this.r)}, type: ${this.type}}`;
	}
}

class Component {
    constructor(parent, update = () => {}) {
        this.parent = parent;
        this.update = update;
    }
}

class Projectile extends Component {
    
    
    // velocity
    
    constructor(parent, rotation, speed) {
        super(parent, (dt) => {
            parent.x += this.velocity.x * dt;
            parent.y += this.velocity.y * dt;
        });

        this.velocity = new Pos(30 * speed * Math.cos(rotation), 30 * speed * Math.sin(rotation));
    }
}

class Bounce extends Component {

	collidingVelocity = new Pos(0,0);
	mass2 = 0;
	velocity = new Pos(0,0);

	constructor(parent, rotation, mass1) {
		super(parent, (dt) => {
			let phi = Math.atan((this.collidingVelocity.y - this.velocity.y) / (this.collidingVelocity.x - this.velocity.x))
			let theta1 = Math.asin(this.velocity.y / Math.abs(this.velocity.x))
			let theta2 = Math.asin(this.collidingVelocity.y / Math.abs(this.collidingVelocity.x))
			let mag1 = Math.sqrt(Math.pow(this.velocity.x,2) + Math.pow(this.velocity.y,2))
			let mag2 = Math.sqrt(Math.pow(this.collidingVelocity.x,2) + Math.pow(this.collidingVelocity.y,2))
			this.velocity.x = ((((mag1 * Math.cos(theta1 - phi) * (mass1 - this.mass2)) + (2 * this.mass2 * mag2 * Math.cos(theta2 - phi))) / (mass1 + this.mass2)) * Math.cos(phi) + (mag1 * Math.sin(theta1 - phi) * Math.cos(phi + (Math.PI / 2))))
			this.velocity.y = ((((mag1 * Math.cos(theta1 - phi) * (mass1 - this.mass2)) + (2 * this.mass2 * mag2 * Math.cos(theta2 - phi))) / (mass1 + this.mass2)) * Math.sin(phi) + (mag1 * Math.sin(theta1 - phi) * Math.sin(phi + (Math.PI / 2))))
		})	
	}
}

class Hitbox extends Component {
	
	// radius

	constructor(parent, radius) {
        super(parent);

		this.radius = radius;
	}
}

class Movement extends Component {

	// velocity

	constructor(parent){
		super(parent, (dt) => {
			let acc = new Pos(parent.vertical * Math.cos(parent.r), parent.vertical * Math.sin(parent.r));
            this.velocity.x += acc.x * dt * 30;
			this.velocity.x *= 0.95
			this.velocity.y += acc.y * dt * 30;
			this.velocity.y *= 0.95
			parent.x += this.velocity.x * dt * 30;
			parent.y += this.velocity.y * dt * 30;

			parent.r += parent.horizontal * dt;
		});

		this.velocity = new Pos(0, 0);
	}
} 

class Invincible extends Component {
	
	invincible = true;
	timer = 2;
	constructor(parent){
		super(parent, (dt) => {
			this.timer -= dt
			if(this.timer <= 0) {
				this.invincible = false;
			}
		})
	}

}

class Player extends GameObject {

	turboCharge = 1.5;
    turboCooldown = 5;
    
    vertical = 0; // -1 to 1
	horizontal = 0; // -1 to 1

    constructor(x, y, r = 0, tag = '') {
		super(x, y, 2, r, tag);
		
		this.components.push(new Movement(this));
		this.components.push(new Hitbox(this, 12))
		this.components.push(new Bounce(this, r, 1))
		this.components.push(new Invincible(this))
    }
}

class Laser extends GameObject {
    
    constructor(x, y, r) {
        super(x, y, 3, r);
        
		this.components.push(new Projectile(this, r, 8));
		this.components.push(new Hitbox(this, 2));
    }
}

class Asteroid extends GameObject {
    constructor(x, y, r) {
        super(x, y, 4, r);

		this.components.push(new Projectile(this, r, 1));
		this.components.push(new Hitbox(this, 12))
		this.components.push(new Bounce(this, r, 0.5))
    }
}

module.exports.Pos = Pos;
module.exports.GameObject = GameObject;
module.exports.Player = Player;
module.exports.Laser = Laser;
module.exports.Asteroid = Asteroid;