#!/bin/bash

# put.sh - Respond to the current screen

set -e

# Check if session name is provided
if [ $# -eq 0 ]; then
  echo "Error: Session name is required" >&2
  echo "Usage: $0 <session-name> [post-data]" >&2
  exit 1
fi

SESSION_NAME="$1"
shift
SESSION_DIR="/tmp/genie-sessions/${SESSION_NAME}"
SESSION_ID_FILE="${SESSION_DIR}/session_id.txt"

# Check if session exists
if [ ! -f "$SESSION_ID_FILE" ]; then
  echo "Error: No active session found for '${SESSION_NAME}'" >&2
  exit 1
fi

# Check required environment variables
if [ -z "$IBMI_USER" ] || [ -z "$IBMI_PASSWORD" ] || [ -z "$IBMI_PUI_SERVER" ]; then
  echo "Error: Required environment variables not set" >&2
  echo "Required: IBMI_USER, IBMI_PASSWORD, IBMI_PUI_SERVER" >&2
  exit 1
fi

# Get session ID from session_id.txt
SESSION_ID=$(cat "$SESSION_ID_FILE")

if [ -z "$SESSION_ID" ]; then
  echo "Error: Failed to read session ID for '${SESSION_NAME}'" >&2
  exit 1
fi

# Get POST data from argument or stdin
if [ $# -gt 0 ]; then
  POST_DATA="$1"
else
  POST_DATA=$(cat)
fi

if [ -z "$POST_DATA" ]; then
  echo "Error: No POST data provided" >&2
  exit 1
fi

# Get current counter
COUNTER=$(cat "${SESSION_DIR}/counter.txt")

# Save POST data to history using current counter
echo "$POST_DATA" > "${SESSION_DIR}/history/post-$(printf '%03d' $COUNTER).txt"

# Send POST request and save response
curl --fail-with-body -sSL -u "${IBMI_USER}:${IBMI_PASSWORD}" \
  -X POST "${IBMI_PUI_SERVER}/profoundui/auth/PUI0002110.pgm/${SESSION_ID}" \
  -d "$POST_DATA" > "${SESSION_DIR}/session.json"

# Increment counter
COUNTER=$((COUNTER + 1))
echo "$COUNTER" > "${SESSION_DIR}/counter.txt"

# Save the response screen to history with incremented counter
cp "${SESSION_DIR}/session.json" "${SESSION_DIR}/history/screen-$(printf '%03d' $COUNTER).json"

echo "Response sent successfully"
echo "POST history: post-$(printf '%03d' $((COUNTER - 1))).txt"
echo "Screen history: screen-$(printf '%03d' $COUNTER).json"
