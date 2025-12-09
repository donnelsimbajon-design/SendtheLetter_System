
const net = require('net');

const client = new net.Socket();
client.setTimeout(2000); // 2 second timeout

console.log('Attempting raw TCP connection to 127.0.0.1:3306...');

client.connect(3306, '127.0.0.1', function () {
    console.log('Connected to port 3306 via TCP!');
    client.destroy(); // kill client after server's response
});

client.on('data', function (data) {
    console.log('Received: ' + data);
    client.destroy(); // kill client after server's response
});

client.on('close', function () {
    console.log('Connection closed');
});

client.on('error', function (err) {
    console.error('Connection Error:', err.message);
});

client.on('timeout', function () {
    console.error('Connection Timed Out');
    client.destroy();
});
