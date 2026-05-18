#!/usr/bin/env bash
set -e

echo "Installing nudge dependencies..."
npm install

echo "Linking nudge to ~/.local/bin/nudge..."
mkdir -p ~/.local/bin
ln -sf "$(pwd)/bin/nudge.js" ~/.local/bin/nudge
chmod +x "$(pwd)/bin/nudge.js"

echo "Setting up systemd user service..."
mkdir -p ~/.config/systemd/user
cp nudge.service ~/.config/systemd/user/nudge.service
systemctl --user daemon-reload
systemctl --user enable --now nudge.service

echo "Installation complete!"
echo ""
echo "========================================================"
echo "IMPORTANT: Shell Integration Required for --after-cmd"
echo "========================================================"
echo "To enable the '--after-cmd' feature, you must add a small hook to your shell configuration."
echo "Instructions for Bash, Zsh, and Fish are available in the README.md file."
