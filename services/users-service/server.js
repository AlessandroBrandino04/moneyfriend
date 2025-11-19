"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app_1 = __importDefault(require("./src/app"));
const port = process.env.PORT || 4000;
const server = app_1.default.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Users service listening on port ${port}`);
});
// Gestione dell'arresto del server (buona pratica per Docker)
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed.');
    });
});
