# BTC Kalshi Tracker — Cloudflare Worker

This folder is the live version of the tracker. It serves the website and exposes `/api/live`, which fetches the public Kalshi KXBTC15M market feed and Coinbase BTC spot data server-side so Safari never has to call Kalshi directly.

## Deploy

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/yanezzjonathan20-design/btc-kalshi-tracker/tree/main/cloudflare)

After deployment, Cloudflare provides a `workers.dev` URL. Open that URL in Safari; that is the live tracker.

The page polls the Worker every second and automatically switches to the next open KXBTC15M contract at the 15-minute boundary.

Kalshi's BTC 15-minute contracts use their stated settlement methodology; the displayed Coinbase BTC spot is a live reference signal, not a substitute for the official settlement source.
