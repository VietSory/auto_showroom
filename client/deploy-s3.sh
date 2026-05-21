#!/usr/bin/env bash

# Deploy React client to S3
set -e

BUCKET_NAME=${1:-auto-showroom-client}
REGION=${2:-us-west-2}

echo "🚀 Deploying Client to S3"
echo "Bucket: $BUCKET_NAME"
echo "Region: $REGION"
echo ""

# Build
echo "🏗️  Building client..."
npm run build

# Check if bucket exists
if ! aws s3 ls "s3://$BUCKET_NAME" 2>&1 > /dev/null; then
    echo "📦 Creating S3 bucket..."
    aws s3 mb "s3://$BUCKET_NAME" --region "$REGION"
    
    echo "🌐 Enabling static website hosting..."
    aws s3 website "s3://$BUCKET_NAME" \
        --index-document index.html \
        --error-document index.html
    
    echo "🔓 Setting public access..."
    aws s3api put-bucket-policy \
        --bucket "$BUCKET_NAME" \
        --policy "{
            \"Version\": \"2012-10-17\",
            \"Statement\": [{
                \"Sid\": \"PublicReadGetObject\",
                \"Effect\": \"Allow\",
                \"Principal\": \"*\",
                \"Action\": \"s3:GetObject\",
                \"Resource\": \"arn:aws:s3:::$BUCKET_NAME/*\"
            }]
        }"
fi

# Upload
echo "📤 Uploading to S3..."
aws s3 sync dist/ "s3://$BUCKET_NAME" --delete --region "$REGION"

# Invalidate CloudFront cache if distribution exists
DIST_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?Origins.Items[0].DomainName=='$BUCKET_NAME.s3.amazonaws.com'].Id" --output text 2>/dev/null || echo "")
if [ ! -z "$DIST_ID" ]; then
    echo "🔄 Invalidating CloudFront cache..."
    aws cloudfront create-invalidation --distribution-id "$DIST_ID" --paths "/*" > /dev/null
fi

echo ""
echo "✅ Client deployed successfully!"
echo ""
echo "🌐 Website URL:"
echo "   http://$BUCKET_NAME.s3-website-$REGION.amazonaws.com"
echo ""
