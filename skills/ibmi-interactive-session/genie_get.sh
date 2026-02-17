#!/bin/bash

# get.sh - Get the current state of the IBM i interactive session

set -e

# Check if session name is provided
if [ $# -eq 0 ]; then
  echo "Error: Session name is required" >&2
  echo "Usage: $0 <session-name>" >&2
  exit 1
fi

SESSION_NAME="$1"
SESSION_DIR="/tmp/genie-sessions/${SESSION_NAME}"
SESSION_ID_FILE="${SESSION_DIR}/session_id.txt"

# Check if session exists
if [ ! -f "$SESSION_ID_FILE" ]; then
  echo "Error: No active session found for '${SESSION_NAME}'" >&2
  exit 1
fi

# Check if session.json exists
if [ ! -f "${SESSION_DIR}/session.json" ]; then
  echo "Error: Session data not found for '${SESSION_NAME}'" >&2
  exit 1
fi

# Output the raw session JSON
cat "${SESSION_DIR}/session.json"
