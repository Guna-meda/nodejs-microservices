const express = require('express')
const mongoose = require('mongoose')

const app = express()
const bodyParser = require('body-parser')
const port = 3001

app.use(bodyParser.json())

mongoose.connect('mongodb://mongo:27017/users')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB...', err))

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
})

const User = mongoose.model('User', userSchema)

app.post('/users', async (req, res) => {
    const { name, email } = req.body
    try {
        const user = new User({ name, email })
        await user.save()
        res.status(201).send(user)
    } catch (err) {
        console.error(err)
        res.status(500).send(err)
    }
})

app.get('/users' , async (req, res) => {
    const users =  await User.find()
    res.json(users)
})

app.get('/' , (req,res) => {
    res.send('User Service is running')
})

app.listen(port, () => {
    console.log(`User Service listening at http://localhost:${port}`)
})