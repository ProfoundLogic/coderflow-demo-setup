#!/bin/bash
set -e

# Check arguments
if [ $# -lt 2 ]; then
  echo "Error: Session name and history filename are required" >&2
  echo "Usage: $0 <session-name> <history-filename>" >&2
  exit 1
fi

SESSION_NAME="$1"
HISTORY_FILENAME="$2"

# Check if environment variables are set
if [ -z "$IBMI_VIS_ENDPOINT" ] || [ -z "$IBMI_VIS_DIRECTORY" ]; then
  echo "HTML rendering not supported in this environment. Use basic rendering instead." >&2
  exit 1
fi

# Construct source path
SESSION_DIR="/tmp/genie-sessions/${SESSION_NAME}"
SOURCE_FILE="${SESSION_DIR}/history/${HISTORY_FILENAME}"

# Validate session and history file exist
if [ ! -d "$SESSION_DIR" ]; then
  echo "Error: Session '${SESSION_NAME}' does not exist" >&2
  exit 1
fi

if [ ! -f "$SOURCE_FILE" ]; then
  echo "Error: History file '${HISTORY_FILENAME}' does not exist in session '${SESSION_NAME}'" >&2
  exit 1
fi

# Create target directory
TARGET_DIR="${IBMI_VIS_DIRECTORY}/${SESSION_NAME}"
if ! mkdir -p "$TARGET_DIR" 2>/dev/null; then
  echo "Error: Failed to create directory '${TARGET_DIR}'" >&2
  exit 1
fi

# Copy history file to target directory
TARGET_FILE="${TARGET_DIR}/${HISTORY_FILENAME}"
if ! cp "$SOURCE_FILE" "$TARGET_FILE" 2>/dev/null; then
  echo "Error: Failed to copy history file to '${TARGET_FILE}'" >&2
  exit 1
fi

# Calculate relative path from IBMI_VIS_DIRECTORY
RELATIVE_PATH="/${SESSION_NAME}/${HISTORY_FILENAME}"

# Determine the correct separator for the file parameter
if [[ "${IBMI_VIS_ENDPOINT}" == *"?"* ]]; then
  SEPARATOR="&"
else
  SEPARATOR="?"
fi

# Output iframe
echo "<iframe class=\"aitool-ibmi-screen-render\" src=\"${IBMI_VIS_ENDPOINT}${SEPARATOR}file=${RELATIVE_PATH}\" tabindex=\"-1\"></iframe>"
