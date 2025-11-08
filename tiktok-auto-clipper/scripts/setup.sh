#!/bin/bash

###############################################################################
# TikTok Auto Clipper - Setup Script
###############################################################################

echo "=============================================="
echo "TikTok Auto Clipper - Setup"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Project directory
PROJECT_DIR="/home/user/n8n-mcp-server/tiktok-auto-clipper"

echo "Project directory: $PROJECT_DIR"
echo ""

# Check if N8N is installed
echo -n "Checking for N8N installation... "
if command -v n8n &> /dev/null; then
    echo -e "${GREEN}Found${NC}"
    n8n --version
else
    echo -e "${RED}Not found${NC}"
    echo "Please install N8N first: npm install -g n8n"
    exit 1
fi

# Check for FFmpeg
echo -n "Checking for FFmpeg... "
if command -v ffmpeg &> /dev/null; then
    echo -e "${GREEN}Found${NC}"
    ffmpeg -version | head -n 1
else
    echo -e "${YELLOW}Not found${NC}"
    echo "FFmpeg is required for video processing. Install it:"
    echo "  Ubuntu/Debian: sudo apt-get install ffmpeg"
    echo "  macOS: brew install ffmpeg"
fi

echo ""
echo "=============================================="
echo "Configuration Setup"
echo "=============================================="

# Create .env file if it doesn't exist
if [ ! -f "$PROJECT_DIR/config/.env" ]; then
    echo "Creating .env file from template..."
    cp "$PROJECT_DIR/config/.env.example" "$PROJECT_DIR/config/.env"
    echo -e "${GREEN}Created${NC} $PROJECT_DIR/config/.env"
    echo -e "${YELLOW}IMPORTANT:${NC} Please edit .env file and add your API keys!"
else
    echo ".env file already exists"
fi

echo ""
echo "=============================================="
echo "Required API Keys & Services"
echo "=============================================="
echo ""
echo "1. TMDB API Key (The Movie Database)"
echo "   - Sign up at: https://www.themoviedb.org/"
echo "   - Get API key: https://www.themoviedb.org/settings/api"
echo ""
echo "2. TikTok Developer Account"
echo "   - Apply at: https://developers.tiktok.com/"
echo "   - Create an app and get OAuth credentials"
echo "   - Note: TikTok API access requires approval"
echo ""
echo "3. Video Processing Service"
echo "   - Option A: Cloudinary (https://cloudinary.com/)"
echo "   - Option B: AWS MediaConvert"
echo "   - Option C: Self-hosted FFmpeg service (included in scripts/)"
echo ""
echo "4. Video Storage/Source"
echo "   - You need access to movie video files"
echo "   - Options: AWS S3, local storage, streaming URLs"
echo ""
echo "5. Notification Service (Optional)"
echo "   - Slack webhook for notifications"
echo "   - Or use email/other notification service"
echo ""

echo "=============================================="
echo "Legal Disclaimer"
echo "=============================================="
echo ""
echo -e "${RED}WARNING: IMPORTANT LEGAL INFORMATION${NC}"
echo ""
echo "Using copyrighted movie/TV content without permission is ILLEGAL."
echo "This project is for EDUCATIONAL PURPOSES ONLY."
echo ""
echo "Before using in production, you must:"
echo "  1. Obtain proper licensing for all content"
echo "  2. Respect copyright laws and fair use guidelines"
echo "  3. Comply with TikTok's terms of service"
echo "  4. Get written permission from content owners"
echo ""
echo "The creators of this project are NOT responsible for any"
echo "misuse or legal issues arising from unauthorized use."
echo ""

read -p "Do you understand and accept these terms? (yes/no): " accept

if [ "$accept" != "yes" ]; then
    echo "Setup cancelled."
    exit 1
fi

echo ""
echo "=============================================="
echo "Import Workflow to N8N"
echo "=============================================="
echo ""
echo "To import the workflow into N8N:"
echo ""
echo "1. Start N8N:"
echo "   n8n"
echo ""
echo "2. Open N8N in browser (usually http://localhost:5678)"
echo ""
echo "3. Click 'Workflows' -> 'Import Workflow'"
echo ""
echo "4. Upload this file:"
echo "   $PROJECT_DIR/workflows/tiktok-auto-clipper-workflow.json"
echo ""
echo "5. Configure credentials for:"
echo "   - TMDB API"
echo "   - TikTok API"
echo "   - Video processing service"
echo "   - Slack (for notifications)"
echo ""
echo "6. Set environment variables in N8N:"
echo "   Settings -> Environment Variables"
echo "   Or use .env file support"
echo ""

echo ""
echo "=============================================="
echo "Next Steps"
echo "=============================================="
echo ""
echo "1. Edit config/.env with your API keys"
echo "2. Set up video storage and access"
echo "3. Deploy video processing service (if using custom)"
echo "4. Import workflow to N8N"
echo "5. Configure all credentials in N8N"
echo "6. Test in DRY_RUN_MODE=true first"
echo "7. Review legal requirements"
echo "8. Activate workflow when ready"
echo ""
echo -e "${GREEN}Setup complete!${NC}"
echo ""
echo "For detailed documentation, see:"
echo "  $PROJECT_DIR/docs/README.md"
echo ""
