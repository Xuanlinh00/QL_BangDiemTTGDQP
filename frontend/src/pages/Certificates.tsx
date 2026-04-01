import { useState, useMemo, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

/* ─── tiny inline components (no external deps needed) ─── */
const Btn = ({
  children, onClick, disabled = false, variant = 'primary', size = 'md', className = '',
}: {
  children: React.ReactNode; onClick?: (e: React.MouseEvent) => void;
  disabled?: boolean; variant?: 'primary'|'secondary'|'danger'|'ghost'|'success';
  size?: 'sm'|'md'; className?: string;
}) => {
  const base = 'inline-flex items-center justify-center gap-1.5 font-semibold rounded-lg transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none';
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2.5 text-sm' };
  const vars = {
    primary:   'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md',
    secondary: 'bg-white border border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm',
    danger:    'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200',
    ghost:     'text-gray-500 hover:text-gray-700 hover:bg-gray-100',
    success:   'bg-blue-600 hover:bg-blue-700 text-white shadow-sm',
  };
  return (
    <button onClick={onClick} disabled={disabled}
      className={`${base} ${sizes[size]} ${vars[variant]} ${className}`}>
      {children}
    </button>
  );
};

/* ─── types ─── */
interface StudentWithDate {
  mssv: string; hoTen: string; diaChi?: string; ngayPhat?: string;
  [key: string]: string | undefined;
}
interface FileData {
  id: string; name: string; students: StudentWithDate[]; uploadedAt: string;
}

/* ─── icons (inline SVG) ─── */
const UploadIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
);
const DownloadIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
);
const SearchIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
);
const TrashIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
);
const FileIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
);
const CheckIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="20 6 9 17 4 12"/></svg>
);

