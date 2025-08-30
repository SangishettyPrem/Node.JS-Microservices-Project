const amqp = require('amqplib');
const logger = require('./logger');

let channel, connection;

const EXCHANGE_NAME = "micro-service-exchange";

async function ConnectRabbitMQ(retries = 10, delay = 5000) {
    while (retries) {
        try {
            connection = await amqp.connect(process.env.RABBITMQ_URL);
            channel = await connection.createChannel();
            await channel.assertExchange(EXCHANGE_NAME, 'direct', { durable: true });
            console.log("✅ Connected to RabbitMQ");
            return;
        } catch (error) {
            retries -= 1;
            console.log(`❌ RabbitMQ connection failed. Retries left: ${retries}`);
            if (!retries) {
                logger.info("RabbitMQ connection failed permanently: ", error);
                throw error;
            }
            await new Promise(res => setTimeout(res, delay));
        }
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