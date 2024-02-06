#!/bin/bash

# Define an array of Node.js server files
servers=("chat.js" "stream.js" "techord.js" "discord.js" "active-user.js" "pubslide.js")

# Start each server in the background
for server in "${servers[@]}"; do
    node "$server" > "logs/$server.log" 2>&1 &
done

# Wait for a short time to allow servers to start
sleep 2

# Read commands from stdin
while read -p "Enter command (start/restart/stop serverName, exit to quit): " command; do
    if [[ $command == "exit" ]]; then
        break
    fi

    # Parse the command
    IFS=' ' read -r action serverName <<< "$command"

    case $action in
        start)
            # Start the specified server
            node "$serverName" > "logs/$serverName.log" 2>&1 &
            ;;
        restart)
            # Restart the specified server
            pkill -f "$serverName"
            node "$serverName" > "logs/$serverName.log" 2>&1 &
            ;;
        stop)
            # Stop the specified server
            pkill -f "$serverName"
            ;;
        *)
            echo "Invalid command. Usage: start/restart/stop serverName"
            ;;
    esac
done

# Cleanup: Stop all background processes
pkill -f "node"

echo "Server.sh has exited."
