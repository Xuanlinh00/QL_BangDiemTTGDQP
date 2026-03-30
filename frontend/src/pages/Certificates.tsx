import { useState, useMemo, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import Button from '../components/Common/Button';
import Input from '../components/Common/Input';
import Select from '../components/Common/Select';

interface StudentWithDate {
  mssv: string;
  hoTen: string;
  diaChi?: string;
  ngayPhat?: string;
  [key: string]: string | undefined;
}

interface FileData {
  id: string;
  name: string;
  students: StudentWithDate[];
  uploadedAt: string;
}

export default function CertificateIssuance() {
  const [fileList, setFileList] = useState<FileData[]>(() => {
    // Load from localStorage on init
    const saved = localStorage.getItem('certificateFileList');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeFileId, setActiveFileId] = useState<string | null>(() => {
    const saved = localStorage.getItem('certificateActiveFileId');
    return saved || null;
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'issued' | 'pending'>('all');
  const [searchMSSV, setSearchMSSV] = useState('');
  const [searchResult, setSearchResult] = useState<StudentWithDate | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Save to localStorage whenever fileList changes
  useEffect(() => {
    localStorage.setItem('certificateFileList', JSON.stringify(fileList));
  }, [fileList]);

  // Save to localStorage whenever activeFileId changes
  useEffect(() => {
    if (activeFileId) {
      localStorage.setItem('certificateActiveFileId', activeFileId);
    }
  }, [activeFileId]);

  // ── Upload Excel ──────────────────────────────────────────────────
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawData = XLSX.utils.sheet_to_json(worksheet) as Record<string, any>[];

        console.log('📊 Raw Excel data (first row):', rawData[0]);
        console.log('📊 All column names:', rawData[0] ? Object.keys(rawData[0]) : []);

        // Normalize column names - map various possible column names to standard fields
        const jsonData: StudentWithDate[] = rawData.map((row) => {
          const normalized: StudentWithDate = {
            mssv: '',
            hoTen: '',
            diaChi: '',
            ngayPhat: '',
          };

          // Find MSSV field (case insensitive)
          const mssvKey = Object.keys(row).find(k => 
            k.toLowerCase().includes('mssv') || 
            k.toLowerCase().includes('mã số') ||
            k.toLowerCase().includes('ma so')
          );
          if (mssvKey) normalized.mssv = String(row[mssvKey] || '').trim();

          // Find Họ tên field - more flexible matching
          const hoTenKey = Object.keys(row).find(k => {
            const lower = k.toLowerCase();
            return lower.includes('họ') || 
                   lower.includes('tên') || 
                   lower.includes('ten') ||
                   lower.includes('ho') ||
                   lower.includes('name') ||
                   lower === 'hoten' ||
                   lower === 'họ tên' ||
                   lower === 'ho ten';
          });
          if (hoTenKey) normalized.hoTen = String(row[hoTenKey] || '').trim();

          // Find Địa chỉ field
          const diaChiKey = Object.keys(row).find(k => {
            const lower = k.toLowerCase();
            return lower.includes('địa chỉ') || 
                   lower.includes('dia chi') ||
                   lower.includes('address') ||
                   lower === 'diachi';
          });
          if (diaChiKey) normalized.diaChi = String(row[diaChiKey] || '').trim();

          // Find Ngày phát field
          const ngayPhatKey = Object.keys(row).find(k => {
            const lower = k.toLowerCase();
            return lower.includes('ngày phát') || 
                   lower.includes('ngay phat') ||
                   lower === 'ngayphat';
          });
          if (ngayPhatKey) normalized.ngayPhat = String(row[ngayPhatKey] || '').trim();

          // Keep all other fields
          Object.keys(row).forEach(key => {
            if (key !== mssvKey && key !== hoTenKey && key !== diaChiKey && key !== ngayPhatKey) {
              normalized[key] = String(row[key] || '').trim();
            }
          });

          return normalized;
        });

        console.log('✅ Normalized data (first row):', jsonData[0]);

        const newFile: FileData = {
          id: Date.now().toString(),
          name: file.name,
          students: jsonData,
          uploadedAt: new Date().toLocaleString('vi-VN'),
        };

        setFileList((prev) => [...prev, newFile]);
        setActiveFileId(newFile.id);
        setSearchTerm('');
        setSearchResult(null);
        toast.success(`Đã tải lên: ${file.name} (${jsonData.length} sinh viên)`);
      } catch (error) {
        toast.error('Lỗi khi đọc file Excel: ' + (error as Error).message);
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const activeFile = fileList.find((f) => f.id === activeFileId);
  const students = activeFile?.students ?? [];

  // ── Filter ────────────────────────────────────────────────────────
  const filteredStudents = useMemo(() => {
    let list = students;

    if (statusFilter === 'issued') list = list.filter((s) => !!s.ngayPhat);
    if (statusFilter === 'pending') list = list.filter((s) => !s.ngayPhat);

    const q = searchTerm.toLowerCase().trim();
    if (q) {
      list = list.filter((s) =>
        `${s.mssv} ${s.hoTen} ${s.diaChi ?? ''}`.toLowerCase().includes(q)
      );
    }
    return list;
  }, [students, searchTerm, statusFilter]);

  // ── Issue certificate for single student ─────────────────────────
  const handleIssueSingleCertificate = (mssv: string) => {
    const today = new Date().toLocaleDateString('vi-VN');

    setFileList((prev) =>
      prev.map((file) =>
        file.id !== activeFileId
          ? file
          : {
              ...file,
              students: file.students.map((s) =>
                s.mssv === mssv ? { ...s, ngayPhat: today } : s
              ),
            }
      )
    );
    
    // Update search result if it's the same student
    if (searchResult && searchResult.mssv === mssv) {
      setSearchResult({ ...searchResult, ngayPhat: today });
    }
    
    toast.success(`Đã phát chứng nhận cho sinh viên ${mssv}`);
  };

  // ── Search student by MSSV ────────────────────────────────────────
  const handleSearch = () => {
    if (!searchMSSV.trim()) {
      toast.error('Vui lòng nhập MSSV');
      return;
    }

    const student = students.find(
      (s) => s.mssv.toLowerCase() === searchMSSV.trim().toLowerCase()
    );

    if (student) {
      setSearchResult(student);
      toast.success('Tìm thấy sinh viên');
    } else {
      setSearchResult(null);
      toast.error('Không tìm thấy sinh viên với MSSV này');
    }
  };

  // ── Issue certificate from search result ──────────────────────────
  const handleIssue = () => {
    if (searchResult) {
      handleIssueSingleCertificate(searchResult.mssv);
    }
  };

  // ── Export ────────────────────────────────────────────────────────
  const handleExport = () => {
    if (!activeFile || activeFile.students.length === 0) {
      toast.error('Không có dữ liệu để xuất');
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(activeFile.students);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sinh viên');
    const exportFileName = `${activeFile.name.replace(/\.xlsx?$/, '')}_da_phat_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, exportFileName);
    toast.success('Xuất file Excel thành công');
  };

  // ── Delete file ───────────────────────────────────────────────────
  const handleDeleteFile = (fileId: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa file này?')) return;
    const newList = fileList.filter((f) => f.id !== fileId);
    setFileList(newList);
    if (activeFileId === fileId) {
      setActiveFileId(newList[0]?.id ?? null);
    }
    toast.success('Đã xóa file');
  };

  const columns = [
    { key: 'mssv', label: 'MSSV', width: '15%' },
    { key: 'hoTen', label: 'Họ và tên', width: '25%' },
    { key: 'diaChi', label: 'Địa chỉ', width: '30%' },
    { key: 'status', label: 'Trạng thái', width: '15%' },
    { key: 'ngayPhat', label: 'Ngày phát', width: '15%' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* ── Header ── */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Phát Chứng Nhận
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Quản lý phát chứng nhận cho sinh viên theo file Excel
          </p>
        </div>

        <div className="flex gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            variant="primary"
            className="flex items-center gap-2"
            onClick={() => fileInputRef.current?.click()}
          >
            📤 Tải danh sách Excel lên
          </Button>

          {activeFile && (
            <Button
              onClick={handleExport}
              variant="secondary"
              className="flex items-center gap-2"
            >
              📥 Xuất Excel (Đã cập nhật ngày phát)
            </Button>
          )}
        </div>
      </div>

      {/* ── Danh sách file đã tải ── */}
      {fileList.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow overflow-hidden">
          <div className="px-6 py-4 border-b dark:border-slate-700 font-medium text-gray-700 dark:text-gray-300">
            Danh sách file đã tải lên
          </div>
          <div className="divide-y dark:divide-slate-700">
            {fileList.map((file) => (
              <div
                key={file.id}
                onClick={() => {
                  setActiveFileId(file.id);
                  setSearchTerm('');
                }}
                className={`flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/70 transition-colors ${
                  activeFileId === file.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              >
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{file.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {file.students.length} sinh viên • Tải lên: {file.uploadedAt}
                  </p>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteFile(file.id);
                  }}
                >
                  Xóa
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Bộ lọc ── */}
      {activeFile && (
        <div className="flex gap-4 flex-wrap">
          <Input
            placeholder="Tìm kiếm theo MSSV, Họ tên, Địa chỉ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-[280px]"
          />
          <Select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as 'all' | 'issued' | 'pending')
            }
            options={[
              { value: 'all', label: 'Tất cả trạng thái' },
              { value: 'pending', label: 'Chưa phát' },
              { value: 'issued', label: 'Đã phát' },
            ]}
          />
        </div>
      )}

      {/* ── Tra cứu sinh viên ── */}
      {activeFile && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
            Tra cứu sinh viên
          </h2>
          <div className="flex gap-3">
            <Input
              placeholder="Nhập MSSV..."
              value={searchMSSV}
              onChange={(e) => setSearchMSSV(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} variant="primary">
              🔍 Tìm kiếm
            </Button>
          </div>
        </div>
      )}

      {/* ── Kết quả tìm kiếm ── */}
      {searchResult && activeFile && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-6 text-gray-800 dark:text-white">
            Thông tin sinh viên
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {Object.entries(searchResult)
              .filter(([key]) => ['mssv', 'hoTen', 'diaChi', 'ngayPhat'].includes(key))
              .map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase">
                    {key === 'mssv'
                      ? 'MSSV'
                      : key === 'hoTen'
                      ? 'Họ và tên'
                      : key === 'diaChi'
                      ? 'Địa chỉ'
                      : key === 'ngayPhat'
                      ? 'Ngày phát chứng nhận'
                      : key}
                  </label>
                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                    {value || '—'}
                  </p>
                </div>
              ))}
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleIssue}
              disabled={!!searchResult.ngayPhat}
              variant={searchResult.ngayPhat ? 'secondary' : 'success'}
            >
              {searchResult.ngayPhat ? '✓ Đã phát chứng nhận' : '✓ Phát chứng nhận'}
            </Button>
            {searchResult.ngayPhat && (
              <div className="px-4 py-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg font-medium flex items-center">
                Ngày phát: {searchResult.ngayPhat}
              </div>
            )}
          </div>
        </div>
      )}
      {/* ── Bảng sinh viên ── */}
      {activeFile && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-full divide-y divide-gray-200 dark:divide-slate-700">
              <thead className="bg-gray-50 dark:bg-slate-700">
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      style={{ width: col.width }}
                      className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300"
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      Không tìm thấy sinh viên nào
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student, idx) => {
                    const isIssued = !!student.ngayPhat;

                    return (
                      <tr
                        key={idx}
                        className={`hover:bg-gray-50 dark:hover:bg-slate-700/70 transition-colors ${
                          isIssued ? 'bg-green-50 dark:bg-green-900/10' : ''
                        }`}
                      >
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                          {student.mssv}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          {student.hoTen}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {student.diaChi || '—'}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {isIssued ? (
                            <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                              Đã phát
                            </span>
                          ) : (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleIssueSingleCertificate(student.mssv)}
                              className="text-xs"
                            >
                              Phát
                            </Button>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {student.ngayPhat || '—'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {filteredStudents.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 dark:bg-slate-700 text-sm text-gray-500 flex justify-between">
              <span>
                Hiển thị {filteredStudents.length} / {students.length} sinh viên
              </span>
              <span>
                Đã phát: {students.filter((s) => s.ngayPhat).length} •{' '}
                Chưa phát: {students.filter((s) => !s.ngayPhat).length}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Empty state ── */}
      {fileList.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          Chưa có file Excel nào được tải lên.
          <br />
          Vui lòng nhấn nút <strong>"Tải danh sách Excel lên"</strong> để bắt đầu.
        </div>
      )}
    </div>
  );
}
