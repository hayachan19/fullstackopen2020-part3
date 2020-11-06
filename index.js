require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const Person = require('./models/person')

const app = express()
app.use(express.json())
app.use(express.static('build'))
app.use(cors())
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :content')) //expanded tiny format
morgan.token('content', function (req) {
    return JSON.stringify(req.body)
})

app.get('/api/persons', (request, response) => {
    Person.find({}).then(result => {
        response.json(result)
    })
})

app.get('/api/persons/:id', (request, response, next) => {
    Person.findById(request.params.id)
        .then(result => {
            if (result) { response.json(result) }
            else { response.status(404).end() }
        })
        .catch(error => next(error))
})

app.post('/api/persons', (request, response, next) => {
    const person = new Person({
        name: request.body.name,
        number: request.body.number,
    })

    person.save().then(result => {
        response.status(201).json(result)
    })
        .catch(error => next(error))
})

app.put('/api/persons/:id', (request, response, next) => {
    const person = {
        name: request.body.name,
        number: request.body.number,
    }

    Person.findByIdAndUpdate(request.params.id, person, { runValidators: true, context: 'query', new: true })
        .then(result => {
            response.json(result)
        })
        .catch(error => next(error))
})

app.delete('/api/persons/:id', (request, response, next) => {
    Person.findByIdAndRemove(request.params.id)
        .then(() => {
            response.status(204).end()
        })
        .catch(error => next(error))
})

app.get('/info', (request, response) => {
    Person.find({}).then(result => {
        response.send(`
    <p>Phonebook has info for ${result.length} people</p>
    <p>${new Date().toString()}</p>
    `)
    })
})

const invalidEndHandler = (request, response) => {
    response.status(404).send({ error: 'invalid endpoint' })
}
app.use(invalidEndHandler)

const errorHandler = (error, request, response, next) => {
    console.error(error.message)
    if (error.name === 'CastError') {
        return response.status(400).send({ error: 'malformed id' })
    }
    if (error.name === 'ValidationError') {
        return response.status(400).json({ error: error.message })
    }
    next(error)
}
app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})