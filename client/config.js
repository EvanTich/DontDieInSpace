export const inputConfig = {
    // JavaScript key codes for all the actions
    keyMap: {
        39: 'right', // arrow key
        68: 'right', // d
        37: 'left', // arrow key
        65: 'left', // a
        38: 'forward', // arrow key
        87: 'forward', // w
        40: 'backward', // arrow key
        83: 'backward', // s
        16: 'turbo', // SHIFT
        84: 'chat', // t
        192: 'debug', // ~
        32: 'shoot', // SPACE
        'default': 'unknown' // every other key will be under "unknown" now
    },
    // Sets which actions are toggled instead of held
    // Activates once per key stroke
    once: ['chat', 'debug'],
    // Activate once to toggle on/off
    // Automatically handles toggling, but the raw value 
    //  of the action would be now under: x + "_raw"
    toggle: []
}