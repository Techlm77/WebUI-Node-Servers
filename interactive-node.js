const express = require('express');
const fs = require('fs');
const childProcess = require('child_process');

const app = express();
const port = 5501;

// Define an array of Node.js server files with metadata
const serverMappings = {
    "chat.js": { name: "Web: WebSocket Chat", metadata: "Real-time chat application using WebSocket" },
    "stream.js": { name: "Web: Streaming", metadata: "Live streaming server for web applications" },
    "techord.js": { name: "Web: Techord", metadata: "Collaborative document editing using WebSocket" },
    "discord.js": { name: "Discord Bot", metadata: "Bot for Discord server" },
    "active-user.js": { name: "Web: Active User Tracker", metadata: "Tracks active users on a web application" },
    "pubslide.js": { name: "Web: Public Slide", metadata: "Displays public slides for web presentations" },
};

// Function to execute shell commands
function executeCommand(command, callback) {
    childProcess.exec(command, (error, stdout, stderr) => {
        callback(stdout, stderr);
    });
}

// Start all servers
function startAllServers() {
    Object.keys(serverMappings).forEach(fileName => {
        const command = `node ${fileName} > logs/${fileName}.log 2>&1 & echo $! > logs/${fileName}.pid`;
        executeCommand(command, (stdout, stderr) => {
            console.log(`Server ${fileName} started.`);
        });
    });
}

// Start all servers on application launch
startAllServers();

// Handle termination signal (Ctrl+C)
process.on('SIGINT', () => {
    console.log('\nStopping all servers...');
    
    // Stop all servers
    Object.keys(serverMappings).forEach(fileName => {
        const stopCommand = `pkill -F logs/${fileName}.pid && rm -f logs/${fileName}.pid`;
        executeCommand(stopCommand, () => {
            console.log(`Server ${fileName} stopped.`);
        });
    });

    // Cleanup: Stop all background processes
    executeCommand('pkill -f "node"', () => {
        console.log('All servers stopped. Exiting...');
        process.exit();
    });
});

