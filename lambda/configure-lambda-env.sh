#!/usr/bin/env bash

# Configure Lambda environment variables for DocumentDB
set -e

FUNCTION_NAME=${1:-demo-products-handler}
REGION=${2:-us-west-2}

echo "🔧 Configuring Lambda environment variables..."
echo "Function: $FUNCTION_NAME"
echo "Region: $REGION"
echo ""

# Set environment variables
aws lambda update-function-configuration \
  --function-name "$FUNCTION_NAME" \
  --region "$REGION" \
  --environment "Variables={
    MONGODB_URI=mongodb://appuser:TuanAnh_205@group2-car-docdb.cluster-cv48u6ce0m14.us-west-2.docdb.amazonaws.com:27017/?tls=true&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false,
    DB_NAME=auto_showroom,
    USE_MOCK_DATA=false
  }" \
  --output json > /dev/null

echo "✅ Environment variables configured!"
echo ""
echo "📋 Current configuration:"
aws lambda get-function-configuration \
  --function-name "$FUNCTION_NAME" \
  --region "$REGION" \
  --query 'Environment.Variables' \
  --output table

echo ""
echo "⚠️  Next step: Configure VPC"
echo "   Lambda must be in VPC: vpc-0a9526f49f5f9f6ed"
echo "   Security Group: sg-056352ecd89e1f7b7"
echo ""
echo "Run: ./configure-lambda-vpc.sh"
