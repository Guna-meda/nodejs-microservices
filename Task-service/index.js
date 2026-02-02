const express = require('express')
const mongoose = require('mongoose')

const app = express()
const bodyParser = require('body-parser')
const port = 3002

app.use(bodyParser.json())

mongoose.connect('mongodb://mongo:27017/tasks')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB...', err))

const taskSchema = new mongoose.Schema({
    name: String,
    description: String,
    userId: String,
})

const Task = mongoose.model('Task', taskSchema)

app.post('/tasks', async (req, res) => {
    const { name, description, userId } = req.body
    try {
        const task = new Task({ name, description, userId })
        await task.save()
        res.status(201).send(task)
    } catch (err) {
        console.error(err)
        res.status(500).send(err)
    }
})

app.get('/tasks' , async (req, res) => {
    const tasks =  await Task.find()
    res.json(tasks)
})

app.get('/' , (req,res) => {
    res.send('Task Service is running')
})

app.listen(port, () => {
    console.log(`Task Service listening at http://localhost:${port}`)
})