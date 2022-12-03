// CDN Server
const express = require('express');
const app = express();
const cfg = require('./data/config.json');
const fs = require('fs');
const path = require('path');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const mime = require('mime');
const uuid = require('uuid');
const cors = require('cors');
const libdd = require('libdd-node');
const { constructResponseObject, sendResponseObject } = libdd.api;
const { validateSchema } = libdd.schema;
const multer = require('multer');

// Get content base dir - this is the root for all CDN resources
const CONTENT_BASE_DIR = path.resolve(cfg.paths.contentBase);

app.use(cors({
    origin: cfg.http.client_url
}));

// Map static content to appropriate folder
app.use("/", express.static(CONTENT_BASE_DIR));

app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan('dev'));

/**
 * Pre file upload checking middleware.
 */
const preUploadCheckMiddleware = (req, res, next) => {
    if(req.hostname !== cfg.http.restrict_hostname)
        return sendResponseObject(res, 403, constructResponseObject(false, "Access denied"));

    // Validate body
    try {
        // Check types
        validateSchema({
            repository: { type: "string" },
        }, req.params);
    } catch(e) {
        sendResponseObject(res, 400, constructResponseObject(false, e.message || ""));
    }

    // Check if repo exists
    /** @type {String} */
    const repoName = req.params.repository;
    const repoObj = cfg.resourceRepositories.find(x => x.name == repoName);

    if(!repoObj)
        return sendResponseObject(res, 400, constructResponseObject(false, "Invalid repository specified."));

    // Prep target files array
    req.targetFiles = [];
    req.repoName = req.params.repository;
    req.repoObj = repoObj;
    next();
}

// Create multer and storage handler
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if(!req.params.repository)
            return cb(new Error("Invalid repository"));

        cb(null, `./content/${req.params.repository}`);
    },
    filename: (req, file, cb) => {
        const ext = mime.getExtension(file.mimetype);
        const targetFileName = uuid.v4() + ((ext != null) ? `.${ext}` : "");

        // check file mime
        if(req.repoObj.acceptedTypes !== "*")
            if(!req.repoObj.acceptedTypes.includes(file.mimetype))
                return cb(new Error("Mimetype is not allowed for the specified repository."));

        // check file size
        if(file.size > req.repoObj.limits.sizeMax)
            return cb(new Error("File is too big."));

        cb(null, targetFileName);

        req.targetFiles.push({
            name: targetFileName,
            repository: req.params.repository
        });
    }
});

// Create uploading interface
const upload = multer({
    storage,
    limits: {
        fileSize: 1024 * 1024 * 50, // 50 Megabyte hard limit
        files: 5 // Only 5 files at a time
    }
});

/*
Uploads a file to the specified repository.
*/
app.post("/upload/:repository", preUploadCheckMiddleware,
(req, res, next) => {
    upload.array("file", req.repoObj.limits.noFiles)(req, res, next);
},
async (req, res) => {
    try {
        /** @type {String} */
        const repoName = req.params.repository;
        const repoObj = cfg.resourceRepositories.find(x => x.name == repoName);

        if(!req.files)
            return sendResponseObject(res, 400, constructResponseObject(false, "No files were specified for upload."));

        return sendResponseObject(res, 200, constructResponseObject(true, "", req.targetFiles));
    } catch(e) {
        return sendResponseObject(res, 500, constructResponseObject(false, e.message || ""));
    }
});

/** 
 * Error middleware.
 */
app.use((error, req, res, next) => {
    if(error) 
        sendResponseObject(res, 400, constructResponseObject(false, error.message || ""));
});

/**
 * Program entry point.
 */
async function main() {
    // Create the appropriate dirs
    for(let repoObj of cfg.resourceRepositories) {
        const rPath = path.join(CONTENT_BASE_DIR, repoObj.name);

        if(!fs.existsSync(rPath))
            fs.mkdirSync(rPath, { recursive: true });
    }

    // Start HTTP server
    app.listen(cfg.http.port, async () => {
        console.log(`DiscDoor CDN service available at :${cfg.http.port}`);
    });  
}

main();