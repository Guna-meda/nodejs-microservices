const express = require('express')
const mongoose = require('mongoose')
const amqp = require('amqplib')

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

let channel, connection;

async function connectRabbitMQ(retryCount = 5 , delay = 5000) {
    while(retryCount > 0) {
        try {
            connection = await amqp.connect('amqp://rabbitmq')
            channel = await connection.createChannel()
            await channel.assertQueue('task_created')
            console.log('Connected to RabbitMQ')
            break
        } catch (error) {
            console.error('Failed to connect to RabbitMQ, retrying...', error)
            await new Promise(resolve => setTimeout(resolve, delay))
            retryCount--
            if (retryCount === 0) {
                throw new Error('Could not connect to RabbitMQ')
            }
        }
    }
}

app.post('/tasks', async (req, res) => {
    const { name, description, userId } = req.body
    try {
        const task = new Task({ name, description, userId })
        await task.save()
        const message = {taskId: task._id,userId, name}
        if(!channel) {
            return res.status(500).send('RabbitMQ channel is not established')
        }
        channel.sendToQueue('task_created', Buffer.from(JSON.stringify(message)))
        res.status(201).json(task)
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

app.listen(port, async () => {
    console.log(`Task Service listening at http://localhost:${port}`)
    try {
        await connectRabbitMQ()
        console.log('RabbitMQ ready for Task Service')
    } catch (err) {
        console.error(err)
        process.exit(1)
    }
})
