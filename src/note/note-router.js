const express = require('express')
const path = require('path')
const xss = require('xss')
const logger = require('../logger')
const NotesService = require('./notes-service')

const noteRouter = express.Router()
const bodyParser = express.json()

const serializeNote = note => ({
    id: note.id,
    name: xss(note.name),
    content: xss(note.content),
    folder: note.folder,
    modified: note.modified
})

noteRouter
    .route('/')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        NotesService.getAllNotes(knexInstance)
            .then(notes => {
                res.json(notes.map(serializeNote))
            })
            .catch(next)
    })
    .post(bodyParser, (req, res, next) => {
        const { id, name, content, folder } = req.body;
        const newNote = { id, name, content, folder}

        for (const [key, value] of Object.entries(newNote)) {
            if (value == null) {
              return res.status(400).json({
                error: { message: `Missing '${key}' in request body` }
              })
            }
          }

        NotesService.insertNote(
            req.app.get('db'),
            newNote
        )
        .then(note => {
            res
                .status(201)
                .location(path.posix.join(req.originalUrl, `/${note.id}`))
                .json(serializeNote(note))
        })
        .catch(next)
    })

noteRouter
    .route('/:note_id')
    .all((req, res, next) => {
        NotesService.getById(
            req.app.get('db'),
            req.params.note_id
        )
        .then(note => {
            if(!note) {
                return res.status(404).json({
                    error: { message: `Note doesn't exist` }
                })
            }
        res.note = note
        next()
        })
        .catch(next)
    })
    .get((req, res, next) => {
        res.json(serializeNote(res.note))
    })
    .delete((req, res, next) => {
        NotesService.deleteNote(
            req.app.get('db'),
            req.params.note_id
        )
        .then(numRowsAffected => {
            res.status(204).end()
        })
        .catch(next)
        res.send(`Deleted`)
    })

module.exports = noteRouter