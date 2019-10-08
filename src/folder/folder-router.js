const express = require('express')
const xss = require('xss')
const path = require('path')
const FoldersService = require('./folders-service')

const folderRouter = express.Router()
const bodyParser = express.json()

const serializeFolder = folder => ({
    id: folder.id,
    name: xss(folder.name)
})

folderRouter
    .route('/')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        FoldersService.getAllFolders(knexInstance)
            .then(folders => {
                res.json(folders.map(serializeFolder))
            })
            .catch(next)
    })
    .post(bodyParser, (req, res, next) => {
        const { id, name } = req.body
        const newFolder = { id, name }

        for (const [key, value] of Object.entries(newFolder)) {
            if (value == null) {
                return res.status(400).json({
                    error: { message: `Missing '${key}' in request body`}
                })
            }
        }

        FoldersService.insertFolder(
            req.app.get('db'),
            newFolder
        )

        .then(folder => {
            res
                .status(201)
                .location(path.posix.join(req.originalUrl, `/${folder.id}`))
                .json(serializeFolder(folder))
            })
        .catch(next)
        })

folderRouter
    .route('/:folder_id')
    .all((req, res, next) => {
        FoldersService.getById(
            req.app.get('db'),
            req.params.folder_id
        )
            .then(folder => {
                if(!folder) {
                    return res.status(404).json({
                        error: { message: `Folder doesn't exist`}
                    })
                }
                res.folder = folder
                next()
            })
            .catch(next)
    })
    .get((req, res, next) => {
        res.json(serializeFolder(res.folder))
    })
    .delete((req, res, next) => {
        FoldersService.deleteFolder(
            req.app.get('db'),
            req.params.folder_id
        )
        .then(numRowsAffected => {
            res
                .send(`Deleted`)
                .status(204)
                .end()
        })
        .catch(next)
    })

module.exports = folderRouter