# QuickChat - server side

Server side of chat room application, communicating via sockets with client side. Handles connecting clients, logging in and logging out as a user and sending messages to other logged in users.

### Features
-Validates data such as login attempts and sending messages from clients before responding
-Tests suite include tests of socket transmissions with mock clients
-Eslint and prettier to make the code better
-Logs using Winston

### Using the app
1. Run 'git clone https://github.com/viktorostlund/chat-app-server.git'.
2. Run 'npm install' to install project dependencies.
3. Run 'npm start' to start the application.
4. The server is now running locally on your computer. To see it working, you need to install and run the client side of the application, found here: https://github.com/viktorostlund/chat-app-client.

### Language
-Typescript

### Tech stack
-Node
-Sockets.io
-Winston logger
-Express

### Commands
-start - starts the app
-test - runs the test suite
-lint - runs eslint
-format - runs prettier

### Coming features
-Improved error handling
-Refactored code
