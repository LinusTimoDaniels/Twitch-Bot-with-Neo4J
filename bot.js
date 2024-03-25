const tmi = require('tmi.js');

// Define configuration options
const opts = {
    identity: {
        username: '7zenn7',
        password: 'oauth:rws39c56z4q7xjk998f4yltvle1ach'
    },
    channels: [
        '7zenn7'
    ]
};

// Create a client with our options
const client = new tmi.client(opts);
getToken();

// Register our event handlers (defined below)
client.on('message', onMessageHandler);
client.on('connected', onConnectedHandler);

// Connect to Twitch:
client.connect();

// Called every time a message comes in
function onMessageHandler (target, context, msg, self) {
    if (self) { return; } // Ignore messages from the bot

    // Remove whitespace from chat message
    const commandName = msg.trim();

    // If the command is known, let's execute it
    if (commandName === '!dice') {
        const num = rollDice();
        client.say(target, `You rolled a ${num}`);
        console.log(`* Executed ${commandName} command`);
    } else {
        console.log(`* Unknown command ${commandName}`);
    }
}

// Function called when the "dice" command is issued
function rollDice () {
    const sides = 6;
    return Math.floor(Math.random() * sides) + 1;
}

// Called every time the bot connects to Twitch chat
function onConnectedHandler (addr, port) {
    console.log(`* Connected to ${addr}:${port}`);
}

function getToken() {
    const response = fetch("https://id.twitch.tv/oauth2/authorize?response_type=token&client_id=1tqcavkk6yknbau0v4jr88elsvfe6y&redirect_uri=http://localhost:3000&scope=chat%3Aread+chat%3Aedit")
    .then(response => response)
    .then((response) => {
        console.log(response);
    })
}