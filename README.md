# UGAHacks5
Made at UGAHacks 5.


## Socket stuff
` -> ` is from the server to the user
` <- ` is from the user to the server

### User first gets into the webpage
` -> 'setup'` with world = {size, objects, static_objects}
` -> 'leaderboard'` with leaderboard = {top = [{name: score}, ...], current}

### User enters name and clicks "Play!"
` <- 'ready'` with player name
` -> 'ready'` with player objectId

### Gameplay
` <- 'key state'` with keys = {forward, backwards, left, right, shoot, turbo}
` -> 'objects initial'` with initialized = {id: object, ...}
` -> 'objects updated'` with updated = {id: object, ...}
` -> 'objects removed'` with removed = [id, ...]

### User dies
` -> 'death'` with nothing - reload page

### User leaves
` <- 'disconnect'` with reason, remove user from game data

## TODO
- [ ] splash page in front of the game
    - top and current time leaderboard shown
    - two people cant have the same name
    - dont need to check name for bad words
    - send over to the server and send over an object id to the user
    - the user will then send over an 'OK' signal
- [ ] main game
    - asteroids and players can be pushed around with lasers
    - iframes when you spawn and 1.5s after
        - fly in from the sides of the map
    - black holes that suck
    - death zones on the sides of the map, die after ~2 seconds
        - based on number of players maybe
    - scoreboard based on total time alive, maybe kills based on last laser hit
    - iframes on hit if its not funny
    - ships bounce off each other && asteroids bounce off each other
    - three types of ships maybe
        - ram, normal, blaster
    -X movement (Complete:Still needs testing)
        -X w: boost forward, s: boost backward and half the rate, a: rotate left, d: rotate right
        -X turbo boost: accelerate 2x as fast, 10s cooldown
        -X rotation speed
        -X boost speed
    - lasers
        - 1s cooldown
    - asteroids
        - keep number consistent
        - if one goes off screen, another takes its place
    - black holes
        - get in the middle => get smaller and die
        - radius of effect
    - go back to splash page when you die with name autofilled
    - add grid to game map
    - collision checking(server-side) within 9 block square of grid
    - blast zone checker
- references

### Actual TODO
- [ ] leaderboard
- [x] collision
    - [x] bouncing
    - [ ] fix the way it is now
- [x] set laser to not collide with parent
- [ ] drawing death zone on client, if statements on server
- [x] player timers, like boost and lasers
- [x] asteroids spawning
- [x] up rotation velocity
- [ ] cap max velocity on ships
- [x] make lasers faster?
- [x] randomize stars
- [ ] camera border?
- [ ] death screen
- [ ] optimizations
    - [ ] network
    - [ ] drawing
- [ ] client side entity updating instead of relying on server communication fully (think of source engine multiplayer)
- [ ] make death zone very clear
- [ ] more zoomed in / smaller map
- [ ] make it easier to locate other players or have a coordinate system (A5, B1, etc.)
- [ ] make lasers more noticeable
- [ ] asteroids bigger
- [ ] able to destroy asteroids after a couple of shots
    - [ ] make it noticeable of how many hits it will take to destroy
- [ ] fix project on GCP (evan only)
- [x] fix going to chat on 't' when on splash screen
- [ ] play on mobile
- [ ] aim and move with mouse? 
    - [ ] distance away from mouse is speed?
- [ ] statistics (current/max number of players, average play time, highest score)