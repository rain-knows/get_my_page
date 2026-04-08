# Stage 1: Build
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /app
COPY settings.xml ./settings.xml
COPY pom.xml .
RUN mvn -s ./settings.xml dependency:go-offline -q
COPY src ./src
RUN mvn -s ./settings.xml clean package -DskipTests -q

# Stage 2: Run
FROM eclipse-temurin:21-jre-alpine AS runner
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
