# AutoDraw2 Deployment Script

# Configuration
$IMAGE_NAME = "autodraw2"
$CONTAINER_NAME = "autodraw2-app"
$PORT = 8080

Write-Host "Starting deployment process..." -ForegroundColor Green

# Check if Docker is running
if (!(Get-Process "docker" -ErrorAction SilentlyContinue)) {
    Write-Error "Docker is not running. Please start Docker Desktop first."
    exit 1
}

# Build the Docker image
Write-Host "Building Docker image..." -ForegroundColor Cyan
docker build -t $IMAGE_NAME .

if ($LASTEXITCODE -ne 0) {
    Write-Error "Docker build failed."
    exit $LASTEXITCODE
}

# Stop and remove existing container if it exists
if (docker ps -a --format '{{.Names}}' | Select-String -Pattern "^$CONTAINER_NAME$") {
    Write-Host "Stopping and removing existing container..." -ForegroundColor Yellow
    docker stop $CONTAINER_NAME
    docker rm $CONTAINER_NAME
}

# Run the new container
Write-Host "Starting new container..." -ForegroundColor Cyan
docker run -d -p "${PORT}:80" --name $CONTAINER_NAME $IMAGE_NAME

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to start container."
    exit $LASTEXITCODE
}

Write-Host "Deployment successful!" -ForegroundColor Green
Write-Host "Application is running at http://localhost:$PORT" -ForegroundColor Green
