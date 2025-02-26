import serve404 from '../util/serve-404.mjs';

/**
 * Decides which function will serve the input request.
 */
export default async (req, res) => {
    let result = serve404;

    return result;
};
