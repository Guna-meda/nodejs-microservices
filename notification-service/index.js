const amqp = require('amqplib')

let connection
let channel

async function start() {
  try {
    connection = await amqp.connect('amqp://rabbitmq')
    channel = await connection.createChannel()

    await channel.assertQueue('task_created', { durable: true })

    console.log('📢 Notification Service connected to RabbitMQ')

    channel.consume('task_created', msg => {
      if (!msg) return

      const taskData = JSON.parse(msg.content.toString())
      console.log(
        `✅ Task Created | Task ID: ${taskData.taskId}, User ID: ${taskData.userId}, Name: ${taskData.name}`
      )

      channel.ack(msg)
    })

  } catch (error) {
    console.error('❌ Failed to connect to RabbitMQ', error)
    process.exit(1)
  }
}

// 🔥 IMPORTANT — start the service
start()

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down Notification Service...')
  await channel?.close()
  await connection?.close()
  process.exit(0)
})
