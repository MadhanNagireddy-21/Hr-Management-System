# ==========================================
# Stage 1: Build the application using Maven
# ==========================================
FROM maven:3.9.6-eclipse-temurin-17-alpine AS build

WORKDIR /app

# Copy pom.xml first to cache Maven dependencies
COPY pom.xml .

# Download project dependencies (cached unless pom.xml changes)
RUN mvn dependency:go-offline -B

# Copy application source code
COPY src ./src

# Build the application JAR file and skip tests for faster build
RUN mvn clean package -DskipTests -B

# ==========================================
# Stage 2: Create lightweight runtime image
# ==========================================
FROM eclipse-temurin:17-jre-alpine

# Set working directory inside container
WORKDIR /app

# Create a non-root user for security best practices
RUN addgroup -S hrmsgroup && adduser -S hrmsuser -G hrmsgroup

# Copy the built JAR file from the build stage
COPY --from=build /app/target/hrms-backend-*.jar app.jar

# Change ownership of the app directory to the non-root user
RUN chown -R hrmsuser:hrmsgroup /app

# Switch to the non-root user
USER hrmsuser

# Expose the port configured in application.properties (default: 8080)
EXPOSE 8080

# Environment variables with default fallbacks
ENV PORT=8080 \
    SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/hrms_db \
    SPRING_DATASOURCE_USERNAME=root \
    SPRING_DATASOURCE_PASSWORD=hussain@123 \
    JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0"

# Run the Spring Boot application
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]

