// CDN Server
const express = require('express');
const app = express();
const cfg = require('./data/config.json');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const path = require('path');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const mime = require('mime-types');

// Get content base dir - this is the root for all CDN resources
const CONTENT_BASE_DIR = path.resolve(cfg.paths.contentBase);

// Map static content to appropriate folder
app.use("/", express.static(CONTENT_BASE_DIR));

// Register some middleware
app.use(fileUpload({
    createParentPath: true,
    limits: {
        fileSize: 1024 * 1024 * 50, // 50 Megabyte hard limit
        files: 5 // Only 5 files at a time
    }
}));
app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan('dev'));

app.post("/upload", async (req, res) => {
    // Check if repository is specified
    if((!req.body) || (typeof req.body.repository !== 'string')) {
        res.status(400);
        res.end(JSON.stringify({
            code: 1002,
            message: "Invalid arguments. An upload repository must be specified."
        }));
        return;
    }

    // Check if repo exists
    /** @type {String} */
    const repoName = req.body.repository;
    const repoObj = cfg.resourceRepositories.find(x => x.name == repoName);

    if(!repoObj) {
        res.status(400);
        res.end(JSON.stringify({
            code: 1003,
            message: "Invalid repository specified."
        }));

        return;
    }

    // Check if we have files
    if(!req.files) {
        res.status(400);
        res.end(JSON.stringify({
            code: 1001,
            message: "No files were specified for upload."
        }));
        return;
    }

    // Check if number of files exceeds limit
    if(req.files.length > repoObj.limits.noFiles) {
        res.status(400);
        res.end(JSON.stringify({
            code: 1006,
            message: "Too many files."
        }));
        return;
    }

    // Process each file
    for(let fileObj of req.files) {
        // Check file size
        if(fileObj.size > repoObj.limits.sizeMax) {
            res.status(400);
            res.end(JSON.stringify({
                code: 1005,
                message: "File is too big."
            }));
            return;
        }

        // Check file type
        if(repoObj.acceptedTypes !== "*") {
            for(let rType of repoObj.acceptedTypes) {
                if(fileObj.mimetype !== rType) {
                    res.status(400);
                    res.end(JSON.stringify({
                        code: 1004,
                        message: "Mimetype is not allowed for the specified repository."
                    }));
                    return;
                }
            }
        }

        // Move file into place
        // TODO generate file ID
        const targetFileName = fileObj.md5 + mime.extension(fileObj.mimetype);
        fileObj.mv(path.join(CONTENT_BASE_DIR, repoName, targetFileName));


    }
});

/**
 * Program entry point.
 */
async function main() {
    // Create the appropriate dirs
    for(let repoObj of cfg.resourceRepositories) {
        const rPath = path.join(CONTENT_BASE_DIR, repoObj.name);

        if(!fs.existsSync(rPath))
            fs.mkdirSync(rPath);
    }

    // Start HTTP server
    app.listen(cfg.http.port, async () => {
        console.log(`DiscDoor CDN service available at :${cfg.http.port}`);
    });  
}

main();