#!/usr/bin/env bash

# Complete Lambda deployment script
set -e

FUNCTION_NAME=${1:-demo-products-handler}
REGION=${2:-us-west-2}

echo "🚀 Complete Lambda Deployment"
echo "Function: $FUNCTION_NAME"
echo "Region: $REGION"
echo ""

# Step 1: Deploy code
echo "📦 Step 1: Deploying Lambda code..."
./deploy-with-db.sh "$FUNCTION_NAME" "$REGION"

echo ""
echo "⏳ Waiting for deployment to complete..."
sleep 5

# Step 2: Configure environment variables
echo ""
echo "⚙️  Step 2: Configuring environment variables..."
./configure-lambda-env.sh "$FUNCTION_NAME" "$REGION"

echo ""
echo "✅ Lambda deployment completed!"
echo ""
echo "⚠️  IMPORTANT: If this is first deployment, configure VPC:"
echo ""
echo "1. Go to AWS Console → Lambda → $FUNCTION_NAME"
echo "2. Configuration → VPC → Edit"
echo "3. Select:"
echo "   - VPC: vpc-0a9526f49f5f9f6ed"
echo "   - Subnets: 2+ private subnets"
echo "   - Security Group: sg-056352ecd89e1f7b7"
echo ""
echo "Or run:"
echo "   aws lambda update-function-configuration \\"
echo "     --function-name $FUNCTION_NAME \\"
echo "     --vpc-config SubnetIds=subnet-xxx,subnet-yyy,SecurityGroupIds=sg-056352ecd89e1f7b7 \\"
echo "     --region $REGION"
echo ""
echo "🧪 Test Lambda:"
echo "   aws lambda invoke --function-name $FUNCTION_NAME --region $REGION \\"
echo "     --cli-binary-format raw-in-base64-out \\"
echo "     --payload '{\"httpMethod\":\"GET\",\"path\":\"/demo/products\"}' response.json"
echo ""
