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
    - movement
        - w: boost forward, s: boost backward and half the rate, a: rotate left, d: rotate right
        - turbo boost: accelerate 2x as fast, 10s cooldown
        - rotation speed
        - boost speed
    - lasers
        - 1s cooldown
    - asteroids
        - keep number consistent
        - if one goes off screen, another takes its place
    - black holes
        - get in the middle => get smaller and die
        - radius of effect
    - go back to splash page when you die with name autofilled
- references