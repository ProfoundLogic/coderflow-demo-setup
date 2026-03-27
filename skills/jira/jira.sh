#!/bin/bash
# JIRA CLI helper script
# Uses environment variables: JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN

set -euo pipefail

for var in JIRA_BASE_URL JIRA_EMAIL JIRA_API_TOKEN; do
  if [ -z "${!var:-}" ]; then
    echo "{\"error\": \"Environment variable $var is not set\"}" >&2
    exit 1
  fi
done

BASE_URL="${JIRA_BASE_URL%/}"
AUTH="${JIRA_EMAIL}:${JIRA_API_TOKEN}"

jira_api() {
  local method="$1"
  local endpoint="$2"
  shift 2
  curl -s -w "\n%{http_code}" \
    -X "$method" \
    -u "$AUTH" \
    -H "Content-Type: application/json" \
    -H "Accept: application/json" \
    "$@" \
    "${BASE_URL}${endpoint}"
}

parse_response() {
  local response="$1"
  local http_code body
  http_code=$(echo "$response" | tail -1)
  body=$(echo "$response" | sed '$d')
  if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
    echo "$body"
    return 0
  else
    echo "{\"error\": \"HTTP $http_code\", \"details\": $body}" >&2
    return 1
  fi
}

ACTION="${1:-help}"
shift || true

case "$ACTION" in
  get)
    ISSUE_KEY="$1"
    response=$(jira_api GET "/rest/api/3/issue/${ISSUE_KEY}?expand=transitions")
    parse_response "$response"
    ;;
  create)
    JSON_DATA="$1"
    response=$(jira_api POST "/rest/api/3/issue" -d "$JSON_DATA")
    parse_response "$response"
    ;;
  update)
    ISSUE_KEY="$1"
    JSON_DATA="$2"
    response=$(jira_api PUT "/rest/api/3/issue/${ISSUE_KEY}" -d "$JSON_DATA")
    parse_response "$response"
    ;;
  comment)
    ISSUE_KEY="$1"
    shift
    COMMENT_TEXT="$*"
    JSON_DATA=$(python3 -c "
import json, sys
text = sys.argv[1]
doc = {
    'body': {
        'type': 'doc',
        'version': 1,
        'content': [{
            'type': 'paragraph',
            'content': [{'type': 'text', 'text': text}]
        }]
    }
}
print(json.dumps(doc))
" "$COMMENT_TEXT")
    response=$(jira_api POST "/rest/api/3/issue/${ISSUE_KEY}/comment" -d "$JSON_DATA")
    parse_response "$response"
    ;;
  transition)
    ISSUE_KEY="$1"
    TRANSITION_INPUT="$2"
    if [[ "$TRANSITION_INPUT" =~ ^[0-9]+$ ]]; then
      TRANSITION_ID="$TRANSITION_INPUT"
    else
      response=$(jira_api GET "/rest/api/3/issue/${ISSUE_KEY}/transitions")
      body=$(parse_response "$response")
      TRANSITION_ID=$(echo "$body" | python3 -c "
import json, sys
data = json.load(sys.stdin)
name = sys.argv[1].lower()
for t in data.get('transitions', []):
    if t['name'].lower() == name:
        print(t['id'])
        sys.exit(0)
print('')
sys.exit(1)
" "$TRANSITION_INPUT" 2>/dev/null) || true
      if [ -z "$TRANSITION_ID" ]; then
        echo "{\"error\": \"Transition '$TRANSITION_INPUT' not found. Use 'transitions $ISSUE_KEY' to list.\"}" >&2
        exit 1
      fi
    fi
    response=$(jira_api POST "/rest/api/3/issue/${ISSUE_KEY}/transitions" \
      -d "{\"transition\": {\"id\": \"${TRANSITION_ID}\"}}")
    parse_response "$response" && echo "{\"success\": true, \"message\": \"Issue $ISSUE_KEY transitioned\"}"
    ;;
  transitions)
    ISSUE_KEY="$1"
    response=$(jira_api GET "/rest/api/3/issue/${ISSUE_KEY}/transitions")
    parse_response "$response"
    ;;
  assign)
    ISSUE_KEY="$1"
    ASSIGNEE_INPUT="$2"
    if [[ "$ASSIGNEE_INPUT" == *"@"* ]]; then
      user_response=$(jira_api GET "/rest/api/3/user/search?query=${ASSIGNEE_INPUT}")
      user_body=$(parse_response "$user_response")
      ACCOUNT_ID=$(echo "$user_body" | python3 -c "
import json, sys
users = json.load(sys.stdin)
if users: print(users[0]['accountId'])
else: sys.exit(1)
" 2>/dev/null) || { echo "{\"error\": \"User not found: $ASSIGNEE_INPUT\"}" >&2; exit 1; }
    else
      ACCOUNT_ID="$ASSIGNEE_INPUT"
    fi
    response=$(jira_api PUT "/rest/api/3/issue/${ISSUE_KEY}/assignee" \
      -d "{\"accountId\": \"${ACCOUNT_ID}\"}")
    parse_response "$response" && echo "{\"success\": true, \"message\": \"Issue $ISSUE_KEY assigned\"}"
    ;;
  search)
    JQL="$1"
    MAX_RESULTS="${2:-20}"
    ENCODED_JQL=$(python3 -c "import urllib.parse, sys; print(urllib.parse.quote(sys.argv[1]))" "$JQL")
    response=$(jira_api POST "/rest/api/3/search/jql" -d "{\"jql\": \"$JQL\", \"maxResults\": $MAX_RESULTS, \"fields\": [\"summary\", \"status\", \"assignee\", \"issuetype\", \"created\", \"updated\", \"priority\", \"reporter\"]}")
    parse_response "$response"
    ;;
  projects)
    response=$(jira_api GET "/rest/api/3/project")
    parse_response "$response"
    ;;
  project)
    PROJECT_KEY="$1"
    response=$(jira_api GET "/rest/api/3/project/${PROJECT_KEY}")
    parse_response "$response"
    ;;
  statuses)
    PROJECT_KEY="$1"
    response=$(jira_api GET "/rest/api/3/project/${PROJECT_KEY}/statuses")
    parse_response "$response"
    ;;
  user-search)
    QUERY="$1"
    ENCODED_Q=$(python3 -c "import urllib.parse, sys; print(urllib.parse.quote(sys.argv[1]))" "$QUERY")
    response=$(jira_api GET "/rest/api/3/user/search?query=${ENCODED_Q}")
    parse_response "$response"
    ;;
  myself)
    response=$(jira_api GET "/rest/api/3/myself")
    parse_response "$response"
    ;;
  help|*)
    cat << 'HELP'
JIRA CLI - Usage: jira.sh <action> [args...]

  get <key>                        Get issue details
  create '<json>'                  Create issue
  update <key> '<json>'            Update issue
  comment <key> <text>             Add comment
  transition <key> <id|name>       Change status
  transitions <key>                List available transitions
  assign <key> <email|account-id>  Assign issue
  search '<jql>'                   JQL search
  projects                         List projects
  project <key>                    Project details
  statuses <key>                   Project statuses
  user-search <query>              Find users
  myself                           Current user
HELP
    ;;
esac
