import React, { useEffect, useState } from 'react';
import {
  Check,
  Cloud,
  Copy,
  Download,
  FileArchive,
  Server,
  Terminal,
} from 'lucide-react';

export const ServerDeployPanel: React.FC = () => {
  const [fileCount, setFileCount] = useState<number | null>(null);
  const [filesPreview, setFilesPreview] = useState<string[]>([]);
  const [downloading, setDownloading] = useState(false);
  const [downloadErr, setDownloadErr] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/export/manifest')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.ok) {
          setFileCount(data.count);
          if (Array.isArray(data.files)) {
            setFilesPreview(data.files);
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiedId(id);
    window.setTimeout(() => setCopiedId(null), 1800);
  };

  const handleDownloadZip = async () => {
    setDownloading(true);
    setDownloadErr(null);
    try {
      const res = await fetch('/api/export/source.zip');
      if (!res.ok) throw new Error('ดาวน์โหลดแพ็กเกจซอร์สโค้ดไม่สำเร็จ');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ao-signal-studio-server.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setDownloadErr(err?.message || 'ดาวน์โหลดไม่สำเร็จ');
    } finally {
      setDownloading(false);
    }
  };

  const runCommands = `npm install
cp .env.example .env
npm run build
NODE_ENV=production npm start`;

  const envTemplate = `NODE_ENV=production
PORT=3000
TELEGRAM_BOT_TOKEN=ใส่_Bot_Token_จาก_BotFather
TELEGRAM_CHAT_ID=ใส่_Chat_ID_ตัวเลขของคุณ
TELEGRAM_MODE=always`;

  return (
    <section className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
      {/* Left: One-click ZIP Download & Run Commands */}
      <div className="lg:col-span-7 space-y-5 rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <FileArchive className="h-5 w-5 text-blue-600" />
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                ดาวน์โหลดซอร์สโค้ดขึ้น Server จริง
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                แพ็กเกจเต็มพร้อมไฟล์ server.ts, หน้าเว็บ React, Dockerfile และ render.yaml
              </p>
            </div>
          </div>
          {fileCount !== null && (
            <span className="font-mono text-xs text-slate-500 tabular-nums">
              {fileCount} ไฟล์
            </span>
          )}
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4 space-y-3">
          <p className="text-xs text-slate-700 leading-relaxed">
            ไฟล์ <strong>.zip</strong> นี้ตัดข้อมูลชั่วคราว (<code>node_modules</code>,{' '}
            <code>.data</code>, และ secret ส่วนตัว) ออกเรียบร้อยแล้ว สามารถแตกไฟล์ไปติดตั้งบน{' '}
            <strong>Render, Railway, Fly.io, Docker</strong> หรือ <strong>VPS</strong> ได้ทันที
          </p>
          <button
            type="button"
            disabled={downloading}
            onClick={() => void handleDownloadZip()}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            {downloading
              ? 'กำลังเตรียมไฟล์ .zip...'
              : 'ดาวน์โหลดโค้ดทั้งหมด (ao-signal-studio-server.zip)'}
          </button>
          {downloadErr && (
            <p className="text-xs text-rose-700">{downloadErr}</p>
          )}
        </div>

        {/* Commands to Run on Any Server */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
              <Terminal className="h-3.5 w-3.5 text-slate-500" />
              <span>คำสั่งติดตั้งและรันจริง (Node.js 22+)</span>
            </div>
            <button
              type="button"
              onClick={() => void handleCopy('cmds', runCommands)}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
            >
              {copiedId === 'cmds' ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  คัดลอกแล้ว
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  คัดลอกคำสั่ง
                </>
              )}
            </button>
          </div>
          <pre className="overflow-x-auto rounded-lg bg-slate-900 p-3.5 font-mono text-xs text-slate-100 leading-relaxed">
            {runCommands}
          </pre>
          <p className="text-[11px] text-slate-500">
            หมายเหตุ: หากเซิร์ฟเวอร์ใช้ Node 18 หรือ 20 ให้รันด้วย{' '}
            <code className="font-mono text-slate-700">
              NODE_ENV=production npx tsx server.ts
            </code>
          </p>
        </div>

        {/* .env Template */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-800">
              ค่า Environment Variables (.env) เพื่อให้แจ้งเตือนไม่หลุดเมื่อรีสตาร์ท
            </span>
            <button
              type="button"
              onClick={() => void handleCopy('env', envTemplate)}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
            >
              {copiedId === 'env' ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  คัดลอกแล้ว
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  คัดลอก .env
                </>
              )}
            </button>
          </div>
          <pre className="overflow-x-auto rounded-lg bg-slate-900 p-3.5 font-mono text-xs text-emerald-300 leading-relaxed">
            {envTemplate}
          </pre>
        </div>
      </div>

      {/* Right: Free 24/7 Cloud Hosting Guide + File List */}
      <div className="lg:col-span-5 space-y-5">
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Cloud className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-slate-900">
              วิธีนำไปรันฟรี 24 ชม. บน Render / Railway
            </h3>
          </div>
          <ol className="space-y-2 text-xs text-slate-600 list-decimal list-inside leading-relaxed">
            <li>
              แตกไฟล์ <strong>ao-signal-studio-server.zip</strong> แล้วอัปโหลดขึ้น{' '}
              <strong>GitHub</strong> (ตั้งเป็น Private repo ได้)
            </li>
            <li>
              ไปที่ <strong>Render.com</strong> → New Web Service → เชื่อม repo นี้ (ระบบจะอ่านไฟล์{' '}
              <code className="font-mono text-slate-800">render.yaml</code> ให้อัตโนมัติ)
            </li>
            <li>
              ใส่ค่า <code className="font-mono text-slate-800">TELEGRAM_BOT_TOKEN</code> และ{' '}
              <code className="font-mono text-slate-800">TELEGRAM_CHAT_ID</code> ใน{' '}
              <strong>Environment Variables</strong>
            </li>
            <li>
              ตั้ง <strong>UptimeRobot</strong> (ฟรี) ให้เรียก{' '}
              <code className="font-mono text-slate-800">https://โดเมนของคุณ/api/health</code>{' '}
              ทุก 5 นาที เพื่อกัน Render Free Tier หลับ ระบบจะได้เฝ้า M5 และส่งเข้า Telegram ตลอด 24 ชม.
            </li>
          </ol>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-slate-600" />
              <h3 className="text-sm font-semibold text-slate-900">
                ไฟล์ที่รวมอยู่ในแพ็กเกจ
              </h3>
            </div>
            <span className="font-mono text-xs text-slate-400">
              {filesPreview.length} รายการ
            </span>
          </div>
          {filesPreview.length > 0 ? (
            <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-100 bg-slate-50 p-3 font-mono text-[11px] text-slate-700 space-y-1">
              {filesPreview.map((file) => (
                <div key={file}>{file}</div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400">กำลังโหลดรายการไฟล์...</p>
          )}
        </div>
      </div>
    </section>
  );
};
