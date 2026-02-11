FROM eclipse-temurin:21-jdk

WORKDIR /app

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

RUN curl -L -o debezium-server-dist.jar \
  https://repo1.maven.org/maven2/io/debezium/debezium-server-dist/2.5.4.Final/debezium-server-dist-2.5.4.Final.jar

RUN curl -L -o debezium-server-nats.jar \
  https://repo1.maven.org/maven2/io/debezium/debezium-server-nats/2.5.4.Final/debezium-server-nats-2.5.4.Final.jar

COPY debezium.properties /app/debezium.properties

CMD ["java", "-jar", "debezium-server-dist.jar", "-c", "debezium.properties"]

# # Install Kafka connector
# RUN microdnf -y install curl && \
#     curl -L -o /tmp/debezium-server-kafka-2.5.4.Final.jar \
#       https://repo1.maven.org/maven2/io/debezium/debezium-server-kafka/2.5.4.Final/debezium-server-kafka-2.5.4.Final.jar && \
#     mkdir -p /deployments && \
#     mv /tmp/debezium-server-kafka-2.5.4.Final.jar /deployments/     

# # Install RabbitMQ connector
# RUN microdnf -y install curl && \
#     curl -L -o /tmp/debezium-server-rabbitmq-2.5.4.Final.jar \
#       https://repo1.maven.org/maven2/io/debezium/debezium-server-rabbitmq/2.5.4.Final/debezium-server-rabbitmq-2.5.4.Final.jar && \
#     mkdir -p /deployments && \
#     mv /tmp/debezium-server-rabbitmq-2.5.4.Final.jar /deployments/
