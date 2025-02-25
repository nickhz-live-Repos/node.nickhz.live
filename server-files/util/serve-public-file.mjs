import {readFile} from 'node:fs/promises';
import {lookup} from 'mime-types';
import {readdir, stat} from 'node:fs/promises';
import serve503 from './serve-503.mjs';

const publicPrefix  = './_public/';

/**
 * Writes files from the "_public" static-files folder into the response body.
 * 
 * @param {string} filePath 
 * @param {ServerResponse} res 
 */
export const servePublicFile = async (filePath, res) => {
    if(filePath[0] === '/') {
        filePath = filePath.slice(1);
    }

    // must ensure file reads content before serving a 200 response
    const fileContent = await readFile(publicPrefix + filePath);

    res.writeHead(200, {'Content-Type': lookup(filePath)});
    res.write(fileContent);
};

// finds which files exist under the given directory path
const getFileContents = async (directory) => {
    const contents = await readdir(directory);
    const result = Object.create(null);

    for(const item of contents) {
        const itemHandle = await stat(directory + item);

        if(itemHandle.isFile()) {
            result[item] = true;
        }
    }

    return result;
};

/**
 * Initializes the Map that a path (denoted by the input directory) uses to 
 * route incoming requests, by assigning the corresponding file under the 
 * "_public" directory to be served by its corresponding URL.
 * 
 * For instance, if the path "abc/123" is the input & there are files under 
 * the "_public/abc/123/" folder, routes will be constructed to statically 
 * serve the corresponding files under that folder. If there is a file 
 * "_public/abc/123/img.png," then this will assign a route "/abc/123/img.png" 
 * that serves this file.
 * 
 * If there is an "index.html" file under this directory, its 
 * serve function will be mapped to the boolean true value.
 * 
 * Anything other than a file (for instance, a directory) will be ignored 
 * in the resulting router. Any subdirectories must be mapped by re-calling 
 * this function or by mapping via a recursive function.
 * 
 * @param {string} inputDirectory 
 * @returns A Map whose keys are routes directly under the given directory and 
 * whose values are functions that statically serve the files under those 
 * routes.
 */
export const initializeRouter = async (inputDirectory) => {
    const router = new Map();

    // the path to check for static files to serve
    let pathToCheck = inputDirectory + (inputDirectory[inputDirectory.length - 1] === '/' ? '' : '/');
    if(pathToCheck[0] === '/') {
        pathToCheck = pathToCheck.slice(1);
    }
    pathToCheck = publicPrefix + pathToCheck;

    // an object holding names of all the static files in the specified public directory
    const staticFilenames = await getFileContents(pathToCheck);

    if(staticFilenames['index.html']) {
        router.set(true, async (req, res) => await servePublicFile(inputDirectory + 'index.html', res));
    }

    for(const filePath in staticFilenames) {
        router.set(filePath, async (req, res) => await servePublicFile(inputDirectory + filePath, res));
    }

    return router;
};



// provides a router for before the routes are done initializing
const makeUninitializedRouter = () => {
    const uninitializedRouter = new Map();

    uninitializedRouter.set(true, (req, res) => serve503(req, res));

    return uninitializedRouter;
}

/**
 * A router Map for when the Promise that populates the route hasn't resolved. 
 */
export const uninitializedRouter = makeUninitializedRouter();
