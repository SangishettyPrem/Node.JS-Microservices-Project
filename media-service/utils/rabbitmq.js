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

async function ConsumeEvent(routingKey, callback) {
    try {
        if (!channel) {
            await ConnectRabbitMQ();
        }
        const q = await channel.assertQueue("", { exclusive: true });
        await channel.bindQueue(q.queue, EXCHANGE_NAME, routingKey);
        channel.consume(q.queue, (msg) => {
            if (msg !== null) {
                const content = JSON.parse(msg.content.toString());
                callback(content);
                channel.ack(msg);
            }
        });
        logger.info(`Event Consumed: Key ${routingKey}`);
    } catch (error) {
        logger.info(`Error while Consuming Event: Key ${routingKey} " " ${error}`);
        throw error;
    }
}


module.exports = {
    ConnectRabbitMQ,
    PublishEvent,
    ConsumeEvent
}