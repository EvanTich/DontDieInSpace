
const UPDATES_PER_SECOND = 30;
const TERRAIN_SEED = 'asteroids yo';
const WORLD_SIZE = 1024; // not sure how big things are

const TERRAIN_SMOOTHING = 32;
const TERRAIN_EXP = 2; // mountains higher, valleys lower

const MAX_ASTEROIDS = 50;
const Engine = require("./engine.js");
const Pos = Engine.Pos;
const GameObject = Engine.GameObject;
const Player = Engine.Player;
const Laser = Engine.Laser;
const Asteroid = Engine.Asteroid;

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

function sanitize(obj) {
    return {
        pos: {x: obj.pos.x, y: obj.pos.y},
        type: obj.type,
        _r: obj._r,
        tag: obj.tag
    }
}

var lastId = 0;

var asteroidCount = 0;

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
    for(let y = -WORLD_SIZE; y < WORLD_SIZE; y++) {
        for(let x = -WORLD_SIZE; x < WORLD_SIZE; x++) {
            let nx = x / TERRAIN_SMOOTHING - 0.5, 
                ny = y / TERRAIN_SMOOTHING - 0.5;
            let val = 
                   1 * noise(nx, ny) +
                 0.5 * noise(nx * 2, ny * 2) +
                0.25 * noise(nx * 4, ny * 4);
            val /= 1.75; // 1.75 == all weights summed
            if(Math.pow(val, TERRAIN_EXP) > .85) {
                let rand = 5+Math.floor((Math.random()*10) % 3);
                world.static_objects.push(new GameObject(x, y, rand));
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
        updateData.updated[objId] = obj;
    }

    cleanup();
    checkCollision();
    if(asteroidCount < MAX_ASTEROIDS){
        asteroidSpawn();
        asteroidCount++;
    }
}

function getTimeMs() {
    return +new Date();
}

function checkCollision() {

    for(let objId in world.objects){
        let obj1 = world.objects[objId];
        if(obj1.type == 3 || (obj1.type == 2 && obj1.components[3].invincible)){
            continue;
        }

        for(let objId2 in world.objects){
            if(objId == objId2){
                continue;
            }
            let obj2 = world.objects[objId2];
            let h1 = obj1.components[1];
            let h2 = obj2.components[1];

            let dx = obj1.x - obj2.x, 
                dy = obj1.y - obj2.y;
            if(Math.sqrt(dx * dx + dy * dy) < h1.radius + h2.radius){
                collide(objId, objId2);
            }
        }
    }
}

function collide(objId, objId2){
    let obj1 = world.objects[objId];
    let obj2 = world.objects[objId2];
    if(obj2.type == 3){
        //laser hit something
        //push object1
        //use bounce with laser data before deleting the laser
        if(obj2.shooterId == objId){
            return;
        }else{
            console.log('laser collision');
            obj1.components[2].bounce(obj2.components[0].velocity, .1)
            updateData.removed.push(objId2);
        }
    }
    if(obj2.type == 4 && obj1.type == 2){
        //player crash with asteroid
        updateData.removed.push(objId);
    }
    if(obj1.type == 4 && obj2.type == 2){
        //player crash with asteroid
        updateData.removed.push(objId2);
    }
    if(obj1.type == obj2.type){
        console.log('bounce collision');
        //bounce
        let vel1 = new Pos(obj1.components[0].velocity.x, obj1.components[0].velocity.y),
            vel2 = new Pos(world.objects[objId2].components[0].velocity.x, world.objects[objId2].components[0].velocity.y);
            
        obj1.components[2].bounce(vel2, obj2.components[2].mass);
        obj2.components[2].bounce(vel1, obj1.components[2].mass);
    }   
}

function cleanup(){
    for(let objId in world.objects){
        if(world.objects[objId].type == 2 || world.objects[objId].type == 4) {
            if(world.objects[objId].x > WORLD_SIZE + 50 || world.objects[objId].x < -WORLD_SIZE - 50 || world.objects[objId].y > WORLD_SIZE + 50 || world.objects[objId].x < -WORLD_SIZE - 50){
                if(world.objects[objId.type] == 4){
                    asteroidCount--;
                }
                updateData.removed.push(objId);
            }
        }else if(world.objects[objId].type == 3 && !world.objects[objId].components[2].alive){
            updateData.removed.push(objId);
        }
    }
}

function asteroidSpawn(){
    if (Math.random() < .5){
        let x = (WORLD_SIZE + 20) * (Math.random() < .5 ? -1 : 1);
        let y = WORLD_SIZE * Math.random();
        let vectorAreaX = (Math.random() - .5) * WORLD_SIZE / 2;
        let vectorAreaY = (Math.random() - .5) * WORLD_SIZE / 2;
        let rotation = Math.atan2(vectorAreaY-y, vectorAreaX-x);
        addObject(new Asteroid(x, y, rotation));
    } else {
        let y = (WORLD_SIZE + 20) * (Math.random() < .5 ? -1 : 1);
        let x = WORLD_SIZE * Math.random();
        let vectorAreaX = (Math.random() - .5) * WORLD_SIZE / 2;
        let vectorAreaY = (Math.random() - .5) * WORLD_SIZE / 2;
        let rotation = Math.atan2(vectorAreaY-y, vectorAreaX-x);
        addObject(new Asteroid(x, y, rotation));
    }
}



exports.setup = function(io, info) {
    let lastTime, 
        currentTime, 
        dt;
    let game = io.of('/game').on('connection', socket => {
        let userObj;
        let objId;

        let new_world = { 
            size: world.size,
            static_objects: world.static_objects,
            objects: { ...world.objects }
        };

        for(let id in new_world.objects) {
            new_world.objects[id] = sanitize(new_world.objects[id]);
        }

        socket.emit('setup', new_world);

        socket.on('key state', keys => {
            if(typeof userObj === 'undefined')
                return;

            // server side state management
            userObj.vertical = 0;
            userObj.horizontal = 0;
            let tb = 1;
            if(userObj.turboCooldown > 0) {
                userObj.turboCooldown -= dt;
                if(userObj.turboCooldown <= 0){
                    userObj.turboCharge = 1.5;
                }
            }
            if(keys.turbo && userObj.turboCharge > 0) {
                tb = 2;
                userObj.turboCharge -= dt;
                if(userObj.turboCharge <= 0) {
                    userObj.turboCooldown = 10;
                } 
            }
            if(keys.forward) {
                if(userObj.vertical >= 100){
                    userObj.vertical += 0;
                }else{
                    userObj.vertical += 0.5 * tb;
                }
            }
            if(keys.backward) {
                userObj.vertical -= 0.5;
            }
            if(keys.left) {
                userObj.horizontal -= 1;
            }
            if(keys.right) {
                userObj.horizontal += 1;
            }

            if(keys.shoot && userObj.laserCooldown <= 0) {
                // shoots from current x and y with rotation r
                console.log(`user ${userObj.tag} shot`);
                world.objects[addObject(new Laser(userObj.x, userObj.y, userObj.r))].shooterId = objId;
                //Id of Laser object is used to assign the shooter id with current obj that is shooting
                userObj.laserCooldown = 1;
            } else {
                userObj.laserCooldown -= dt;
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

            if(typeof userObj !== 'undefined')
                return;

            userObj = new Player((Math.random() - .5) * WORLD_SIZE, (Math.random() - .5) * WORLD_SIZE, 0);
            userObj.tag = info[socket.conn.id].nickname = nickname;
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
                    updateData.initialized[obj] = sanitize(updateData.initialized[obj]);
            
            game.emit('objects initial', updateData.initialized);
        }
        if(Object.entries(updateData.updated).length !== 0) {
            for(let obj in updateData.updated)
                updateData.updated[obj] = sanitize(updateData.updated[obj]);
            
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
