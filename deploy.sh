#!/usr/bin/env bash

# Master deployment script for all services
set -e

show_help() {
    echo "🚀 Auto Showroom Deployment Script"
    echo ""
    echo "Usage: ./deploy.sh [service]"
    echo ""
    echo "Services:"
    echo "  client    Deploy React app to S3"
    echo "  server    Deploy Node.js API to EC2 (must run on EC2)"
    echo "  lambda    Deploy Lambda functions to AWS"
    echo "  all       Deploy all services"
    echo ""
    echo "Examples:"
    echo "  ./deploy.sh client"
    echo "  ./deploy.sh lambda"
    echo "  ./deploy.sh all"
    echo ""
}

deploy_client() {
    echo "📱 Deploying Client to S3..."
    cd client
    chmod +x deploy-s3.sh
    ./deploy-s3.sh
    cd ..
}

deploy_server() {
    echo "🖥️  Deploying Server to EC2..."
    echo ""
    echo "⚠️  This must be run ON the EC2 instance!"
    echo ""
    read -p "Are you on EC2 instance? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cd server
        chmod +x deploy-ec2.sh
        ./deploy-ec2.sh
        cd ..
    else
        echo "❌ Cancelled. SSH to EC2 and run:"
        echo "   cd auto-showroom && ./server/deploy-ec2.sh"
    fi
}

deploy_lambda() {
    echo "⚡ Deploying Lambda Functions..."
    cd lambda
    chmod +x deploy-all.sh
    ./deploy-all.sh
    cd ..
}

# Main
case "$1" in
    client)
        deploy_client
        ;;
    server)
        deploy_server
        ;;
    lambda)
        deploy_lambda
        ;;
    all)
        echo "🚀 Deploying ALL services..."
        echo ""
        deploy_client
        echo ""
        deploy_lambda
        echo ""
        echo "⚠️  Server deployment must be done on EC2:"
        echo "   ssh ec2-user@your-ec2-ip"
        echo "   cd auto-showroom"
        echo "   ./server/deploy-ec2.sh"
        ;;
    *)
        show_help
        exit 1
        ;;
esac

echo ""
echo "✅ Deployment completed!"
echo ""
