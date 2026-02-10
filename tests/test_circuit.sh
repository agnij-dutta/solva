#!/usr/bin/env bash
set -euo pipefail

# Solva: Run Noir circuit tests

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CIRCUIT_DIR="$PROJECT_ROOT/circuits/solvency_circuit"

echo "=== Noir Circuit Tests ==="
echo ""

cd "$CIRCUIT_DIR"

echo "[1/2] Compiling circuit..."
nargo compile
echo ""

echo "[2/2] Running tests..."
nargo test --show-output
echo ""

echo "=== All circuit tests passed ==="
