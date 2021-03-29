import { SpotifyStorage } from "./spotify";
import fs from 'fs';

class StorageData {
    spotify: SpotifyStorage = null;
}

export class StorageService {

    public data: StorageData;
    public path: string;

    constructor(path: string) {
        this.path = path;
    }


    public async init() {
        if (await this.exists())
            await this.load();
        else
            this.data = new StorageData();

        setInterval(() => this.save(), 10 * 1000 * 60);
    }

    public exists(): Promise<boolean> {
        return new Promise(
            (resolve, reject) => fs.stat(this.path, (err, stats) => {
                if (err)
                    resolve(false);
                else resolve(stats.isFile())
            })
        )
    }

    public load(): Promise<StorageData> {
        return new Promise(
            (resolve, reject) => fs.readFile(this.path, 'utf8', (err, data) => {
                if (err)
                    reject();
                else resolve(this.data = JSON.parse(data))
            })
        )
    }

    public save(): Promise<void> {
        return new Promise(
            (resolve, reject) => fs.writeFile(this.path, JSON.stringify(this.data), 'utf8', (err) => {
                if (err)
                    reject();
                else resolve()
            })
        )
    }

    public destroy(): Promise<void> {
        return new Promise(
            (resolve, reject) => fs.unlink(this.path, (err) => {
                if (err)
                    reject();
                else resolve()
            })
        )
    }
}
