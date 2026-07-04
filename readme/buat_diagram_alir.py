"""
Diagram Alir Keseluruhan Sistem — DApp Ketersediaan Kamar RS
Menggunakan simbol flowchart standar:
  Oval              = MULAI / SELESAI (Terminator)
  Parallelogram     = MASUKAN / KELUARAN (Input / Output)
  Rectangle         = PROSES (Process)
  Diamond           = KEPUTUSAN (Decision)
  Arrow             = Alur (Flow)

5 alur fungsi smart contract:
  1. addHospital       — Admin Pusat
  2. removeHospital    — Admin Pusat
  3. updateRoomStatus  — Staf RS
  4. getRoomStatus     — Pasien / Publik
  5. getAllHospitals    — Pasien / Publik
"""

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np
import os

# ─── Warna ──────────────────────────────────────────────────────────────────
C_OVAL    = '#1e293b'   # oval Mulai/Selesai
C_PARA    = '#b45309'   # parallelogram Masukan/Keluaran
C_RECT    = '#1d4ed8'   # rectangle Proses
C_DIAMOND = '#6d28d9'   # diamond Keputusan
C_REVERT  = '#b91c1c'   # rectangle REVERT / Ditolak
C_ARROW   = '#334155'   # warna garis panah
C_YES     = '#15803d'   # label "Ya"
C_NO      = '#b91c1c'   # label "Tidak"

# ─── Warna kolom per aktor ──────────────────────────────────────────────────
C_RECT_A = '#1d4ed8'    # Admin Pusat  (biru)
C_RECT_S = '#0d9488'    # Staf RS      (teal)
C_RECT_P = '#0369a1'    # Pasien       (sky blue)

# ─── Dimensi shape ──────────────────────────────────────────────────────────
OW, OH   = 3.0, 0.60    # oval: width, height
RW, RH   = 3.8, 0.70    # rectangle
PW, PH   = 3.8, 0.70    # parallelogram
DW, DH   = 4.2, 1.00    # diamond
SKEW     = 0.25         # miring parallelogram

# ─── Fungsi Gambar Shape ────────────────────────────────────────────────────
def draw_oval(ax, cx, cy, text, bg=C_OVAL, fg='white', fs=7.5):
    ax.add_patch(mpatches.Ellipse((cx, cy), OW, OH,
                 fc=bg, ec='white', lw=1.8, zorder=3))
    ax.text(cx, cy, text, ha='center', va='center',
            fontsize=fs, color=fg, fontweight='bold', zorder=4,
            multialignment='center')

def draw_rect(ax, cx, cy, text, bg=C_RECT, fg='white', fs=6.5):
    ax.add_patch(mpatches.FancyBboxPatch(
        (cx - RW/2, cy - RH/2), RW, RH,
        boxstyle='round,pad=0.05', fc=bg, ec='white', lw=1.8, zorder=3))
    ax.text(cx, cy, text, ha='center', va='center',
            fontsize=fs, color=fg, zorder=4, multialignment='center')

def draw_para(ax, cx, cy, text, bg=C_PARA, fg='white', fs=6.5):
    """Parallelogram — simbol Input/Output"""
    hw, hh = PW/2, PH/2
    verts = np.array([
        [cx - hw + SKEW, cy + hh],
        [cx + hw + SKEW, cy + hh],
        [cx + hw - SKEW, cy - hh],
        [cx - hw - SKEW, cy - hh],
    ])
    ax.add_patch(mpatches.Polygon(verts, closed=True,
                 fc=bg, ec='white', lw=1.8, zorder=3))
    ax.text(cx, cy, text, ha='center', va='center',
            fontsize=fs, color=fg, zorder=4, multialignment='center')

def draw_diamond(ax, cx, cy, text, bg=C_DIAMOND, fg='white', fs=6.0):
    hw, hh = DW/2, DH/2
    verts = np.array([
        [cx, cy + hh],
        [cx + hw, cy],
        [cx, cy - hh],
        [cx - hw, cy],
    ])
    ax.add_patch(mpatches.Polygon(verts, closed=True,
                 fc=bg, ec='white', lw=1.8, zorder=3))
    ax.text(cx, cy, text, ha='center', va='center',
            fontsize=fs, color=fg, fontweight='bold', zorder=4,
            multialignment='center')

def down_arrow(ax, x, y1, y2, color=C_ARROW):
    ax.annotate('', xy=(x, y2), xytext=(x, y1),
                arrowprops=dict(arrowstyle='->', lw=1.5, color=color))

