#!/bin/bash

# Script để package và deploy Lambda function
# Usage: ./deploy.sh [function-name] [region]

set -e

FUNCTION_NAME=${1:-demo-products-handler}
REGION=${2:-us-east-1}
ZIP_FILE="function.zip"

echo "🚀 Deploying Lambda Function: $FUNCTION_NAME"
echo "📍 Region: $REGION"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    echo "   https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials are not configured."
    echo "   Run: aws configure"
    exit 1
fi

echo "✅ AWS CLI configured"
echo ""

# Create ZIP file
echo "📦 Creating ZIP package..."
if [ -f "$ZIP_FILE" ]; then
    rm "$ZIP_FILE"
fi

zip -r "$ZIP_FILE" demo-products-handler.js package.json > /dev/null
echo "✅ ZIP package created: $ZIP_FILE"
echo ""

# Check if Lambda function exists
echo "🔍 Checking if Lambda function exists..."
if aws lambda get-function --function-name "$FUNCTION_NAME" --region "$REGION" &> /dev/null; then
    echo "✅ Function exists. Updating code..."
    
    # Update function code
    aws lambda update-function-code \
        --function-name "$FUNCTION_NAME" \
        --zip-file "fileb://$ZIP_FILE" \
        --region "$REGION" \
        --output json > /dev/null
    
    echo "✅ Function code updated successfully!"
    
    # Update configuration
    echo "⚙️  Updating configuration..."
    aws lambda update-function-configuration \
        --function-name "$FUNCTION_NAME" \
        --timeout 30 \
        --memory-size 256 \
        --region "$REGION" \
        --output json > /dev/null
    
    echo "✅ Configuration updated!"
else
    echo "❌ Function does not exist. Creating new function..."
    echo ""
    echo "Please create the function manually first:"
    echo "1. Go to AWS Console → Lambda → Create function"
    echo "2. Function name: $FUNCTION_NAME"
    echo "3. Runtime: Node.js 20.x"
    echo "4. Then run this script again to update the code"
    exit 1
fi

echo ""
echo "🎉 Deployment completed!"
echo ""
echo "📊 Function details:"
aws lambda get-function --function-name "$FUNCTION_NAME" --region "$REGION" --query 'Configuration.[FunctionName,Runtime,Timeout,MemorySize,LastModified]' --output table

echo ""
echo "🧪 Test the function:"
echo "   aws lambda invoke --function-name $FUNCTION_NAME --region $REGION --payload '{\"httpMethod\":\"GET\",\"path\":\"/demo/products\"}' response.json"
echo ""
echo "📝 View logs:"
echo "   aws logs tail /aws/lambda/$FUNCTION_NAME --follow --region $REGION"
echo ""

# Cleanup
rm "$ZIP_FILE"
echo "🧹 Cleaned up temporary files"
