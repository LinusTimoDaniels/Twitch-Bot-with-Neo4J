const tmi = require('tmi.js');
const neo4j = require('neo4j-driver');
var driver;

// Define configuration options
const opts = {
    identity: {
        username: '7zenn7',
        password: 'oauth:fxyh1sby0kiwzrzpzebyn8kl8zbve4'
    },
    channels: [
        '7zenn7'
    ]
};

// Create a client with our options
const client = new tmi.client(opts);

// Get Token for authentication
getToken();

// Connect to Database
(async () => {
  // URI examples: 'neo4j://localhost', 'neo4j+s://xxx.databases.neo4j.io'
  const URI = 'neo4j+s://40a220bf.databases.neo4j.io'
  const USER = 'neo4j'
  const PASSWORD = 'vj-rpy6ymhtnFmfIyQJrW-MmSJ7dMuposeEo1-SSSog'

  try {
    driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD))
    const serverInfo = await driver.getServerInfo()
    console.log('Connection established')
    //console.log(serverInfo)
  } catch(err) {
    console.log(`Connection error\n${err}\nCause: ${err.cause}`)
  }
})();

// Register our event handlers (defined below)
client.on('message', onMessageHandler);
client.on('connected', onConnectedHandler);

// Connect to Twitch:
client.connect();

// Called every time a message comes in
function onMessageHandler (channel, tags, msg, self) {

    //console.log(channel + "\n", tags.username + "\n", msg + "\n", self + "\n")

    // Ignore messages from the bot
    if (self) { return; }

    // Remove whitespace from chat message
    const commandName = msg.trim();

    // Create the User and JokeConfig if he doesn't exist yet
    createUser(tags.username);

    // Write message into database
    createMessage(tags.username, commandName)

    // If the command is known, let's execute it
    switch(commandName) {
        case('!dice'):
            const num = rollDice();
            client.say(channel, `You rolled a ${num}`);
            console.log(`* Executed ${commandName} command`);
            break;
        /*case('!delete'):
            try{
                client.deletemessage(channel, tags.id);
            } catch (error) {
                console.log(error)
            }
            break;*/
        case('!joke'):
            if(!getJokeConfig(tags.username)) {
                createJokeConfig(tags.username);
            }
            getJokeConfig(tags.username);
            getJoke(channel);
            break;
        default:
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
  /*  var AuthWindow = "";
        AuthWindow = window.open("https://id.twitch.tv/oauth2/authorize?response_type=token&client_id=1tqcavkk6yknbau0v4jr88elsvfe6y&redirect_uri=http://localhost:3000&scope=channel:moderate+chat:read+chat:edit");
    console.log(123, AuthWindow);*/
}

async function checkIfUserExists() {
    return false;
}

async function createUser(username) {
    let { records, summary } = await driver.executeQuery(
      'MERGE (p:User {name: $name})',
       { name: username },
       { database: 'neo4j' }
    )
    console.log(
      `Created ${summary.counters.updates().nodesCreated} nodes ` +
      `in ${summary.resultAvailableAfter} ms.`
    )
    createJokeConfig(username);
}

async function createMessage(username, message) {

    // Create a new Date object
    const currentDate = new Date();

    // Get various components of the date and time
    const day = currentDate.getDate(); // Day of the month (1-31)
    const month = currentDate.getMonth() + 1; // Month (0-11, add 1 to get the correct month)
    const year = currentDate.getFullYear(); // Full year
    const hours = currentDate.getHours(); // Hours (0-23)
    const minutes = currentDate.getMinutes(); // Minutes (0-59)
    const seconds = currentDate.getSeconds(); // Seconds (0-59)

    // Format the date and time
    const formattedDateTime = `${day.toString().padStart(2, '0')}:${month.toString().padStart(2, '0')}:${year}:${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    // Print the formatted date and time
    console.log(`Current Date and Time (DD:MM:YYYY:hh:mm:ss): ${formattedDateTime}`);



    let { records, summary } = await driver.executeQuery(
          'MATCH (u:User {name: $name}) CREATE (m:Message {content: $content, date: $date}) CREATE (u)-[:SENT]->(m)',
          { name: username, content: message, date: formattedDateTime },
          { database: 'neo4j' }
    )
    console.log(
          `Created ${summary.counters.updates().nodesCreated} nodes ` +
          `in ${summary.resultAvailableAfter} ms.`
    )
}

async function getJoke(channel) {
    fetch('https://v2.jokeapi.dev/joke/Programming?type=single')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        // Handle the response data
        console.log(data);

        // Access the joke, for example:
        const joke = data.joke;

        // Client returns joke into the Chat
        client.say(channel, joke);
      })
      .catch(error => {
        console.error('There was a problem with the fetch operation:', error);
      });
}

async function createJokeConfig(username) {
        const category = 'any';
        let { records, summary } = await driver.executeQuery(
              'MATCH (u:User {name: $name}) CREATE (j:JokeConfig {category: $category}) CREATE (u)-[:HAS]->(j)',
              { name: username, category: category },
              { database: 'neo4j' }
        )
        console.log(
              `Created ${summary.counters.updates().nodesCreated} nodes ` +
              `in ${summary.resultAvailableAfter} ms.`
        )
}

async function getJokeConfig(username) {
        const category = 'any';
        let { records, summary } = await driver.executeQuery(
              'MATCH (u:User)-[:HAS]->(j:JokeConfig) WHERE u.name = $name RETURN j',
              { name: username },
              { database: 'neo4j' }
        )
        console.log(
              `Found ${summary.counters.updates().nodesCreated} nodes ` +
              `in ${summary.resultAvailableAfter} ms.`
        )
        console.log(summary);
        return summary;
}
