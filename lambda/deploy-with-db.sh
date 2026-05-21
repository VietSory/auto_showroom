#!/usr/bin/env bash

# Deploy Lambda with MongoDB/DocumentDB support
# Usage: ./deploy-with-db.sh [function-name] [region]

set -e

FUNCTION_NAME=${1:-demo-products-handler}
REGION=${2:-us-west-2}
ZIP_FILE="function-db.zip"

echo "🚀 Deploying Lambda Function with MongoDB: $FUNCTION_NAME"
echo "📍 Region: $REGION"
echo ""

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed"
    exit 1
fi

if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials are not configured"
    exit 1
fi

echo "✅ AWS CLI configured"
echo ""

# Create ZIP with dependencies
echo "📦 Creating ZIP package with MongoDB driver..."
if [ -f "$ZIP_FILE" ]; then
    rm "$ZIP_FILE"
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📥 Installing dependencies..."
    npm install
fi

# Create zip with handler and node_modules
zip -r "$ZIP_FILE" demo-products-handler-db.js package.json node_modules/ global-bundle.pem > /dev/null
echo "✅ ZIP package created: $ZIP_FILE ($(du -h $ZIP_FILE | cut -f1))"
echo ""

# Check if function exists
echo "🔍 Checking if Lambda function exists..."
if aws lambda get-function --function-name "$FUNCTION_NAME" --region "$REGION" &> /dev/null; then
    echo "✅ Function exists. Updating code..."
    
    aws lambda update-function-code \
        --function-name "$FUNCTION_NAME" \
        --zip-file "fileb://$ZIP_FILE" \
        --region "$REGION" \
        --output json > /dev/null
    
    echo "✅ Function code updated!"
    
    # Update configuration
    echo "⚙️  Updating configuration..."
    aws lambda update-function-configuration \
        --function-name "$FUNCTION_NAME" \
        --timeout 30 \
        --memory-size 512 \
        --handler demo-products-handler-db.handler \
        --region "$REGION" \
        --output json > /dev/null
    
    echo "✅ Configuration updated!"
else
    echo "❌ Function does not exist. Please create it first."
    exit 1
fi

echo ""
echo "🎉 Deployment completed!"
echo ""
echo "⚠️  IMPORTANT: Configure these environment variables in Lambda:"
echo "   MONGODB_URI=mongodb://username:password@docdb-cluster.region.docdb.amazonaws.com:27017/?tls=true&tlsCAFile=rds-combined-ca-bundle.pem&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false"
echo "   DB_NAME=auto_showroom"
echo "   USE_MOCK_DATA=false"
echo ""
echo "⚠️  Lambda must be in VPC to connect to DocumentDB:"
echo "   1. Go to Lambda Console → Configuration → VPC"
echo "   2. Select same VPC as DocumentDB"
echo "   3. Select private subnets"
echo "   4. Select security group that allows DocumentDB access"
echo ""
echo "📊 Function details:"
aws lambda get-function --function-name "$FUNCTION_NAME" --region "$REGION" --query 'Configuration.[FunctionName,Runtime,Timeout,MemorySize,LastModified]' --output table

# Cleanup
rm "$ZIP_FILE"
echo ""
echo "🧹 Cleaned up temporary files"
