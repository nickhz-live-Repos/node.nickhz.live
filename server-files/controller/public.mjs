// polls "_public" static-site files against the request url
// if the file exists, it writes to the response & the promise resolves true
// if the file doesn't exist, the promise resolves false
import serve from '../util/serve-public-file.mjs';
import {readFile} from 'node:fs/promises';
import {resolve, sep} from 'node:path';

const basePath = process.cwd() + sep + '_public';
const publicFiles = null;

const populatePublicFiles = async (path = basePath) => {
    let folderContents = await readdir(path);
}

export default async (req, res) => {
    if(publicFiles === null) {
        publicFiles = new Map();
        populatePublicFiles();
    }

    await serve('./origin/index.html', res);
};
