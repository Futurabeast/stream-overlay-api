import { Main } from '../index';
import { ChatUserstate, Client } from 'tmi.js'

interface TwitchCommand {
    command: string;
    callback: (channel: string, userstate: ChatUserstate, message: string, self: boolean) => void
}

export class TwitchBotService {

    public client: Client
    public main: Main;

    public commands: TwitchCommand[] = [];

    constructor(main: Main) {
        this.main = main;
    }

    init() {
        this.client = new Client({
            channels: ['futurabeast'],
            identity: {
                username: 'futurabeastBot',
                password: process.env.TWITCH_BOT_TOKEN
            }
        })

        this.client.on('message', this.onMessage.bind(this));
        this.client.on('connected', this.onConnected.bind(this));
        this.client.connect();

        this.commands.push({ command: 'playing', callback: this.playingCommand.bind(this) })
    }

    onConnected() {
        console.log('Bot connected!');
    }

    onMessage(channel: string, userstate: ChatUserstate, message: string, self: boolean) {
        if (self)
            return;
        message = message.trim();
        if (!message.startsWith('!'))
            return ;
        message = message.substring(1);
        const command = this.commands.find(({ command }) => command === message)
        if (!command)
            return;
        command.callback(channel, userstate, message, self)
    }

    say(message: string) {
        this.client.say('futurabeast', message);
    }

    playingCommand(channel: string, userstate: ChatUserstate, message: string, self: boolean) {
        const currentSong = this.main.spotifyService.currentSong;
        if (!currentSong) {
            this.say(`There is no current song.`)
            return;
        }
        this.main.socketIoService.io.emit('new_song', currentSong);
        this.say(`Curently Playing: ${currentSong.name} - ${currentSong.artists.join(', ')} `)
    }
}
