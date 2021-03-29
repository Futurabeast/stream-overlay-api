import { SocketIoService } from "./services/socketio";
import express, { Express } from "express";
import { config } from 'dotenv-flow';
import { SpotifyService } from "./services/spotify";
import { StorageService } from "./services/storage";
import { TwitchBotService } from "./services/twitchbot";

config();

const {
    PORT,
    SPOTIFY_CLIENT_ID,
    SPOTIFY_CLIENT_SECRET,
    SPOTIFY_REDIRECT_URL,
    TWITCH_BOT_TOKEN
} = process.env;

export class Main {
    
    public socketIoService: SocketIoService;
    public spotifyService: SpotifyService
    public twitchBotService: TwitchBotService;
    public express: Express;
    public store: StorageService;
    public http: any;
    
    Main() {}
    
    async init() {
        this.express = express();
        this.http = require('http').Server(this.express);
        this.store = new StorageService('data/storage.json');
        await this.store.init();
        
        this.spotifyService = new SpotifyService();
        this.spotifyService.init(this);

        this.twitchBotService = new TwitchBotService(this);
        this.twitchBotService.init();


        this.socketIoService = new SocketIoService();
        this.socketIoService.init(this);
        
        console.log('init')
        
        this.http.listen(PORT, () => {
            console.log(`Server running on ${PORT}`);
        })
    }
    
}


new Main().init();
export { PORT, SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REDIRECT_URL, TWITCH_BOT_TOKEN };
