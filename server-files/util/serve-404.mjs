// serves a 404 (Not Found) page

const pageContentOf = req => `
<!DOCTYPE html>

<html>
    <head>
        <link rel="shortcut icon" type="image/x-icon" href="./img/nh-cursive-node-icon.png" />
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1" />
        
        <style>
            body {
                background-color: black;
                color: lime;
            }
        </style>
    </head>
    <body>
        <hgroup>
            <h1>
                404 not found.
            </h1>
            <h4>
                The requested URL path was: ${req.url}
            </h4>
        </hgroup>
    </body>
</html>
`;

export default (req, res) => {
    res.writeHead(404, {'Content-Type': 'text/html'});
    res.write(pageContentOf(req));
};
