# Nudge

A minimal CLI reminder tool built in Node.js for CachyOS / Arch Linux.
Features natural language time parsing, process watching, and shell integration.

## Installation

Run the installation script:

```bash
./install.sh
```

This will:
- Install dependencies
- Symlink `nudge` to `~/.local/bin/nudge`
- Setup and start the systemd user service (`nudge.service`)

## Usage

```bash
# Save a note instantly
nudge "Buy milk"

# Natural language time parsing
nudge "Check laundry" "in 2 hours"
nudge "Meeting" "tomorrow morning"

# Watch a process, fire when it exits
nudge "Game finished" --after hl2_linux

# Fire after a specific terminal command finishes
nudge "Build done" --after-cmd "npm run build"

# Show all pending nudges
nudge list

# Clear a specific nudge
nudge done 1
```

## Shell Integration (`--after-cmd`)

To use the `--after-cmd` feature, you need to add a hook to your shell configuration so `nudge` knows when commands finish.

### Zsh (`~/.zshrc`)

```zsh
function nudge_preexec() {
    if [[ "$1" != nudge* ]]; then
        export __nudge_last_cmd="$1"
    fi
}

function nudge_precmd() {
    if [[ -n "$__nudge_last_cmd" ]]; then
        nudge --trigger-cmd "$__nudge_last_cmd" >/dev/null 2>&1 &!
        unset __nudge_last_cmd
    fi
}

autoload -Uz add-zsh-hook
add-zsh-hook preexec nudge_preexec
add-zsh-hook precmd nudge_precmd
```

### Bash (`~/.bashrc`)

```bash
function nudge_precmd() {
    local last_cmd
    last_cmd=$(builtin history 1 | sed -e 's/^[ ]*[0-9]\+[ ]*//')
    if [[ "$last_cmd" != nudge* ]] && [[ "$last_cmd" != "$__nudge_prev_cmd" ]]; then
        nudge --trigger-cmd "$last_cmd" >/dev/null 2>&1 & disown
        export __nudge_prev_cmd="$last_cmd"
    fi
}
PROMPT_COMMAND="nudge_precmd; ${PROMPT_COMMAND:-}"
```

### Fish (`~/.config/fish/config.fish`)

```fish
function nudge_prompt_hook --on-event fish_prompt
    if set -q __nudge_last_cmd
        nudge --trigger-cmd "$__nudge_last_cmd" & disown
        set -e __nudge_last_cmd
    end
end

function nudge_capture_hook --on-event fish_preexec
    if not string match -q "nudge*" -- $argv
        set -g __nudge_last_cmd $argv
    end
end
```
