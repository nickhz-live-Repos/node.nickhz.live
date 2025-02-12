// writes files from the "_public" static-files folder into the response body
// essentially a static-site interface
import {readFile} from 'node:fs/promises';
import {lookup} from 'mime-types';

const publicPrefix  = './_public/';

export default async (filePath, res) => {
    res.writeHead(200, {'Content-Type': lookup(filePath)});
    res.write(await readFile(publicPrefix + filePath));
};
