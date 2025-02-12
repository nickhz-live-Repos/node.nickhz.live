// serves requests for the static site in the _public
import serve from '../util/serve-public-file.mjs';

export default async (req, res) => {
    await serve('/index.html', res);
};
