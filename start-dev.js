const { spawn } = require('child_process');

// Function to handle process errors and exits
function handleProcessError(process, name) {
    process.on('error', (error) => {
        console.error(`${name} failed to start:`, error);
    });

    process.on('close', (code) => {
        if (code !== 0) {
            console.log(`${name} process exited with code ${code}`);
        }
    });
}

// Start the React development server
const frontendProcess = spawn('npm', ['start'], {
    shell: true,
    stdio: 'inherit'
});

handleProcessError(frontendProcess, 'Frontend');

// Start the backend server
const backendProcess = spawn('node', ['server.js'], {
    shell: true,
    stdio: 'inherit'
});

handleProcessError(backendProcess, 'Backend');

// Cleanup function to kill both processes
function cleanup() {
    console.log('Cleaning up processes...');
    frontendProcess.kill();
    backendProcess.kill();
}

// Handle various termination signals
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);
