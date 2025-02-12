// polls "_public" static-site files against the request url

import serve from '../util/serve-public-file.mjs';
import {readdir, stat} from 'node:fs/promises';
import serve404 from '../util/serve-404.mjs';

const basePath = './_public';
let publicPaths = null;
let publicPathsPopulated = false;

// populates static paths based on the contents of the "_public" folder
const doPopulate = async (directory) => {
    directory += '/';

    const contents = await readdir(directory);
    const urlBasePath = directory.slice(basePath.length);

    for(const item of contents) {
        const itemHandle = await stat(directory + item);

        if(itemHandle.isFile()) {
            publicPaths.set(urlBasePath + item, async res => await serve(urlBasePath + item, res));
        } else if(itemHandle.isDirectory()) {
            try {
                // check if the index exists, and map it if it does
                const indexPath = directory + item + '/index.html';
                await stat(indexPath);

                const serveIndex = async res => await serve(urlBasePath + item + '/index.html', res);
                publicPaths.set(urlBasePath + item, serveIndex);
                publicPaths.set(urlBasePath + item + '/', serveIndex);
                publicPaths.set(urlBasePath + item + '/index.html', serveIndex);
            } catch (e) {
                if(e.code !== 'ENOENT') {
                    throw e;
                }
            }

            doPopulate(directory + item);
        }
    }
};

const populatePublicPaths = async () => {
    publicPaths = new Map();

    const serveOriginPath = async res => await serve('index.html', res);

    publicPaths.set('/', serveOriginPath);
    publicPaths.set('/index.html', serveOriginPath);

    await doPopulate(basePath);
}

// if the file exists, it writes to the response & the promise resolves true
// if the file doesn't exist, the promise resolves false
// serve 404 if public paths are still populating...
export default async (req, res) => {
    let cleanUrl = req.url.includes('#') ? req.url.slice(0, req.url.indexOf('#')) : req.url;
    cleanUrl = cleanUrl.includes('?') ? cleanUrl.slice(0, cleanUrl.indexOf('?')) : cleanUrl;

    if(!publicPathsPopulated) {
        serve404(req, res)
        return true;
    } else if(!publicPaths.has(cleanUrl)) {
        return false;
    }

    await publicPaths.get(cleanUrl)(res);

    return true;
};

populatePublicPaths()
    .then(() => {publicPathsPopulated = true})
;
