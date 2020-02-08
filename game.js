
const UPDATES_PER_SECOND = 30;
const TERRAIN_SEED = 'asteroids yo';
const WORLD_SIZE = 4096; // not sure how big things are
const GRID_SIZE = WORLD_SIZE/128

const TERRAIN_SMOOTHING = 32;
const TERRAIN_EXP = 2; // mountains higher, valleys lower

const GameObject = require("../lib/engine.node.js").GameObject;

const SimplexNoise = require('simplex-noise');
const simplex = new SimplexNoise(TERRAIN_SEED);

var updateData = {
    initialized: {},
    updated: {}, // visually updated
    removed: [] // list of ids
};

var world = {
    size: WORLD_SIZE,
    grid: [],
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

        switch(obj.type) {
            default:
                break;
        }
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

exports.setup = function(io, info) {
    let lastTime, 
        currentTime, 
        dt;
    let game = io.of('/game').on('connection', socket => {
        let userObj = new GameObject(world.size / 2, world.size / 2, 0);
        userObj.tag = info[socket.conn.id].tag;
        info[socket.conn.id].object = userObj;
        
        let objId = addObject(userObj);
        info[socket.conn.id].objectId = objId;

        players[objId] = {
            buildTimer: 0,
            moveTimer: 0
        };

        socket.emit('setup', world);
        socket.emit('object id', { id: objId });

        socket.on('state keys', keys => {
            // server side state management
            let movementComponent = userObj.components[0];
            movementComponent.vertical = 0;
            movementComponent.horizontal = 0;
            if(keys.up) {
                movementComponent.vertical += 1;
            }
            if(keys.down) {
                movementComponent.vertical -= 1;
            }
            if(keys.left) {
                movementComponent.horizontal -= 1;
            }
            if(keys.right) {
                movementComponent.horizontal += 1;
            }
            
            updateData.updated[objId] = userObj;
        });

        socket.on('shoot', data => {
            // shoots from current x and y with rotation r

            console.log(`user ${userObj.tag} shot`);
            addObject(new GameObject(userObj.x, userObj.y, userObj.r));
        });
        
        socket.on('disconnect', reason => {
            console.log('user disconnected');
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

        if(Object.entries(updateData.initialized).length !== 0)
            game.emit('objects initial', updateData.initialized);
        if(Object.entries(updateData.updated).length !== 0)
            game.emit('objects updated', updateData.updated);
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