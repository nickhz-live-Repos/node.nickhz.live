/**
 * Contains functions for converting the URL from an incoming HTTP request 
 * into more dynamically operable path & search parameter properties.
 */

const fallbackBaseUrl = 'http://a';

// https://www.example.com/abc/def?g=123&h=ijk#lmnop -> ['abc', 'def']
const getPath = (urlObject) => {
    let path = urlObject.pathname.split('/');

    if(path[0] === '') {
        path = path.slice(1);
    }
    if(path[path.length - 1] === '') {
        path = path.slice(0, path.length - 1);
    }
    for(let i = 0; i < path.length; i++) {
        path[i] = decodeURIComponent(path[i]);
    }

    return path;
};

// https://www.example.com/abc/def?g=123&h=ijk#lmnop -> URLSearchParams { 'g' => '123', 'h' => 'ijk' }
const getUrlSearchParameters = (urlObject) => {
    const urlParams = new URLSearchParams();
    const inputParams = urlObject.searchParams;

    for(const key of inputParams.keys()) {
        urlParams.set(decodeURIComponent(key), decodeURIComponent(inputParams.get(key)))
    }

    return inputParams;
};

/**
 * Inputs an IncomingMessage HTTP request and outputs an object detailing the 
 * route represented by that request, including itemized.filepath elements and 
 * URL parameters.
 */
export default (requestUrl) => {
    let parsedUrl;
    try {
        parsedUrl = new URL(requestUrl);
    } catch(e) {
        if(requestUrl[0] === '/') parsedUrl = new URL(fallbackBaseUrl + requestUrl);
        else parsedUrl = new URL(fallbackBaseUrl + '/' + requestUrl);
    }

    return {
        path: getPath(parsedUrl),
        params: getUrlSearchParameters(parsedUrl)
    };
};
