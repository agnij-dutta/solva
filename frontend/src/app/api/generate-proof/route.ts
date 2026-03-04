import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";

const execAsync = promisify(exec);

const PROJECT_ROOT = path.resolve(process.cwd(), "..");

function readProofCalldata(): { calldata: string[]; root: string; liabilities: string } | null {
  const proofDir = path.join(PROJECT_ROOT, "circuits", "solvency_circuit", "target", "proof");
  const piPath = path.join(proofDir, "public_inputs");
  const proofPath = path.join(proofDir, "proof");

  if (!fs.existsSync(piPath) || !fs.existsSync(proofPath)) return null;

  const piData = fs.readFileSync(piPath);
  const proofData = fs.readFileSync(proofPath);

  // Public inputs: [root (32 bytes), total_liabilities (32 bytes)]
  const root = BigInt("0x" + piData.subarray(0, 32).toString("hex"));
  const liabilities = BigInt("0x" + piData.subarray(32, 64).toString("hex"));

  // Split into u256 (low, high) pairs
  const mask128 = (1n << 128n) - 1n;
  const rootLow = root & mask128;
  const rootHigh = root >> 128n;
  const liabLow = liabilities & mask128;
  const liabHigh = liabilities >> 128n;

  // Build calldata: public inputs + proof chunks (31-byte felt252s)
  const calldata: string[] = [
    "0x" + rootLow.toString(16),
    "0x" + rootHigh.toString(16),
    "0x" + liabLow.toString(16),
    "0x" + liabHigh.toString(16),
  ];

  // Chunk proof into felt252s (31 bytes each, since felt252 < 2^251)
  const chunkSize = 31;
  const maxChunks = 20;
  for (let i = 0; i < Math.min(proofData.length, chunkSize * maxChunks); i += chunkSize) {
    const chunk = proofData.subarray(i, i + chunkSize);
    const val = BigInt("0x" + Buffer.from(chunk).toString("hex"));
    calldata.push("0x" + val.toString(16));
  }

  return {
    calldata,
    root: "0x" + root.toString(16),
    liabilities: liabilities.toString(),
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const useSample = body.useSample !== false; // default true

    const proveScript = path.join(PROJECT_ROOT, "scripts", "prove.sh");

    if (!fs.existsSync(proveScript)) {
      return NextResponse.json(
        { success: false, error: "prove.sh not found", path: proveScript },
        { status: 500 }
      );
    }

    const cmd = useSample ? `bash "${proveScript}" --sample` : `bash "${proveScript}"`;

    const { stdout, stderr } = await execAsync(cmd, {
      cwd: PROJECT_ROOT,
      timeout: 120_000,
      env: { ...process.env, PATH: `${process.env.HOME}/.nargo/bin:${process.env.HOME}/.bb:${process.env.PATH}` },
    });

    // Read merkle tree data
    const treePath = path.join(PROJECT_ROOT, "tree-builder", "merkle_tree.json");
    let treeData = null;
    if (fs.existsSync(treePath)) {
      treeData = JSON.parse(fs.readFileSync(treePath, "utf-8"));
    }

    // Read proof calldata for on-chain submission
    const proofCalldata = readProofCalldata();

    return NextResponse.json({
      success: !!proofCalldata,
      treeData: treeData ? {
        root: treeData.root,
        totalReserves: treeData.total_reserves,
        totalLiabilities: treeData.total_liabilities,
        numLeaves: treeData.num_leaves,
        depth: treeData.depth,
        isSolvent: treeData.is_solvent,
      } : null,
      calldata: proofCalldata?.calldata || null,
      proofRoot: proofCalldata?.root || null,
      proofLiabilities: proofCalldata?.liabilities || null,
      stdout: stdout.slice(-2000),
      stderr: stderr.slice(-1000),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stdout: error.stdout?.slice(-2000),
        stderr: error.stderr?.slice(-1000),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  const treePath = path.join(PROJECT_ROOT, "tree-builder", "merkle_tree.json");

  let treeData = null;
  if (fs.existsSync(treePath)) {
    try {
      treeData = JSON.parse(fs.readFileSync(treePath, "utf-8"));
    } catch { /* ignore */ }
  }

  // Check if proof calldata is available
  const proofCalldata = readProofCalldata();

  return NextResponse.json({
    hasProof: !!proofCalldata,
    treeData: treeData ? {
      root: treeData.root,
      totalReserves: treeData.total_reserves,
      totalLiabilities: treeData.total_liabilities,
      numLeaves: treeData.num_leaves,
      depth: treeData.depth,
      isSolvent: treeData.is_solvent,
    } : null,
    calldata: proofCalldata?.calldata || null,
    proofRoot: proofCalldata?.root || null,
    proofLiabilities: proofCalldata?.liabilities || null,
  });
}
