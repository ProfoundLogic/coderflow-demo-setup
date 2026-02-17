#!/bin/bash
set -e

# Set variable with path to IBM i SSH key.
# Key is mounted to this location via environment Secrets.
export IBMI_KEY="$HOME/.ssh/ibmi_key"
cat >> ~/.bash_env << EOF
export IBMI_KEY="$IBMI_KEY"
EOF

# Set variables needed by aitool's PUI/Genie session runner skill.
if [ -n "$TASK_ID" ]; then
  IBMI_VIS_ENDPOINT="/visualizations/render?taskId=${TASK_ID}"
  IBMI_VIS_DIRECTORY="/task-output/screens"
  cat >> ~/.bash_env << EOF
export IBMI_VIS_ENDPOINT="$IBMI_VIS_ENDPOINT"
export IBMI_VIS_DIRECTORY="$IBMI_VIS_DIRECTORY"
EOF
fi

# Create aitool config.
mkdir -p ~/.aitool
cat > ~/.aitool/config.json <<EOF
{
  "ibmiSystems":{
    "dev":{
      "db":{
        "host":"$IBMI_HOST",
        "user":"$IBMI_USER",
        "password":"$IBMI_PASSWORD"
      }
    }
  },
  "sql":{
    "connections":{
      "dev":{
        "provider":"ibmi",
        "ibmiSystem":"dev"
      }
    },
    "defaultConnection":"dev"
  }
}
EOF

# Create task build library on IBM i.
schema="AITASK_$(uuidgen | tr '[:lower:]-' '[:upper:]_')"
aitool sql --input - > /dev/null <<EOF
{
  "sql": "create schema $schema"
}
EOF
echo "$schema" > ~/.drop_schema

result=$(aitool sql --input - <<EOF
{
  "sql": "select system_schema_name from qsys2.sysschemas where schema_name = '$schema'"
}
EOF
)
IBMI_BUILD_LIBRARY=$(echo "$result" | jq -r '.data.rows[0].SYSTEM_SCHEMA_NAME' | xargs)
cat >> ~/.bash_env << EOF
export IBMI_BUILD_LIBRARY="$IBMI_BUILD_LIBRARY"
EOF

# Run simulated build to create/update dummy objects.
export IBMI_BUILD_LIBRARY
cd /workspace/ibmi-agentic
codermake -t