export default function CertificateIssuance() {
  const [fileList, setFileList] = useState<FileData[]>(() => {
    try { const s = localStorage.getItem('certificateFileList'); return s ? JSON.parse(s) : []; }
    catch { return []; }
  });
  const [activeFileId, setActiveFileId] = useState<string | null>(() => localStorage.getItem('certificateActiveFileId'));
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all'|'issued'|'pending'>('all');
  const [searchResult, setSearchResult] = useState<StudentWithDate | null>(null);
  const [showFileList, setShowFileList] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pageSize = 10;

  useEffect(() => { localStorage.setItem('certificateFileList', JSON.stringify(fileList)); }, [fileList]);
  useEffect(() => { if (activeFileId) localStorage.setItem('certificateActiveFileId', activeFileId); }, [activeFileId]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target?.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(ws) as Record<string, any>[];
        const jsonData: StudentWithDate[] = raw.map(row => {
          const norm: StudentWithDate = { mssv: '', hoTen: '', diaChi: '', ngayPhat: '' };
          const find = (tests: ((k: string) => boolean)[]) =>
            Object.keys(row).find(k => tests.some(t => t(k.toLowerCase())));
          const mssvKey = find([k => k.includes('mssv'), k => k.includes('mã số'), k => k.includes('ma so')]);
          const hoTenKey = find([k => k.includes('họ'), k => k.includes('tên'), k => k.includes('ten'), k => k.includes('name'), k => k === 'hoten', k => k === 'ho ten']);
          const diaChiKey = find([k => k.includes('địa chỉ'), k => k.includes('dia chi'), k => k.includes('address')]);
          const ngayPhatKey = find([k => k.includes('ngày phát'), k => k.includes('ngay phat'), k => k === 'ngayphat']);
          if (mssvKey) norm.mssv = String(row[mssvKey] || '').trim();
          if (hoTenKey) norm.hoTen = String(row[hoTenKey] || '').trim();
          if (diaChiKey) norm.diaChi = String(row[diaChiKey] || '').trim();
          if (ngayPhatKey) norm.ngayPhat = String(row[ngayPhatKey] || '').trim();
          Object.keys(row).forEach(k => {
            if (k !== mssvKey && k !== hoTenKey && k !== diaChiKey && k !== ngayPhatKey)
              norm[k] = String(row[k] || '').trim();
          });
          return norm;
        });
        const newFile: FileData = { id: Date.now().toString(), name: file.name, students: jsonData, uploadedAt: new Date().toLocaleString('vi-VN') };
        setFileList(p => [...p, newFile]);
        setActiveFileId(newFile.id);
        setSearchTerm(''); setSearchResult(null);
        toast.success(`Đã tải lên: ${file.name} (${jsonData.length} sinh viên)`);
      } catch (err) { toast.error('Lỗi đọc file: ' + (err as Error).message); }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const activeFile = fileList.find(f => f.id === activeFileId);
  const students = activeFile?.students ?? [];

  const filteredStudents = useMemo(() => {
    let list = students;
    if (statusFilter === 'issued') list = list.filter(s => !!s.ngayPhat);
    if (statusFilter === 'pending') list = list.filter(s => !s.ngayPhat);
    const q = searchTerm.toLowerCase().trim();
    if (q) list = list.filter(s => `${s.mssv} ${s.hoTen} ${s.diaChi ?? ''}`.toLowerCase().includes(q));
    return list;
  }, [students, searchTerm, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage]);

  const pageNumbers = useMemo(() => {
    if (totalPages <= 3) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 2) return [1, 2, 3];
    if (currentPage >= totalPages - 1) return [totalPages - 2, totalPages - 1, totalPages];
    return [currentPage - 1, currentPage, currentPage + 1];
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFileId, searchTerm, statusFilter]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const handleIssue = (mssv: string) => {
    const today = new Date().toLocaleDateString('vi-VN');
    setFileList(prev => prev.map(file => file.id !== activeFileId ? file : {
      ...file, students: file.students.map(s => s.mssv === mssv ? { ...s, ngayPhat: today } : s)
    }));
    if (searchResult?.mssv === mssv) setSearchResult(p => p ? { ...p, ngayPhat: today } : p);
    toast.success(`Đã phát chứng nhận cho ${mssv}`);
  };

  const handleExport = () => {
    if (!activeFile?.students.length) { toast.error('Không có dữ liệu để xuất'); return; }
    const ws = XLSX.utils.json_to_sheet(activeFile.students);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sinh viên');
    XLSX.writeFile(wb, `${activeFile.name.replace(/\.xlsx?$/, '')}_da_phat_${new Date().toISOString().slice(0,10)}.xlsx`);
    toast.success('Xuất file thành công');
  };

  const handleDeleteFile = (id: string) => {
    if (!window.confirm('Xác nhận xóa file này?')) return;
    const next = fileList.filter(f => f.id !== id);
    setFileList(next);
    if (activeFileId === id) setActiveFileId(next[0]?.id ?? null);
    toast.success('Đã xóa file');
  };

  return (
    <div style={{ fontFamily: "'IBM Plex Sans', 'Segoe UI', sans-serif" }} className="min-h-screen bg-[#f4f6f9] text-gray-800">

      <div className="w-full py-5 space-y-4">

        <div className="flex gap-2 flex-wrap justify-end">
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="hidden" />
          <Btn variant="secondary" onClick={() => setShowFileList(v => !v)}>
            📂 Danh sách tệp ({fileList.length})
          </Btn>
          <Btn variant="primary" onClick={() => fileInputRef.current?.click()}>
            <UploadIcon /> Tải danh sách Excel
          </Btn>
          {activeFile && (
            <Btn variant="secondary" onClick={handleExport}>
              <DownloadIcon /> Xuất Excel
            </Btn>
          )}
        </div>

        {/* ── FILE LIST ── */}
        {showFileList && fileList.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-[#1a3a5c] rounded-full inline-block" />
              <span className="text-sm font-semibold text-gray-700">Danh sách file đã tải ({fileList.length})</span>
            </div>
            <div className="divide-y divide-gray-50">
              {fileList.map(file => (
                <div key={file.id} onClick={() => { setActiveFileId(file.id); setSearchTerm(''); setShowFileList(false); }}
                  className={`flex items-center justify-between px-5 py-3.5 cursor-pointer transition-colors hover:bg-blue-50/50
                    ${activeFileId === file.id ? 'bg-blue-50 border-r-2 border-r-[#1a3a5c]' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${activeFileId === file.id ? 'bg-[#1a3a5c] text-white' : 'bg-gray-100 text-gray-500'}`}>
                      <FileIcon />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{file.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {file.students.length} sinh viên &nbsp;·&nbsp; Tải lên {file.uploadedAt}
                      </p>
                    </div>
                  </div>
                  <Btn variant="danger" size="sm"
                    onClick={e => { e.stopPropagation(); handleDeleteFile(file.id); }}>
                    <TrashIcon /> Xóa
                  </Btn>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Filter Zone ── */}
        {activeFile && (
          <div className="grid grid-cols-1 gap-4">

            {/* Filter card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-3">
              <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-blue-600 rounded-full inline-block" />
                Lọc &amp; Tìm kiếm danh sách
              </p>
              <div className="relative">
                <SearchIcon />
                <input
                  placeholder="Tìm theo MSSV, Họ tên, Địa chỉ..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all bg-gray-50"
                  style={{ paddingLeft: '2.2rem' }}
                />
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                  <SearchIcon />
                </div>
              </div>
              <div className="flex gap-1.5">
                {(['all','pending','issued'] as const).map(v => {
                  const labels = { all: 'Tất cả', pending: 'Chưa phát', issued: 'Đã phát' };
                  const active = statusFilter === v;
                  return (
                    <button key={v} onClick={() => setStatusFilter(v)}
                      className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all
                        ${active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
                      {labels[v]}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── TABLE ── */}
        {activeFile && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-blue-600 text-white">
                    {['#', 'MSSV', 'Họ và tên', 'Địa chỉ', 'Trạng thái', 'Ngày phát', 'Thao tác'].map(h => (
                      <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-16 text-center">
                        <div className="text-gray-300 text-4xl mb-3">🔍</div>
                        <p className="text-gray-400 font-medium">Không tìm thấy sinh viên nào</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedStudents.map((s, i) => {
                      const issued = !!s.ngayPhat;
                      const rowNo = (currentPage - 1) * pageSize + i + 1;
                      return (
                        <tr key={i}
                          className={`border-b border-gray-50 last:border-b-0 transition-colors hover:bg-blue-50/40
                            ${issued ? 'bg-emerald-50/30' : 'bg-white'}`}>
                          <td className="px-4 py-3 text-gray-400 text-xs font-mono">{rowNo}</td>
                          <td className="px-4 py-3 font-mono font-semibold text-blue-700 text-xs">{s.mssv}</td>
                          <td className="px-4 py-3 font-medium text-gray-800">{s.hoTen}</td>
                          <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{s.diaChi || '—'}</td>
                          <td className="px-4 py-3">
                            {issued ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">
                                <CheckIcon /> Đã phát
                              </span>
                            ) : (
                              <span className="inline-flex px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold border border-gray-200">
                                Chờ phát
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs font-mono">{s.ngayPhat || '—'}</td>
                          <td className="px-4 py-3">
                            {!issued && (
                              <Btn variant="primary" size="sm" onClick={() => handleIssue(s.mssv)}>
                                Phát
                              </Btn>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {filteredStudents.length > 0 && (
              <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
                <span>Hiển thị <strong className="text-gray-700">{filteredStudents.length}</strong> / {students.length} sinh viên</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="w-10 h-10 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Trang trước"
                  >
                    ‹
                  </button>
                  {pageNumbers.map((n) => (
                    <button
                      key={n}
                      onClick={() => setCurrentPage(n)}
                      className={`w-10 h-10 rounded-lg border text-sm font-semibold transition-colors ${
                        currentPage === n
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                      aria-label={`Trang ${n}`}
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="w-10 h-10 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Trang sau"
                  >
                    ›
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── EMPTY STATE ── */}
        {fileList.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-dashed border-gray-200 py-20 text-center">
            <div className="text-6xl mb-4">📂</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Chưa có dữ liệu</h3>
            <p className="text-gray-400 text-sm mb-5">Tải lên file Excel để bắt đầu quản lý phát chứng nhận</p>
            <Btn variant="primary" onClick={() => fileInputRef.current?.click()}>
              <UploadIcon /> Tải danh sách Excel lên
            </Btn>
          </div>
        )}
      </div>
    </div>
  );
}