def right_arrow(ax, x1, y, x2, color=C_ARROW):
    ax.annotate('', xy=(x2, y), xytext=(x1, y),
                arrowprops=dict(arrowstyle='->', lw=1.5, color=color))

# ─── Spacing helper ─────────────────────────────────────────────────────────
GAP = 0.40  # jarak antar shape

def step_down(y, h_top, h_bot):
    """Move y down from bottom of top shape to center of bottom shape."""
    return y - h_top/2 - GAP - h_bot/2


# ─── Gambar Keseluruhan Flowchart ────────────────────────────────────────────
def draw_flowchart():
    fig, axes = plt.subplots(1, 5, figsize=(38, 16))
    fig.patch.set_facecolor('#f1f5f9')

    col_titles = [
        '① addHospital\n(Admin Pusat)',
        '② removeHospital\n(Admin Pusat)',
        '③ updateRoomStatus\n(Staf RS)',
        '④ getRoomStatus\n(Pasien / Publik)',
        '⑤ getAllHospitals\n(Pasien / Publik)',
    ]
    col_colors = ['#fef3c7', '#fef3c7', '#e0f2fe', '#d1fae5', '#d1fae5']
    col_borders = ['#f59e0b', '#f59e0b', '#0284c7', '#16a34a', '#16a34a']

    cx = 3.5  # pusat x pada tiap subplot

    for i, ax in enumerate(axes):
        ax.set_xlim(-1, 8)
        ax.set_ylim(7.0, 26)
        ax.axis('off')
        ax.set_facecolor(col_colors[i])
        # Border kolom
        for spine in ax.spines.values():
            spine.set_visible(True)
            spine.set_edgecolor(col_borders[i])
            spine.set_linewidth(2)

        # Judul kolom
        ax.text(cx, 25.5, col_titles[i], ha='center', va='center',
                fontsize=10, fontweight='bold', color='#1e293b',
                bbox=dict(boxstyle='round,pad=0.4', fc='white',
                          ec=col_borders[i], lw=2, alpha=0.95))

    # ═══════════════════════════════════════════════════════════════════════
    # KOLOM 1: addHospital — Admin Pusat
    # ═══════════════════════════════════════════════════════════════════════
    ax = axes[0]
    y = 24.5
    draw_oval(ax, cx, y, 'MULAI')
    down_arrow(ax, cx, y - OH/2, y - OH/2 - GAP)

    y = step_down(y, OH, PH)
    draw_para(ax, cx, y, 'MASUKAN:\naddress wallet RS\nnama rumah sakit')
    down_arrow(ax, cx, y - PH/2, y - PH/2 - GAP)

    y = step_down(y, PH, DH)
    draw_diamond(ax, cx, y, 'caller\n== owner?')
    # Tidak → REVERT (kanan)
    rx = cx + DW/2
    right_arrow(ax, rx, y, 7.0)
    draw_rect(ax, 7.0, y, 'REVERT\n(Bukan Owner)', bg=C_REVERT, fs=6)
    ax.text(rx + 0.15, y + 0.15, 'Tidak', fontsize=6.5, color=C_NO, fontweight='bold')
    # Ya ↓
    ax.text(cx - 0.35, y - DH/2 - 0.12, 'Ya', fontsize=6.5, color=C_YES, fontweight='bold')
    down_arrow(ax, cx, y - DH/2, y - DH/2 - GAP)

    y = step_down(y, DH, RH)
    draw_rect(ax, cx, y, 'Validasi:\naddress ≠ 0x0\nnama ≠ kosong', bg=C_RECT_A)
    down_arrow(ax, cx, y - RH/2, y - RH/2 - GAP)

    y = step_down(y, RH, DH)
    draw_diamond(ax, cx, y, 'Sudah\nterdaftar?')
    rx = cx + DW/2
    right_arrow(ax, rx, y, 7.0)
    draw_rect(ax, 7.0, y, 'REVERT\n(Sudah Ada)', bg=C_REVERT, fs=6)
    ax.text(rx + 0.15, y + 0.15, 'Ya', fontsize=6.5, color=C_NO, fontweight='bold')
    ax.text(cx - 0.35, y - DH/2 - 0.12, 'Tidak', fontsize=6.5, color=C_YES, fontweight='bold')
    down_arrow(ax, cx, y - DH/2, y - DH/2 - GAP)

    y = step_down(y, DH, RH)
    draw_rect(ax, cx, y, 'hospitalData[addr]\n= RoomInfo tersimpan', bg=C_RECT_A)
    down_arrow(ax, cx, y - RH/2, y - RH/2 - GAP)

    y = step_down(y, RH, RH)
    draw_rect(ax, cx, y, 'hospitalList.push(addr)\ntotalHospitals++', bg=C_RECT_A)
    down_arrow(ax, cx, y - RH/2, y - RH/2 - GAP)

    y = step_down(y, RH, PH)
    draw_para(ax, cx, y, 'KELUARAN:\nemit HospitalAdded\nisRegistered = true')
    down_arrow(ax, cx, y - PH/2, y - PH/2 - GAP)

    y = step_down(y, PH, OH)
    draw_oval(ax, cx, y, 'SELESAI')

    # ═══════════════════════════════════════════════════════════════════════
    # KOLOM 2: removeHospital — Admin Pusat
    # ═══════════════════════════════════════════════════════════════════════
    ax = axes[1]
    y = 24.5
    draw_oval(ax, cx, y, 'MULAI')
    down_arrow(ax, cx, y - OH/2, y - OH/2 - GAP)

    y = step_down(y, OH, PH)
    draw_para(ax, cx, y, 'MASUKAN:\naddress wallet RS\nyang akan dicabut')
    down_arrow(ax, cx, y - PH/2, y - PH/2 - GAP)

    y = step_down(y, PH, DH)
    draw_diamond(ax, cx, y, 'caller\n== owner?')
    rx = cx + DW/2
    right_arrow(ax, rx, y, 7.0)
    draw_rect(ax, 7.0, y, 'REVERT\n(Bukan Owner)', bg=C_REVERT, fs=6)
    ax.text(rx + 0.15, y + 0.15, 'Tidak', fontsize=6.5, color=C_NO, fontweight='bold')
    ax.text(cx - 0.35, y - DH/2 - 0.12, 'Ya', fontsize=6.5, color=C_YES, fontweight='bold')
    down_arrow(ax, cx, y - DH/2, y - DH/2 - GAP)

    y = step_down(y, DH, DH)
    draw_diamond(ax, cx, y, 'RS\nterdaftar?')
    rx = cx + DW/2
    right_arrow(ax, rx, y, 7.0)
    draw_rect(ax, 7.0, y, 'REVERT\n(Belum Terdaftar)', bg=C_REVERT, fs=6)
    ax.text(rx + 0.15, y + 0.15, 'Tidak', fontsize=6.5, color=C_NO, fontweight='bold')
    ax.text(cx - 0.35, y - DH/2 - 0.12, 'Ya', fontsize=6.5, color=C_YES, fontweight='bold')
    down_arrow(ax, cx, y - DH/2, y - DH/2 - GAP)

    y = step_down(y, DH, RH)
    draw_rect(ax, cx, y, 'isRegistered = false\n(data historis tetap ada)', bg=C_RECT_A)
    down_arrow(ax, cx, y - RH/2, y - RH/2 - GAP)

    y = step_down(y, RH, PH)
    draw_para(ax, cx, y, 'KELUARAN:\nemit HospitalRemoved\nakses RS dicabut')
    down_arrow(ax, cx, y - PH/2, y - PH/2 - GAP)

    y = step_down(y, PH, OH)
    draw_oval(ax, cx, y, 'SELESAI')

    # ═══════════════════════════════════════════════════════════════════════
    # KOLOM 3: updateRoomStatus — Staf RS
    # ═══════════════════════════════════════════════════════════════════════
    ax = axes[2]
    y = 24.5
    draw_oval(ax, cx, y, 'MULAI')
    down_arrow(ax, cx, y - OH/2, y - OH/2 - GAP)

    y = step_down(y, OH, PH)
    draw_para(ax, cx, y, 'MASUKAN:\nkamar tersedia (available)\ntotal kapasitas (total)')
    down_arrow(ax, cx, y - PH/2, y - PH/2 - GAP)

    y = step_down(y, PH, DH)
    draw_diamond(ax, cx, y, 'isRegistered\n[msg.sender]?')
    rx = cx + DW/2
    right_arrow(ax, rx, y, 7.0)
    draw_rect(ax, 7.0, y, 'REVERT\n(Bukan RS)', bg=C_REVERT, fs=6)
    ax.text(rx + 0.15, y + 0.15, 'Tidak', fontsize=6.5, color=C_NO, fontweight='bold')
    ax.text(cx - 0.35, y - DH/2 - 0.12, 'Ya', fontsize=6.5, color=C_YES, fontweight='bold')
    down_arrow(ax, cx, y - DH/2, y - DH/2 - GAP)

    y = step_down(y, DH, DH)
    draw_diamond(ax, cx, y, 'available\n≤ total?')
    rx = cx + DW/2
    right_arrow(ax, rx, y, 7.0)
    draw_rect(ax, 7.0, y, 'REVERT\n(Melebihi\nKapasitas)', bg=C_REVERT, fs=6)
    ax.text(rx + 0.15, y + 0.15, 'Tidak', fontsize=6.5, color=C_NO, fontweight='bold')
    ax.text(cx - 0.35, y - DH/2 - 0.12, 'Ya', fontsize=6.5, color=C_YES, fontweight='bold')
    down_arrow(ax, cx, y - DH/2, y - DH/2 - GAP)

    y = step_down(y, DH, DH)
    draw_diamond(ax, cx, y, 'total\n> 0?')
    rx = cx + DW/2
    right_arrow(ax, rx, y, 7.0)
    draw_rect(ax, 7.0, y, 'REVERT\n(Total = 0)', bg=C_REVERT, fs=6)
    ax.text(rx + 0.15, y + 0.15, 'Tidak', fontsize=6.5, color=C_NO, fontweight='bold')
    ax.text(cx - 0.35, y - DH/2 - 0.12, 'Ya', fontsize=6.5, color=C_YES, fontweight='bold')
    down_arrow(ax, cx, y - DH/2, y - DH/2 - GAP)

    y = step_down(y, DH, RH)
    draw_rect(ax, cx, y, 'Update on-chain:\navailableRooms = available\ntotalRooms = total', bg=C_RECT_S)
    down_arrow(ax, cx, y - RH/2, y - RH/2 - GAP)

    y = step_down(y, RH, RH)
    draw_rect(ax, cx, y, 'lastUpdated\n= block.timestamp', bg=C_RECT_S)
    down_arrow(ax, cx, y - RH/2, y - RH/2 - GAP)

    y = step_down(y, RH, PH)
    draw_para(ax, cx, y, 'KELUARAN:\nemit RoomStatusUpdated\ndata kamar diperbarui')
    down_arrow(ax, cx, y - PH/2, y - PH/2 - GAP)

    y = step_down(y, PH, OH)
    draw_oval(ax, cx, y, 'SELESAI')

    # ═══════════════════════════════════════════════════════════════════════
    # KOLOM 4: getRoomStatus — Pasien / Publik
    # ═══════════════════════════════════════════════════════════════════════
    ax = axes[3]
    y = 24.5
    draw_oval(ax, cx, y, 'MULAI')
    down_arrow(ax, cx, y - OH/2, y - OH/2 - GAP)

    y = step_down(y, OH, PH)
    draw_para(ax, cx, y, 'MASUKAN:\naddress wallet RS\nyang ingin dicek')
    down_arrow(ax, cx, y - PH/2, y - PH/2 - GAP)

    y = step_down(y, PH, RH)
    draw_rect(ax, cx, y, 'getRoomStatus(address)\nview function\ntanpa gas, tanpa transaksi', bg=C_RECT_P)
    down_arrow(ax, cx, y - RH/2, y - RH/2 - GAP)

    y = step_down(y, RH, RH)
    draw_rect(ax, cx, y, 'Baca RoomInfo\ndari mapping on-chain', bg=C_RECT_P)
    down_arrow(ax, cx, y - RH/2, y - RH/2 - GAP)

    y = step_down(y, RH, RH)
    draw_rect(ax, cx, y, 'Hitung:\nisFull = (available == 0)', bg=C_RECT_P)
    down_arrow(ax, cx, y - RH/2, y - RH/2 - GAP)

    y = step_down(y, RH, PH)
    draw_para(ax, cx, y, 'KELUARAN:\nnama, totalRooms\navailableRooms, isFull\nlastUpdated')
    down_arrow(ax, cx, y - PH/2, y - PH/2 - GAP)

    y = step_down(y, PH, RH)
    draw_rect(ax, cx, y, 'Tampilkan badge:\nTERSEDIA  /  PENUH', bg=C_RECT_P, fs=7)
    down_arrow(ax, cx, y - RH/2, y - RH/2 - GAP)

    y = step_down(y, RH, OH)
    draw_oval(ax, cx, y, 'SELESAI')

    # ═══════════════════════════════════════════════════════════════════════
    # KOLOM 5: getAllHospitals + totalHospitals — Publik
    # ═══════════════════════════════════════════════════════════════════════
    ax = axes[4]
    y = 24.5
    draw_oval(ax, cx, y, 'MULAI')
    down_arrow(ax, cx, y - OH/2, y - OH/2 - GAP)

    y = step_down(y, OH, PH)
    draw_para(ax, cx, y, 'MASUKAN:\nPermintaan dari\nfrontend / browser')
    down_arrow(ax, cx, y - PH/2, y - PH/2 - GAP)

    y = step_down(y, PH, RH)
    draw_rect(ax, cx, y, 'getAllHospitals()\nview function\nreturn address[] semua RS', bg=C_RECT_P)
    down_arrow(ax, cx, y - RH/2, y - RH/2 - GAP)

    y = step_down(y, RH, RH)
    draw_rect(ax, cx, y, 'totalHospitals()\nview function\nreturn uint256 jumlah RS', bg=C_RECT_P)
    down_arrow(ax, cx, y - RH/2, y - RH/2 - GAP)

    y = step_down(y, RH, PH)
    draw_para(ax, cx, y, 'KELUARAN:\narray address RS\njumlah total RS')
    down_arrow(ax, cx, y - PH/2, y - PH/2 - GAP)

    y = step_down(y, PH, RH)
    draw_rect(ax, cx, y, 'Tampilkan daftar RS\ndi dashboard publik', bg=C_RECT_P, fs=7)
    down_arrow(ax, cx, y - RH/2, y - RH/2 - GAP)

    y = step_down(y, RH, OH)
    draw_oval(ax, cx, y, 'SELESAI')

    # ═══════════════════════════════════════════════════════════════════════
    # LEGENDA
    # ═══════════════════════════════════════════════════════════════════════
    legend_items = [
        (mpatches.Ellipse((0,0), 1, 0.5, fc=C_OVAL, ec='white', lw=1.5),
         'Oval = MULAI / SELESAI (Terminator)'),
        (mpatches.Polygon(
            np.array([[0.3,0.25],[1.3,0.25],[1.0,-0.25],[-0.0,-0.25]]),
            closed=True, fc=C_PARA, ec='white', lw=1.5),
         'Jajar Genjang = MASUKAN / KELUARAN (I/O)'),
        (mpatches.FancyBboxPatch((-0.5,-0.25), 1.0, 0.5,
            boxstyle='round,pad=0.05', fc=C_RECT, ec='white', lw=1.5),
         'Persegi Panjang = PROSES (Process)'),
        (mpatches.Polygon(
            np.array([[0,0.3],[0.6,0],[-0.6,0],[0,-0.3]]),
            closed=True, fc=C_DIAMOND, ec='white', lw=1.5),
         'Belah Ketupat = KEPUTUSAN (Decision)'),
        (mpatches.FancyBboxPatch((-0.5,-0.25), 1.0, 0.5,
            boxstyle='round,pad=0.05', fc=C_REVERT, ec='white', lw=1.5),
         'Merah = REVERT / Ditolak (Error Path)'),
    ]
    fig.legend(
        handles=[item[0] for item in legend_items],
        labels=[item[1] for item in legend_items],
        loc='lower center',
        ncol=5,
        fontsize=9,
        framealpha=0.95,
        edgecolor='#cbd5e1',
        fancybox=True,
        title='KETERANGAN SIMBOL FLOWCHART',
        title_fontsize=10,
    )

    plt.suptitle(
        'Diagram Alir Keseluruhan Sistem\n'
        'DApp Ketersediaan Kamar Rumah Sakit Terdesentralisasi\n'
        'Smart Contract: HospitalRoom.sol  |  Solidity ^0.8.20',
        fontsize=15, fontweight='bold', y=0.995, color='#1e293b'
    )
    plt.tight_layout(rect=[0, 0.06, 1, 0.95])

    img_path = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                            'diagram_alir_keseluruhan.png')
    leg = fig.legends[0] if fig.legends else None
    extra = [leg] if leg else []
    plt.savefig(img_path, dpi=180, bbox_inches='tight',
                bbox_extra_artists=extra, pad_inches=0.3,
                facecolor=fig.get_facecolor())
    plt.close()
    print(f'Gambar disimpan: {img_path}')
    return img_path


# ─── Main ─────────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    img = draw_flowchart()
    print('Selesai!')
