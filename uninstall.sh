#!/usr/bin/env bash

echo "Stopping and removing systemd user service..."
systemctl --user disable --now nudge.service 2>/dev/null || true
rm -f ~/.config/systemd/user/nudge.service
systemctl --user daemon-reload

echo "Removing nudge symlink from ~/.local/bin..."
rm -f ~/.local/bin/nudge

echo "Uninstallation complete."
echo ""
echo "Note: If you added the nudge_postexec_hook to your fish shell, you will need to manually remove it from ~/.config/fish/config.fish."
echo "If you also want to delete your saved nudges data, run: rm -rf ~/.local/share/nudge"
    