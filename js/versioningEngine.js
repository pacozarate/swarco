export async function checksumRows(rows) {
  const text = JSON.stringify(rows);
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function makeVersion(tableName, fileName, rows, uploadedBy = "local") {
  return {
    tableName,
    fileName,
    uploadedAt: new Date().toISOString(),
    uploadedBy,
    rowCount: rows.length,
    checksum: await checksumRows(rows)
  };
}
