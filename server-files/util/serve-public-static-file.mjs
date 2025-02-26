/**
 * Contains functions for identifying & retrieving static files that 
 * correspond to the given file paths relative to the server's "_public" 
 * folder.
 * 
 * This allows the contents of the "_public" folder to operate as a static 
 * site, while dynamic functionality can be built to supplement this static 
 * framework.
 */

import {readFile} from 'node:fs/promises';
import {lookup} from 'mime-types';
import {readdir, stat} from 'node:fs/promises';

const publicPrefix  = './_public/';

/**
 * Writes a file from the "_public" static-files folder into the response 
 * body.
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

const doGetStaticRouter = async (directory, staticRouter) => {
    directory += '/';

    const contents = await readdir(directory);
    const urlBasePath = directory.slice(publicPrefix.length);

    // items from the folder
    for(const item of contents) {
        const itemHandle = await stat(directory + item);

        if(itemHandle.isFile()) {
            staticRouter.set(urlBasePath + item, async (req, res) => await servePublicFile(urlBasePath + item, res));

            // if the current directory has an index.html, serve that whenever the directory is navigated to
            if(item === 'index.html') {
                staticRouter.set(urlBasePath, staticRouter.get(urlBasePath + item));
            }
        } else if(itemHandle.isDirectory()) {
            doGetStaticRouter(directory + item, staticRouter);
        }
    }

    return staticRouter;
};

let staticRouter = null;
/**
 * Gets a Map that has all static routes under the _public folder as its 
 * keys. Each key corresponds to a function that takes in a request & response 
 * and writes the file corresponding to that route into the response's body.
 * 
 * The Map returned is a singleton that may be retrieved by re-calling this 
 * function, and the singleton may be refreshed by calling the 
 * refreshStaticRouter function.
 * 
 * @returns A Map whose keys are routes under the public directory and whose 
 * values are functions that statically serve the files under those routes.
 */
export const getStaticRouter = async () => {
    if(staticRouter === null) {
        staticRouter = await doGetStaticRouter(publicPrefix.slice(0, publicPrefix.length - 1), new Map());
    } else {
        return staticRouter;
    }
};

/**
 * Gets a newly constructed Map that has all static routes CURRENTLY under the 
 * _public folder as its keys. Each key corresponds to a function that takes 
 * in a request & response and writes the file corresponding to that route 
 * into the response's body.
 * 
 * @returns A Map whose keys are routes under the public directory and whose 
 * values are functions that statically serve the files under those routes.
 */
export const refreshStaticRouter = async () => {
    staticRouter = await doGetStaticRouter(publicPrefix.slice(0, publicPrefix.length - 1), new Map());

    return staticRouter;
};
