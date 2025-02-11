// serves requests to the domain's origin
import {readFile} from 'node:fs/promises';
import serve from '../my-custom-modules/serve-static-file.mjs';

export default async (req, res) => {
    await serve('./origin/index.html', res);
};
