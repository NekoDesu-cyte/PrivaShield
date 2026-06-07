#!/usr/bin/env bash
#
# Blurify AI — backend bootstrap for a fresh Ubuntu 22.04 VM (GCP Compute Engine).
#
# Run this ON THE VM, after cloning the repo to $APP_DIR (default /opt/PrivaShield):
#
#   git clone https://github.com/NekoDesu-cyte/PrivaShield.git /opt/PrivaShield
#   cd /opt/PrivaShield
#   bash deploy/setup-vm.sh
#
# It is idempotent — safe to re-run after a `git pull`.
#
# NOTE: This script contains NO credentials. Creating the VM and firewall rules
# (which need your GCP project) is done from your laptop — see deploy/DEPLOY.md.
#
set -euo pipefail

# ── Config (override via env vars if your layout differs) ─────────────────────
APP_USER="${APP_USER:-$(whoami)}"
APP_DIR="${APP_DIR:-/opt/PrivaShield}"
BACKEND_DIR="$APP_DIR/backend"
PORT="${PORT:-8000}"               # internal port; nginx fronts it on :80
PYTHON="python3.12"                # requirements.txt is frozen for Python 3.12

echo ">> Blurify setup | user=$APP_USER dir=$APP_DIR port=$PORT"

# ── 1. System dependencies ───────────────────────────────────────────────────
# - python3.12 via deadsnakes (Ubuntu 22.04 ships 3.10, too old for the pins)
# - libgl1 / libglib2.0-0 / libgomp1: native libs for OpenCV + PyTorch
echo ">> Installing system packages..."
sudo apt-get update
sudo apt-get install -y software-properties-common
sudo add-apt-repository -y ppa:deadsnakes/ppa
sudo apt-get update
sudo apt-get install -y \
  "$PYTHON" "${PYTHON}-venv" "${PYTHON}-dev" \
  git nginx \
  libgl1 libglib2.0-0 libgomp1

# ── 2. Python virtualenv + dependencies ──────────────────────────────────────
echo ">> Creating virtualenv and installing dependencies..."
cd "$BACKEND_DIR"
[ -d venv ] || "$PYTHON" -m venv venv
# shellcheck disable=SC1091
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# ── 3. Pre-download AI models (cached to ~/.EasyOCR and ~/.cache/huggingface) ─
# Done now so the first real request isn't slow / doesn't fail on a cold box.
echo ">> Pre-downloading OCR + NER models (first run only, ~500MB)..."
python -c "import easyocr; easyocr.Reader(['id','en'], gpu=False)"
python -c "from transformers import pipeline; pipeline('ner', model='cahya/bert-base-indonesian-ner', aggregation_strategy='simple')"
deactivate

# ── 4. systemd service ───────────────────────────────────────────────────────
echo ">> Installing systemd service 'blurify'..."
sudo tee /etc/systemd/system/blurify.service > /dev/null <<EOF
[Unit]
Description=Blurify AI backend
After=network.target

[Service]
User=$APP_USER
WorkingDirectory=$BACKEND_DIR
Environment=PYTHONPATH=$BACKEND_DIR
ExecStart=$BACKEND_DIR/venv/bin/uvicorn main:app --host 127.0.0.1 --port $PORT --workers 1 --proxy-headers --forwarded-allow-ips=127.0.0.1
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now blurify
sudo systemctl restart blurify

# ── 5. nginx reverse proxy (:80 -> :$PORT) ───────────────────────────────────
echo ">> Configuring nginx reverse proxy on port 80..."
sudo tee /etc/nginx/sites-available/blurify > /dev/null <<EOF
server {
    listen 80 default_server;
    server_name _;
    client_max_body_size 15M;          # allow image uploads (frontend limit 10MB)

    location / {
        proxy_pass http://127.0.0.1:$PORT;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 300s;        # OCR+NER can be slow on large images
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/blurify /etc/nginx/sites-enabled/blurify
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

# ── Done ─────────────────────────────────────────────────────────────────────
echo ""
echo ">> Done. Verifying locally..."
sleep 3
curl -s http://127.0.0.1/health && echo "" || echo "(health check failed — see: sudo journalctl -u blurify -e)"
echo ""
echo ">> Backend is up. Open port 80 in the GCP firewall to reach it externally."
echo ">> See deploy/DEPLOY.md for the firewall command and external test."
