const express = require('express');
const fs = require('fs');
const childProcess = require('child_process');

const app = express();
const port = 5501;

// Define an array of Node.js server files
const servers = ["chat.js", "stream.js", "techord.js", "discord.js", "active-user.js", "pubslide.js"];

// Function to execute shell commands
function executeCommand(command, callback) {
    childProcess.exec(command, (error, stdout, stderr) => {
        callback(stdout, stderr);
    });
}

// HTML template for the server list
function getServerListHTML() {
    const serverLinks = servers.map(server => `<a class="server-link" href="/node-server/${server}">${server}</a>`).join(' | ');

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
}

// Display the server list
app.get('/node-servers', (req, res) => {
    const serverListHTML = getServerListHTML();
    res.send(serverListHTML);
});

// Display server details and controls
app.get('/node-server/:serverName', (req, res) => {
    const serverName = req.params.serverName;
    const logPath = `logs/${serverName}.log`;

    // Read the log file
    const readLog = () => {
        fs.readFile(logPath, 'utf8', (err, data) => {
            if (err) {
                data = `Error reading log file: ${err.message}`;
            }

            // Check if the server is running
            const isServerRunning = fs.existsSync(`logs/${serverName}.pid`);

            // HTML template for server details and controls
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
                        background-color: #5cb85c;
                        color: white;
                    }
            
                    button.restart, button.stop {
                        background-color: #d9534f;
                        color: white;
                    }
            
                    a {
                        text-decoration: none;
                        color: #337ab7;
                        margin-top: 1em;
                        padding: 0.5em 1em;
                        border-radius: 5px;
                        background-color: #337ab7;
                        transition: background-color 0.3s;
                    }
            
                    a:hover {
                        background-color: #23527c;
                    }
                </style>
                <script>
                    function updateLog() {
                        fetch('/log/${serverName}')
                            .then(response => response.text())
                            .then(data => {
                                document.getElementById('log').textContent = data;
                                setTimeout(updateLog, 1000); // Fetch log every 1 second
                            })
                            .catch(error => {
                                console.error('Error fetching log:', error);
                            });
                    }
                    updateLog();
                </script>
            </head>
            <body>
                <header>
                    <h1>Interactive Node Servers</h1>
                </header>
                <main>
                    <h1>${serverName}</h1>
                    <pre id="log">${data}</pre>
                    <form method="post" action="/execute-command">
                        <input type="hidden" name="serverName" value="${serverName}">
                        ${isServerRunning ? '<button class="restart" type="submit" name="action" value="restart">Restart Server</button>' : '<button class="start" type="submit" name="action" value="start">Start Server</button>'}
                        ${isServerRunning ? '<button class="stop" type="submit" name="action" value="stop">Stop Server</button>' : ''}
                    </form>
                    <a href="/node-servers">Back to Server List</a>
                </main>
            </body>
            </html>            
          `;

            res.send(html);
        });
    };

    readLog();
});

app.get('/log/:serverName', (req, res) => {
    const serverName = req.params.serverName;
    const logPath = `logs/${serverName}.log`;

    // Read the log file
    fs.readFile(logPath, 'utf8', (err, data) => {
        if (err) {
            data = `Error reading log file: ${err.message}`;
        }

        res.send(data);
    });
});

// Handle form submission for executing commands
app.post('/execute-command', express.urlencoded({ extended: true }), (req, res) => {
    const serverName = req.body.serverName;
    const action = req.body.action;

    let command = '';
    switch (action) {
        case 'start':
            command = `node ${serverName} > logs/${serverName}.log 2>&1 & echo $! > logs/${serverName}.pid`;
            break;
        case 'restart':
            command = `pkill -f "${serverName}" && node ${serverName} > logs/${serverName}.log 2>&1 & echo $! > logs/${serverName}.pid`;
            break;
        case 'stop':
            command = `pkill -F logs/${serverName}.pid && rm -f logs/${serverName}.pid`;
            break;
        default:
            break;
    }

    if (command) {
        executeCommand(command, (stdout, stderr) => {
            const redirectURL = `/node-server/${serverName}`;
            res.redirect(redirectURL);
        });
    } else {
        res.send('Invalid command.');
    }
});

app.listen(port, () => {
    console.log(`Interactive Node Servers app listening at http://localhost:${port}/node-servers`);
});
