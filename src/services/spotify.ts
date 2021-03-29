import SpotifyWebApi from 'spotify-web-api-node'
import { SPOTIFY_REDIRECT_URL, SPOTIFY_CLIENT_ID, Main, SPOTIFY_CLIENT_SECRET } from '../index';

export interface SpotifyStorage {
    access_token: string;
    refresh_token: string;
}

export interface PlayingSong {
    id: string;
    name: string;
    artists: string[]
    album: string
    cover: string
}

export class SpotifyService {

    public spotifyApi: SpotifyWebApi;
    public currentSong: PlayingSong = null;
    public main: Main;

    init(main: Main) {
        this.main = main;
        this.spotifyApi = new SpotifyWebApi({
            redirectUri: SPOTIFY_REDIRECT_URL,
            clientId: SPOTIFY_CLIENT_ID,
            clientSecret: SPOTIFY_CLIENT_SECRET,
        });
        
        this.spotifyApi.setAccessToken(this.main.store.data.spotify.access_token)
        this.refreshTokens().then((result) => {
            if (result)
                this.startUpdate();
            else {
                console.log('Invalid Refresh token!, please click on the link');
                this.getAuthorizationUrl();        
                this.watchRedirectUrl(main);
            }
        })
       
    }

    startUpdate() {
        setInterval(() => this.update(), 1000)
    }

    update() {
        this.spotifyApi.getMyCurrentPlaybackState()
            .then(async ({ body }) => {
                const { is_playing, item } = body || {};
                if (is_playing && item) {
                    const { id, name } = item;
                    const { body: { artists, album: { name: album, images: [{ url: cover }] } } } = await this.spotifyApi.getTrack(id);
                    const currentSong = { 
                        id, 
                        name, 
                        artists: artists.map(({ name }) => name), 
                        album, 
                        cover 
                    }

                    if (!this.currentSong ||  this.currentSong.id != currentSong.id) {
                        this.currentSong = currentSong;
                        this.currentSongChanged();
                    }

                }
            }, function(err) {
                console.log('Something went wrong!', err);
            });
    }

    currentSongChanged() {
        this.main.socketIoService.io.emit('new_song', this.currentSong);
    }

    getAuthorizationUrl() {
        const authorizeURL = this.spotifyApi.createAuthorizeURL(['user-read-private', 'user-read-playback-state'], 'COUCOU');
        console.log('Authorization URL --> ', authorizeURL);
    }

    async refreshTokens(): Promise<boolean> {
        console.log('refresh spotify tokens');
        if (!this.main.store.data.spotify || !this.main.store.data.spotify.refresh_token)
            return false;
        this.spotifyApi.setRefreshToken(this.main.store.data.spotify.refresh_token)
        const { body: { access_token, expires_in }, statusCode } = await this.spotifyApi.refreshAccessToken();
        if (statusCode !== 200)
            return false;
        setTimeout(() => this.refreshTokens(), 60000);
        this.main.store.data.spotify.access_token = access_token;
        this.spotifyApi.setAccessToken(access_token)
        this.main.store.save();
        return true;
    }

    watchRedirectUrl(main: Main) {
        main.express.get('/spotify', async (req, res) => {
            console.log(req.query);
            const { code } = req.query;
            this.spotifyApi.authorizationCodeGrant(code as string, (error, response) => {
                if (error) {
                    throw error;
                }
                this.spotifyApi.setAccessToken(response.body['access_token']);
                this.spotifyApi.setRefreshToken(response.body['refresh_token']);
                this.main.store.data.spotify = { access_token: response.body['access_token'], refresh_token: response.body['refresh_token'] };
                this.main.store.save();
                this.startUpdate();
            })
            res.status(200).send('ok')
        })
    }

}
