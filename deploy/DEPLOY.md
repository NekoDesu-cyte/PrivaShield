# Deploying the Blurify AI Backend to a GCP VM

This guide takes the FastAPI backend (OCR + IndoBERT NER + OpenCV blur) from zero to
a live HTTP endpoint on a Google Compute Engine VM.

> **No credentials live in this repo.** All project-specific values (project ID,
> zone, IP) are passed as shell variables you set locally. Never commit service
> account keys, `.env` files, or `HF_TOKEN`s — `.gitignore` already excludes `.env`.

---

## Architecture

```
Internet ──> GCP firewall (tcp:80) ──> nginx (:80) ──> uvicorn (127.0.0.1:8000) ──> FastAPI
```

uvicorn binds to localhost only; nginx is the public front door. Models load once at
service startup and stay resident (single worker — see "Why 1 worker" below).

---

## Prerequisites

- A GCP project with billing enabled.
- `gcloud` CLI installed and authenticated on your laptop (`gcloud auth login`).
- The app needs ~3 GB RAM for the ML models, so use **e2-standard-2** (8 GB).
  `e2-micro` (the Always-Free tier) is **not** enough — it will OOM.

---

## Step 1 — Create the VM and firewall (run on your laptop)

```bash
# Fill these in — they are NOT stored anywhere in the repo.
export PROJECT_ID="your-gcp-project-id"
export ZONE="asia-southeast2-a"          # pick your zone
gcloud config set project "$PROJECT_ID"

# VM: Ubuntu 22.04, 8 GB RAM, 30 GB disk (models + torch are large)
gcloud compute instances create blurify-backend \
  --zone "$ZONE" \
  --machine-type e2-standard-2 \
  --image-family ubuntu-2204-lts \
  --image-project ubuntu-os-cloud \
  --boot-disk-size 30GB \
  --tags http-server

# Open port 80 to the internet (firewall rule + matching tag above)
gcloud compute firewall-rules create allow-http \
  --allow tcp:80 \
  --source-ranges 0.0.0.0/0 \
  --target-tags http-server
```

> The rule's `--target-tags` and the VM's `--tags` **must match**, or the rule won't
> apply and external requests will silently hang.

---

## Step 2 — Get the code onto the VM

```bash
gcloud compute ssh blurify-backend --zone "$ZONE"      # from your laptop
```

Then, on the VM:

```bash
sudo mkdir -p /opt && sudo chown "$USER":"$USER" /opt
git clone https://github.com/NekoDesu-cyte/PrivaShield.git /opt/PrivaShield
cd /opt/PrivaShield
```

---

## Step 3 — Run the bootstrap script (on the VM)

```bash
bash deploy/setup-vm.sh
```

This installs Python 3.12 + system libs, creates the venv, installs dependencies,
pre-downloads the AI models, and configures both the **systemd** service and the
**nginx** reverse proxy. It's idempotent — safe to re-run.

When it finishes it prints the local health check. You should see:

```json
{"status":"healthy","service":"Blurify AI API","version":"1.0.0","capabilities":["OCR","NER","Auto-Blur"]}
```

---

## Step 4 — Test from the internet (run on your laptop)

```bash
# Find the external IP
gcloud compute instances describe blurify-backend --zone "$ZONE" \
  --format='get(networkInterfaces[0].accessConfigs[0].natIP)'

# Health check
curl http://EXTERNAL_IP/health

# Full pipeline (proves OCR -> NER works; first call is slow as models warm up)
curl -X POST http://EXTERNAL_IP/api/image/process -F "file=@/path/to/test-image.png"
```

If the health check hangs, it's the firewall — re-check Step 1 and that the VM has
the `http-server` tag:
```bash
gcloud compute instances describe blurify-backend --zone "$ZONE" --format='get(tags.items)'
```

---

## Step 5 — Enable HTTPS (recommended)

