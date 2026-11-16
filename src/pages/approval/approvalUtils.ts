// src/pages/approval/approvalUtils.ts
// Helper bersama untuk halaman approval (dipisah dari ApprovalCard.jsx versi React).

/**
 * Ambil label jabatan yang layak ditampilkan dari baris approval.
 * Urutan fallback: jab_nama → tpk_jab_kode → jab_kode → 'Tanpa Jabatan'.
 */
export function getApprovalJabatanLabel(item: any): string {
  const raw = item?.jab_nama || item?.tpk_jab_kode || item?.jab_kode

  return typeof raw === 'string' && raw.trim() ? raw.trim() : 'Tanpa Jabatan'
}
