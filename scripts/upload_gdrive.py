#!/usr/bin/env python3
"""
upload_gdrive.py — Upload captioned video to Google Drive via rclone.

Uses rclone (pre-configured remote) for simple, credential-free uploads
without needing Google API Python packages or service account JSON.

Usage:
    python upload_gdrive.py output.mp4 FOLDER_ID

Environment:
    RCLONE_CONFIG: Base64-encoded rclone config (for GitHub Actions)
    RCLONE_REMOTE: Remote name (default: "gdrive")
"""

import os
import sys
import base64
import subprocess
import tempfile
from datetime import datetime
from pathlib import Path


def setup_rclone_config():
    """Setup rclone config from environment variable (for CI/CD)."""
    config_b64 = os.environ.get("RCLONE_CONFIG_B64", "")
    if config_b64:
        config_dir = Path.home() / ".config" / "rclone"
        config_dir.mkdir(parents=True, exist_ok=True)
        config_path = config_dir / "rclone.conf"
        config_path.write_bytes(base64.b64decode(config_b64))
        print(f"✅ rclone config written to {config_path}")
        return str(config_path)
    
    # Check if rclone config already exists (local dev)
    default_config = Path.home() / ".config" / "rclone" / "rclone.conf"
    if default_config.exists():
        print(f"✅ Using existing rclone config: {default_config}")
        return str(default_config)
    
    print("❌ No rclone config found. Set RCLONE_CONFIG_B64 env or run: rclone config")
    sys.exit(1)


def upload_to_drive(file_path: str, folder_id: str):
    """Upload a file to Google Drive folder using rclone."""
    
    remote_name = os.environ.get("RCLONE_REMOTE", "gdrive")
    
    # Setup config
    setup_rclone_config()
    
    # Verify rclone is installed
    try:
        result = subprocess.run(["rclone", "version"], capture_output=True, text=True)
        version_line = result.stdout.split("\n")[0] if result.returncode == 0 else "unknown"
        print(f"📦 rclone version: {version_line}")
    except FileNotFoundError:
        print("❌ rclone not installed. Install: https://rclone.org/install/")
        sys.exit(1)
    
    # Generate timestamped filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    original_name = Path(file_path).stem
    upload_name = f"captioned_{original_name}_{timestamp}.mp4"
    
    # rclone destination: remote:path
    # Use --drive-root-folder-id to target specific folder
    destination = f"{remote_name}:{upload_name}"
    
    print(f"☁️  Uploading '{upload_name}' to Google Drive folder {folder_id}...")
    
    cmd = [
        "rclone", "copyto",
        file_path,
        destination,
        "--drive-root-folder-id", folder_id,
        "--progress",
        "--stats-one-line",
        "-v",
    ]
    
    print(f"   Command: {' '.join(cmd)}")
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    if result.returncode == 0:
        print(f"\n✅ Upload successful!")
        print(f"   📁 File: {upload_name}")
        print(f"   📂 Folder ID: {folder_id}")
        
        if result.stdout:
            print(f"   📊 {result.stdout.strip()}")
        
        # Write result for n8n callback
        import json
        Path("gdrive_result.json").write_text(
            json.dumps({
                "fileName": upload_name,
                "folderId": folder_id,
                "status": "success",
            }, indent=2),
            encoding="utf-8"
        )
    else:
        print(f"\n❌ Upload failed!")
        print(f"   Error: {result.stderr}")
        sys.exit(1)


def main():
    if len(sys.argv) < 3:
        print("Usage: python upload_gdrive.py <file_path> <folder_id>")
        print("")
        print("Environment variables:")
        print("  RCLONE_CONFIG_B64  - Base64 encoded rclone.conf (for CI/CD)")
        print("  RCLONE_REMOTE      - Remote name (default: 'gdrive')")
        sys.exit(1)
    
    file_path = sys.argv[1]
    folder_id = sys.argv[2]
    
    if not Path(file_path).exists():
        print(f"❌ File not found: {file_path}")
        sys.exit(1)
    
    upload_to_drive(file_path, folder_id)


if __name__ == "__main__":
    main()
