const amqp = require('amqplib');
const logger = require('./logger');

let channel, connection;

const EXCHANGE_NAME = "micro-service-exchange";

async function ConnectRabbitMQ() {
    try {
        connection = await amqp.connect(process.env.RABBIT_MQ_URL);
        channel = await connection.createChannel();
        await channel.assertExchange(EXCHANGE_NAME, 'direct', { durable: true });
        console.log("Connected to RabbitMQ");
    } catch (error) {
        logger.info("Error while Connecting RabbitMQ: ", error);
    }
}

async function PublishEvent(routingKey, data) {
    try {
        if (!channel) {
            await ConnectRabbitMQ();
        }

        channel.publish(
            EXCHANGE_NAME,
            routingKey,
            Buffer.from(JSON.stringify(data))
        )
        logger.info("Event Published: ", routingKey);
    } catch (error) {
        logger.info("Error while Publishing Event: ", error);
        throw error;
    }
}


module.exports = {
    ConnectRabbitMQ,
    PublishEvent
}