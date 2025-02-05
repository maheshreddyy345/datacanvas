const { spawn } = require('child_process');
const path = require('path');

// Start the backend server
const backend = spawn('node', ['server.js'], {
    stdio: 'inherit'
});

// Start the frontend development server
const frontend = spawn('npm', ['start'], {
    stdio: 'inherit'
});

// Handle process termination
process.on('SIGINT', () => {
    backend.kill();
    frontend.kill();
    process.exit();
});

backend.on('close', (code) => {
    console.log(`Backend server exited with code ${code}`);
    frontend.kill();
    process.exit(code);
});

frontend.on('close', (code) => {
    console.log(`Frontend server exited with code ${code}`);
    backend.kill();
    process.exit(code);
});
