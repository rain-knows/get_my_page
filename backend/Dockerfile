# ========== Stage 1: Build ==========
FROM maven:3.9.9-eclipse-temurin-21 AS builder
WORKDIR /app

COPY settings.xml ./settings.xml
COPY pom.xml ./
RUN mvn -s ./settings.xml -B dependency:go-offline

COPY src ./src
RUN mvn -s ./settings.xml -B -DskipTests package

# ========== Stage 2: Runtime ==========
FROM eclipse-temurin:21-jre-alpine AS runner
WORKDIR /app

RUN addgroup -S spring -g 1001 && adduser -S spring -u 1001 -G spring

COPY --from=builder --chown=spring:spring /app/target/*.jar ./app.jar

ENV JAVA_OPTS="-XX:+UseZGC -XX:MaxRAMPercentage=75.0 -XX:+UseStringDeduplication -Djava.security.egd=file:/dev/./urandom"

USER spring
EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java ${JAVA_OPTS} -jar app.jar"]
