import {readFile} from 'node:fs/promises';
import {lookup} from 'mime-types';
import {readdir, stat} from 'node:fs/promises';

const publicPrefix  = './_public/';

// writes files from the "_public" static-files folder into the response body
export const serve = async (filePath, res) => {
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

// initializes the Map to be used to route incoming requests
export const initializeRouter = async (directory) => {
    const router = new Map();

    directory += directory[directory.length - 1] === '/' ? '' : '/';
    directory = publicPrefix + directory;

    const staticFilenames = getFileContents(directory);

    if(staticFilenames['index.html']) {
        router.set(true, (req, res) => serve(directory + 'index.html', res));
    }

    for(const filePath in staticFilenames) {
        router.set(filePath, (req, res) => serve(directory + filePath, res));
    }

    return router;
};
