
const UPDATES_PER_SECOND = 30;
const TERRAIN_SEED = 'asteroids yo';
const WORLD_SIZE = 4096; // not sure how big things are

const TERRAIN_SMOOTHING = 32;
const TERRAIN_EXP = 2; // mountains higher, valleys lower

const Engine = require("./engine.js");
const GameObject = Engine.GameObject;
const Player = Engine.Player;

const SimplexNoise = require('simplex-noise');
const simplex = new SimplexNoise(TERRAIN_SEED);

var updateData = {
    initialized: {},
    updated: {}, // visually updated
    removed: [] // list of ids
};

var world = {
    size: WORLD_SIZE,
    objects: {},
    static_objects: []
};

var players = {};
var lastId = 0;

function noise(x, y) {
    return simplex.noise2D(x, y) / 2 + 0.5;
}

function addObject(obj) {
    // if the object is not a game object, force it to be one
    if(!(obj instanceof GameObject))
        obj = GameObject.from(obj);
    
    world.objects[lastId] = obj;
    updateData.initialized[lastId] = obj;
    return lastId++;
}

function initWorld() {
    for(let y = 0; y < WORLD_SIZE; y++) {
        for(let x = 0; x < WORLD_SIZE; x++) {
            let nx = x / TERRAIN_SMOOTHING - 0.5, 
                ny = y / TERRAIN_SMOOTHING - 0.5;
            let val = 
                   1 * noise(nx, ny) +
                 0.5 * noise(nx * 2, ny * 2) +
                0.25 * noise(nx * 4, ny * 4);
            val /= 1.75; // 1.75 == all weights summed
            if(Math.pow(val, TERRAIN_EXP) > .85) {
                world.static_objects.push(new GameObject(x, y, 1))
            }
        }
    }
}

initWorld();

function emptyUpdateData() {
    updateData.initialized = {};
    updateData.updated = {}; 
    updateData.removed = [];
}


function update(dt) {
    for(let objId in world.objects) {
        let obj = world.objects[objId];
        obj.update(dt);
    }

    // decrement player timers
    for(let player in players) {
        let timers = players[player];
        for(let timer in timers) {
            if(timers[timer] > 0) {
                timers[timer] -= dt;
                if(timers[timer] < 0) {
                    timers[timer] = 0;
                }
            }
        }
    }
}

function getTimeMs() {
    return +new Date();
}

function checkCollision() {

    for(objId in world.objects){
        let obj1 = world.objects[objId];
        if(obj1.type == 3 || (obj1.type == 2 && obj1.components[3].invincible)){
            continue;
        }
        for(objId2 in world.objects){
            let obj2 = world.objects[objId2]
            if(obj1 == obj2){
                continue;
            }
            let hitbox1 = obj1.components[1];
            let hitbox2 = obj2.components[1];
            if((obj1.x + hitbox1.radius >= obj2.x - hitbox2.radius || obj1.x - hitbox1.radius <= obj2.x + hitbox2.radius) 
            && (obj1.y + hitbox1.radius >= obj2.y - hitbo2.radius || obj1.y - hitbo1.radius <= obj2.y + hitbo2.radius)){
                collide(obj1, obj2);
            }
        }
    }

}

function collide(objId, objId2,){
    let object1 = world.objects[objId];
    let object2 = world.objects[objId2];
    if(object2.type == 3){
        //laser hit something
        //push object1
        //use bounce with laser data before deleting the laser
        updateData.removed.push(objId2);
    }
    if(object2.type == 4 && object1.type == 2){
        //player crash with asteroid
        updateData.removed.push(objId);
    }
    if(object1.type == 4 && object2.type == 2){
        //player crash with asteroid
        updateData.removed.push(objId2);
    }
    if(object1.type == object2.type){
        //bounce
        world.objects[objId].components[1]
        //do components[2] bounce stuff for both objects
    }   
}

exports.setup = function(io, info) {
    let lastTime, 
        currentTime, 
        dt;
    let game = io.of('/game').on('connection', socket => {
        let userObj;
        let objId;

        players[objId] = {
            buildTimer: 0,
            moveTimer: 0
        };

        socket.emit('setup', world);

        socket.on('state keys', keys => {
            // server side state management
            console.log('6');
            let movementComponent = userObj.components[0];
            movementComponent.vertical = 0;
            movementComponent.horizontal = 0;
            let tb = 1;
            if(userObj.turboCooldown > 0) {
                userObj.turboCooldown -= dt;
                if(userObj.turboCooldown <= 0){
                    userObj.turboCharge = 1.5
                }
            }
            if(keys.turbo && userObj.turboCharge > 0) {
                tb = 2;
                userObj.turboCharge -= dt;
                if(userObj.turboCharge <= 0) {
                    userObj.turboCooldown = 5;
                } 
            }
            if(keys.forward) {
                movementComponent.vertical += 0.5 * tb;
            }
            if(keys.backward) {
                movementComponent.vertical -= 0.5;
            }
            if(keys.left) {
                movementComponent.horizontal -= 1;
            }
            if(keys.right) {
                movementComponent.horizontal += 1;
            }

            if(keys.shoot) {
                // shoots from current x and y with rotation r
                console.log(`user ${userObj.tag} shot`);
                addObject(new GameObject(userObj.x, userObj.y, userObj.r));
            }
            
            updateData.updated[objId] = userObj;
        });
        // Occurs when the user inputs a name on the splash
        socket.on('ready', nickname => {
            /* When the user inputs a nickname (splash)
            let taken = false;  // If that nickname is taken
            for(let player in players) {    // Cycle through all players
                if(player.tag == nickname) {    // If one of their tags is equal to the given nick
                    taken = true;
                    break;  // Eh-Fish-In-See, yeah
                }   
            }
            if(!taken) {    // Nickname is free
                userObj.tag = nickname;
                // ? addObject(userObj);
                socket.emit('ready', userObj);
            } else {    // Nickname isn't free

            }*/

            userObj = new Player(world.size / 2, world.size / 2, 0);
            userObj.tag = info[socket.conn.id].tag = nickname;
            info[socket.conn.id].object = userObj;
            
            objId = addObject(userObj);
            info[socket.conn.id].objectId = objId;

            socket.emit('ready', objId);
        });

        socket.on('disconnect', reason => {
            console.log('user disconnected');
            if(typeof objId !== 'undefined')
                updateData.removed.push(objId);
        });

    });

    lastTime = getTimeMs();
    setInterval( () => {
        currentTime = getTimeMs();
        dt = (currentTime - lastTime) / 1000;
        lastTime = currentTime;
        update(dt);

        // only send data that is needed, 
        //  ie. split update into init, updated, and removed

        if(Object.entries(updateData.initialized).length !== 0) {
            for(let obj in updateData.initialized)
                updateData.initialized[obj].components = [];
            
            game.emit('objects initial', updateData.initialized);
        }
        if(Object.entries(updateData.updated).length !== 0) {
            for(let obj in updateData.updated)
                updateData.initialized[obj].components = [];
            
            game.emit('objects updated', updateData.updated);
        }
        if(Object.entries(updateData.removed).length !== 0) {
            for(let id of updateData.removed) {
                console.log(`actually deleted object ${id}`);
                delete world.objects[id];
            }

            game.emit('objects removed', updateData.removed);
        }
        
        emptyUpdateData();
    }, 1000 / UPDATES_PER_SECOND);

    return game;
};
