// Check if service workers are supported
if ('serviceWorker' in navigator) {
    // Wait for the page to load
    window.addEventListener('load', () => {
        // Register the service worker
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('Service Worker registered successfully:', registration.scope);
            })
            .catch(error => {
                console.error('Service Worker registration failed:', error);
            });
    });
} else {
    console.log('Service Workers are not supported in this browser.');
}