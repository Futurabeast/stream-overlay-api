import socketio, { Server } from "socket.io";
import { Main } from '../index'

export class SocketIoService {

    public io: Server;

    init(main: Main) {
        this.io = socketio(main.http);
        this.io.on('connection', (socket) => {
            console.log('connected');
        })
    }

}
