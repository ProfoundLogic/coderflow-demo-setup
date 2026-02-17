#!/bin/bash

# end.sh - End the IBM i interactive session

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

# Send hardshutdown request
curl --fail-with-body -sSL -u "${IBMI_USER}:${IBMI_PASSWORD}" \
  -X POST "${IBMI_PUI_SERVER}/profoundui/auth/PUI0002110.pgm/${SESSION_ID}" \
  -d "hardshutdown=1" > /dev/null

# Remove session_id.txt to mark session as inactive
rm -f "$SESSION_ID_FILE"

# Output success message
echo "${SESSION_NAME} ended successfully"