Let's Encrypt issues free, auto-renewing certificates, but it needs a **stable IP** and a
**hostname** (it will not issue for a bare IP). If you don't own a domain, `sslip.io` gives
you a free hostname derived from your IP (e.g. `203-0-113-5.sslip.io`).

**1. Reserve a static IP** so it survives stop/start (and certs don't break on restart):

```bash
# from your laptop — region has NO trailing zone letter (e.g. asia-southeast2)
gcloud compute addresses create blurify-ip --region YOUR_REGION
gcloud compute addresses describe blurify-ip --region YOUR_REGION --format='get(address)'
```

**2. Attach it to the VM** (swaps the ephemeral IP — brief connectivity blip):

```bash
# confirm the access-config name first (often "external-nat")
gcloud compute instances describe blurify-backend --zone "$ZONE" \
  --format='get(networkInterfaces[0].accessConfigs[0].name)'

gcloud compute instances delete-access-config blurify-backend \
  --zone "$ZONE" --access-config-name "external-nat"
gcloud compute instances add-access-config blurify-backend \
  --zone "$ZONE" --access-config-name "external-nat" --address YOUR_STATIC_IP
```

**3. Open port 443:**

```bash
gcloud compute firewall-rules create allow-https \
  --allow tcp:443 --source-ranges 0.0.0.0/0 --target-tags http-server
```

**4. Point a hostname at the IP.** Either set your domain's `A` record to `YOUR_STATIC_IP`,
or use the `sslip.io` form `YOUR-STATIC-IP-with-dashes.sslip.io` (no setup needed).

**5. Issue the certificate (on the VM):**

```bash
# set nginx server_name to your hostname (replaces the default "_")
sudo sed -i 's/server_name _;/server_name YOUR_HOST;/' /etc/nginx/sites-available/blurify
sudo nginx -t && sudo systemctl reload nginx

sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d YOUR_HOST
```

When prompted, enter an email, accept the terms, and **choose to redirect HTTP→HTTPS**.
Certbot adds the `443` server block and installs a renewal timer (`systemctl status certbot.timer`).

**6. Verify (from your laptop):**

```bash
curl https://YOUR_HOST/health
```

> Note: a reserved static IP is free while attached to a **running** VM, but costs ~$0.01/hr
> while the VM is **stopped**.

---

## Operations

| Action | Command (on the VM) |
|---|---|
| Live logs | `sudo journalctl -u blurify -f` |
| Recent errors | `sudo journalctl -u blurify -e` |
| Restart after `git pull` | `sudo systemctl restart blurify` |
| Service status | `sudo systemctl status blurify` |
| Reload nginx after config edit | `sudo nginx -t && sudo systemctl reload nginx` |

### Update to the latest code
```bash
cd /opt/PrivaShield && git pull && sudo systemctl restart blurify
```

---

## Cost control

`e2-standard-2` is ~$50/month if left running 24/7 (covered by the $300 free trial
credit). **Stop the VM when idle** — you then pay only for the disk (~$1/month):

```bash
# from your laptop
gcloud compute instances stop  blurify-backend --zone "$ZONE"
gcloud compute instances start blurify-backend --zone "$ZONE"
```

The systemd service auto-starts on boot, so the backend comes back on its own after
a `start` (give it ~30 s to load models). Note the **external IP changes** on each
stop/start unless you reserve a static IP.

---

## Optional hardening (not required to run)

- **HTTPS**: see [Step 5 — Enable HTTPS](#step-5--enable-https-recommended) above.
- **CORS**: `backend/main.py` uses `allow_origins=["*"]` — tighten to your frontend's
  domain before production.
- **Upload cleanup**: processed images accumulate in `/opt/PrivaShield/uploads`; add a
  cron job to prune old files if it grows.

---

## Why 1 worker?

Each uvicorn/gunicorn worker loads its **own full copy** of the OCR + NER models
(~2–3 GB). On an 8 GB VM, two workers will OOM. Scale by using a bigger VM, not more
workers. The systemd unit pins `--workers 1` deliberately.