// HTML template for the server list
function getServerListHTML() {
    try {
        const serverLinks = Object.entries(serverMappings)
            .map(([file, { name, metadata }]) =>
                `<a class="server-link" href="/node-server/${file}" title="${metadata}">${name}</a>`
            )
            .join(' | ');

        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Interactive Node Servers</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 0;
                        padding: 0;
                        background-color: #f4f4f4;
                    }

                    header {
                        background-color: #333;
                        color: white;
                        padding: 1em;
                        text-align: center;
                    }

                    main {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        padding: 2em;
                    }

                    h1 {
                        margin-bottom: 1em;
                    }

                    .server-link {
                        text-decoration: none;
                        color: #fff;
                        margin: 0.5em;
                        padding: 0.5em 1em;
                        border-radius: 5px;
                        background-color: #337ab7;
                        border: 1px solid #ddd;
                        transition: background-color 0.3s, color 0.3s;
                    }

                    .server-link:hover {
                        background-color: #fff;
                        color: #337ab7;
                    }
                </style>
            </head>
            <body>
                <header>
                    <h1>Interactive Node Servers</h1>
                </header>
                <main>
                    <div>${serverLinks}</div>
                </main>
            </body>
            </html>
        `;
    } catch (error) {
        console.error('Error generating server list HTML:', error.message);
        return '<p>An error occurred while generating the server list.</p>';
    }
}

// Display the server list
app.get('/node-servers', (req, res) => {
    const serverListHTML = getServerListHTML();
    res.send(serverListHTML);
});

// Display server details and controls
app.get('/node-server/:serverName', (req, res) => {
    const fileName = req.params.serverName;
    const { name, metadata } = serverMappings[fileName] || { name: fileName, metadata: "No metadata available" };
    const logPath = `logs/${fileName}.log`;

    // Read the log file
    const readLog = () => {
        fs.readFile(logPath, 'utf8', (err, data) => {
            if (err) {
                data = `Error reading log file: ${err.message}`;
            }

            // Check if the server is running
            const isServerRunning = fs.existsSync(`logs/${fileName}.pid`);

            // HTML template for server details and controls
            try {
                const html = `
                    <!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Interactive Node Servers</title>
                        <style>
                            body {
                                font-family: Arial, sans-serif;
                                margin: 0;
                                padding: 0;
                                background-color: #f4f4f4;
                            }

                            header {
                                background-color: #333;
                                color: white;
                                padding: 1em;
                                text-align: center;
                            }

                            main {
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                                padding: 2em;
                            }

                            h1 {
                                margin-bottom: 1em;
                            }

                            pre {
                                white-space: pre-wrap;
                                word-wrap: break-word;
                                background-color: #fff;
                                padding: 1em;
                                border: 1px solid #ddd;
                                border-radius: 5px;
                                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                                margin-bottom: 1em;
                            }

                            form {
                                display: flex;
                                gap: 1em;
                            }

                            button {
                                padding: 0.5em 1em;
                                font-size: 1em;
                                cursor: pointer;
                                border: none;
                            }

                            button.start {
                                background-color: green;
                                color: white;
                            }

                            button.restart {
                                background-color: orange;
                                color: white;
                            }
                            
                            button.stop {
                                background-color: red;
                                color: white;
                            }

                            a {
                                text-decoration: none;
                                color: #fff;
                                margin: 0.5em;
                                padding: 0.5em 1em;
                                border-radius: 5px;
                                background-color: #337ab7;
                                border: 1px solid #ddd;
                                transition: background-color 0.3s, color 0.3s;
                            }

                            a:hover {
                                background-color: #fff;
                                color: #337ab7;
                            }
                        </style>
                        <script>
                            function updateLog() {
                                fetch('/log/${fileName}')
                                    .then(response => response.text())
                                    .then(data => {
                                        // Clear log content if the server is not running
                                        if (!${isServerRunning}) {
                                            data = '';
                                        }
                                        document.getElementById('log').textContent = data;
                                        setTimeout(updateLog, 1000); // Fetch log every 1 second
                                    })
                                    .catch(error => {
                                        console.error('Error fetching log:', error);
                                    });
                            }

                            function updateButtons() {
                                const startButton = document.querySelector('.start');
                                const restartButton = document.querySelector('.restart');
                                const stopButton = document.querySelector('.stop');

                                // Check if buttons exist before updating
                                if (startButton && restartButton && stopButton) {
                                    fetch('/is-server-running/${fileName}')
                                        .then(response => response.json())
                                        .then(data => {
                                            const isServerRunning = data.isRunning;

                                            if (isServerRunning) {
                                                startButton.style.display = 'none';
                                                restartButton.style.display = 'inline-block';
                                                stopButton.style.display = 'inline-block';
                                            } else {
                                                startButton.style.display = 'inline-block';
                                                restartButton.style.display = 'none';
                                                stopButton.style.display = 'none';
                                            }
                                        })
                                        .catch(error => {
                                            console.error('Error checking server status:', error);
                                        });
                                }
                            }

                            updateLog();
                            updateButtons();
                        </script>
                    </head>
                    <body>
                        <header>
                            <h1>Interactive Node Servers</h1>
                        </header>
                        <main>
                            <h1>${name}</h1>
                            <p>${metadata}</p>
                            <pre id="log">${data}</pre>
                            <form method="post" action="/execute-command">
                                <input type="hidden" name="serverName" value="${fileName}">
                                <button class="start" type="submit" name="action" value="start">Start Server</button>
                                <button class="restart" type="submit" name="action" value="restart">Restart Server</button>
                                <button class="stop" type="submit" name="action" value="stop">Stop Server</button>
                            </form>
                            <a href="/node-servers">Back to Server List</a>
                        </main>
                    </body>
                    </html>
                `;
                res.send(html);
            } catch (error) {
                console.error('Error generating server details HTML:', error.message);
                res.send('<p>An error occurred while generating the server details.</p>');
            }
        });
    };

    readLog();
});

app.get('/log/:serverName', (req, res) => {
    const fileName = req.params.serverName;
    const logPath = `logs/${fileName}.log`;

    // Read the log file
    fs.readFile(logPath, 'utf8', (err, data) => {
        if (err) {
            data = `Error reading log file: ${err.message}`;
        }

        res.send(data);
    });
});

// Check if the server is running (JSON response)
app.get('/is-server-running/:serverName', (req, res) => {
    const fileName = req.params.serverName;
    const isServerRunning = fs.existsSync(`logs/${fileName}.pid`);

    res.json({ isRunning: isServerRunning });
});

// Handle form submission for executing commands
app.post('/execute-command', express.urlencoded({ extended: true }), (req, res) => {
    const fileName = req.body.serverName;
    const action = req.body.action;

    let command = '';
    switch (action) {
        case 'start':
            command = `node ${fileName} > logs/${fileName}.log 2>&1 & echo $! > logs/${fileName}.pid`;
            break;
        case 'stop':
            command = `pkill -F logs/${fileName}.pid && rm -f logs/${fileName}.pid`;
            break;
        case 'restart':
            command = `pkill -F logs/${fileName}.pid && rm -f logs/${fileName}.pid && node ${fileName} > logs/${fileName}.log 2>&1 & echo $! > logs/${fileName}.pid`;
            break;
        default:
            break;
    }

    if (command) {
        executeCommand(command, (stdout, stderr) => {
            const redirectURL = `/node-server/${fileName}`;
            res.redirect(redirectURL);
        });
    } else {
        res.send('Invalid command.');
    }
});

app.listen(port, () => {
    console.log(`Interactive Node Servers app listening at http://localhost:${port}/node-servers`);
});
