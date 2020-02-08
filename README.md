# UGAHacks5
Made at UGAHacks 5.


rotation
```
function drawRotated(degrees){
    context.clearRect(0,0,canvas.width,canvas.height);

    // save the unrotated context of the canvas so we can restore it later
    // the alternative is to untranslate & unrotate after drawing
    context.save();

    // move to the center of the canvas
    context.translate(canvas.width/2,canvas.height/2);

    // rotate the canvas to the specified degrees
    context.rotate(degrees*Math.PI/180);

    // draw the image
    // since the context is rotated, the image will be rotated also
    context.drawImage(image,-image.width/2,-image.width/2);

    // we’re done with the rotating so restore the unrotated context
    context.restore();
}

```

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