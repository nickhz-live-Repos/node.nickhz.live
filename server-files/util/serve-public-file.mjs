// writes files from the "_public" static-files folder into the response body
// essentially a static-site interface
import {readFile} from 'node:fs/promises';
import {lookup} from 'mime-types';

const publicPrefix  = './_public/';

export default async (filePath, res) => {
    if(filePath[0] === '/') {
        filePath = filePath.slice(1);
    }

    // must ensure file reads content before serving a 200 response
    const fileContent = await readFile(publicPrefix + filePath);

    res.writeHead(200, {'Content-Type': lookup(filePath)});
    res.write(fileContent);
};
