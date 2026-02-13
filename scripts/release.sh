#!/bin/bash

# Release Script for My API CLI
# This script helps you create a release package

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Get version from package.json
VERSION=$(node -p "require('./package.json').version")

echo -e "${BLUE}Creating release package for v${VERSION}...${NC}"
echo ""

# Clean up old builds
if [ -d "dist" ]; then
    echo -e "${YELLOW}Cleaning old builds...${NC}"
    rm -rf dist
fi

mkdir -p dist

# Create tarball
echo -e "${BLUE}Creating tarball...${NC}"
tar -czf "dist/my-api-cli-v${VERSION}.tar.gz" \
    --exclude='node_modules' \
    --exclude='dist' \
    --exclude='.git' \
    --exclude='.env' \
    --exclude='*.log' \
    src/ \
    package.json \
    README.md \
    .env.example

echo -e "${GREEN}✓ Created: dist/my-api-cli-v${VERSION}.tar.gz${NC}"

# Create checksum
echo -e "${BLUE}Generating SHA256 checksum...${NC}"
if command -v sha256sum &> /dev/null; then
    sha256sum "dist/my-api-cli-v${VERSION}.tar.gz" > "dist/my-api-cli-v${VERSION}.tar.gz.sha256"
    CHECKSUM=$(cat "dist/my-api-cli-v${VERSION}.tar.gz.sha256" | cut -d' ' -f1)
elif command -v shasum &> /dev/null; then
    shasum -a 256 "dist/my-api-cli-v${VERSION}.tar.gz" > "dist/my-api-cli-v${VERSION}.tar.gz.sha256"
    CHECKSUM=$(cat "dist/my-api-cli-v${VERSION}.tar.gz.sha256" | cut -d' ' -f1)
else
    echo -e "${YELLOW}⚠  sha256sum not found, skipping checksum${NC}"
    CHECKSUM="N/A"
fi

if [ "$CHECKSUM" != "N/A" ]; then
    echo -e "${GREEN}✓ SHA256: $CHECKSUM${NC}"
fi

# Create npm package
echo -e "${BLUE}Creating npm package...${NC}"
npm pack --pack-destination=dist

echo -e "${GREEN}✓ Created: dist/my-api-cli-${VERSION}.tgz${NC}"

# List created files
echo ""
echo -e "${GREEN}Release files created:${NC}"
ls -lh dist/

echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Test the package:"
echo -e "   ${YELLOW}cd /tmp && tar -xzf $(pwd)/dist/my-api-cli-v${VERSION}.tar.gz${NC}"
echo ""
echo "2. Create a git tag:"
echo -e "   ${YELLOW}git tag -a v${VERSION} -m 'Release v${VERSION}'${NC}"
echo -e "   ${YELLOW}git push origin v${VERSION}${NC}"
echo ""
echo "3. Create GitHub release and upload:"
echo -e "   ${YELLOW}dist/my-api-cli-v${VERSION}.tar.gz${NC}"
echo -e "   ${YELLOW}dist/my-api-cli-v${VERSION}.tar.gz.sha256${NC}"
echo ""
echo "4. Update install.sh with new version and checksum"
if [ "$CHECKSUM" != "N/A" ]; then
    echo -e "   ${YELLOW}EXPECTED_SHA='$CHECKSUM'${NC}"
fi
echo ""
