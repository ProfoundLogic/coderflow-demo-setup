#!/bin/bash

# start.sh - Start a new IBM i interactive session

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

# Check if session already exists
if [ -f "$SESSION_ID_FILE" ]; then
  echo "Error: Session '${SESSION_NAME}' is already active" >&2
  exit 1
fi

# Check required environment variables
if [ -z "$IBMI_USER" ] || [ -z "$IBMI_PASSWORD" ] || [ -z "$IBMI_PUI_SERVER" ] || [ -z "$IBMI_BUILD_LIBRARY" ]; then
  echo "Error: Required environment variables not set" >&2
  echo "Required: IBMI_USER, IBMI_PASSWORD, IBMI_PUI_SERVER, IBMI_BUILD_LIBRARY" >&2
  exit 1
fi

# Clean up any old session data
rm -rf "$SESSION_DIR"

# Start the session
RESPONSE=$(curl --fail-with-body -sSL -u "${IBMI_USER}:${IBMI_PASSWORD}" \
  -X POST "${IBMI_PUI_SERVER}/profoundui/auth/PUI0002110.pgm" \
  -d "init=1&connectiontype=V&PUI_AGENTIC_TASK_LIB=${IBMI_BUILD_LIBRARY}")

if [ $? -ne 0 ]; then
  echo "Error: Failed to start session" >&2
  exit 1
fi

# Extract session ID
SESSION_ID=$(echo "$RESPONSE" | jq -r '.appJob.auth')

if [ -z "$SESSION_ID" ] || [ "$SESSION_ID" = "null" ]; then
  echo "Error: Failed to extract session ID from response" >&2
  exit 1
fi

# Create session directory structure
mkdir -p "${SESSION_DIR}/history"

# Save session data
echo "1" > "${SESSION_DIR}/counter.txt"
echo "$RESPONSE" > "${SESSION_DIR}/session.json"
echo "$SESSION_ID" > "$SESSION_ID_FILE"
cp "${SESSION_DIR}/session.json" "${SESSION_DIR}/history/screen-001.json"

# Output success message
echo "${SESSION_NAME} started"
echo "Screen history: screen-001.json"
