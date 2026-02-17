#!/bin/bash

echo "IBM i schema clean up started..."
schema=$(cat ~/.drop_schema 2>/dev/null)
if [ -z "$schema" ]; then
  echo "No IBM i schema to drop."
  exit 0
fi

echo "Dropping IBM i schema $schema..."
result=$(aitool sql --input - <<EOF
{
  "sql": "drop schema $schema cascade"
}
EOF
)
if [ $? -ne 0 ]; then
  echo "Error dropping IBM i schema $schema:"
  echo "$result"
  exit 1
fi

echo "IBM i schema $schema dropped."
rm ~/.drop_schema
