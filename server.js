import http from 'http';
import cluster from 'cluster';
import os from 'os';
import dotenv from 'dotenv';
import { app } from "./app.js";
dotenv.config();

const PORT = process.env.PORT
const NODE_ENV = process.env.NODE_ENV
const server = http.createServer(app);
const totalCpus = os.cpus().length;


// Listening to ports
server.listen(PORT, () => {
    if (NODE_ENV !== 'pro') {
        console.log(`Server listening at http://localhost:${PORT}`);
    } else {
        console.log('Server is running in production mode');
    }
});


//Cluster logic (deploying on render that's why not using it right now)
// if (cluster.isPrimary) {
//     console.log('Forking...');
//     for (let i = 0; i < totalCpus; i++) {
//         cluster.fork();
//     }
//     console.log('Forking complete!');
// } else {
//     //Listening to ports
//     server.listen(PORT, () => {
//         if (NODE_ENV !== 'pro') {
//             console.log(`Server listening at http://localhost:${PORT}`);
//         } else {
//             console.log('Server is running in production mode');
//         }
//     });
// }