import { useState, useCallback, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'

export interface GoogleDriveFile {
  id: string
  name: string
  mimeType: string
  createdTime: string
  modifiedTime?: string
  size?: string
  webViewLink?: string
  parents?: string[]
}

export interface GoogleDriveFolder {
  id: string
  name: string
  path: string  // e.g. "Root / DA22 / DA22HH"
}

declare global {
  interface Window {
    gapi: any
    google: any
  }
}

function waitFor(
  conditionFn: () => boolean,
  timeoutMs = 10000,
  intervalMs = 100
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (conditionFn()) { resolve(); return }
    const start = Date.now()
    const timer = setInterval(() => {
      if (conditionFn()) { clearInterval(timer); resolve() }
      else if (Date.now() - start > timeoutMs) { clearInterval(timer); reject(new Error('Timeout')) }
    }, intervalMs)
  })
}

function ensureScript(src: string, globalCheck: () => boolean): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (globalCheck()) { resolve(); return }
    if (!document.querySelector(`script[src="${src}"]`)) {
      const script = document.createElement('script')
      script.src = src
      script.async = true
      script.defer = true
      script.onerror = () => reject(new Error(`Failed to load: ${src}`))
      document.head.appendChild(script)
    }
    waitFor(globalCheck, 15000, 150).then(resolve).catch(() => reject(new Error(`Timeout loading: ${src}`)))
  })
}

const SCOPES = 'https://www.googleapis.com/auth/drive.readonly'
const TOKEN_STORAGE_KEY = 'gdrive_access_token'
const TOKEN_EXPIRY_KEY  = 'gdrive_token_expiry'

const FOLDER_MIME = 'application/vnd.google-apps.folder'

export function useGoogleDrive() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [files, setFiles] = useState<GoogleDriveFile[]>([])
  const [folders, setFolders] = useState<GoogleDriveFolder[]>([])
  const [currentFolder, setCurrentFolder] = useState<GoogleDriveFolder | null>(null)
  const [folderPath, setFolderPath] = useState<GoogleDriveFolder[]>([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [allFilesCache, setAllFilesCache] = useState<GoogleDriveFile[]>([])

  const accessTokenRef = useRef<string | null>(null)
  const gapiInitedRef = useRef(false)
  const initPromiseRef = useRef<Promise<void> | null>(null)

  const clientId = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID
  const apiKey = (import.meta as any).env.VITE_GOOGLE_API_KEY
  const rootFolderId = (import.meta as any).env.VITE_GOOGLE_DRIVE_FOLDER_ID
  const redirectUri = (import.meta as any).env.VITE_GOOGLE_REDIRECT_URI
    || window.location.origin + '/google-auth-callback.html'

  // ── Helper: ensure GAPI drive is ready ──
  const ensureDriveReady = useCallback(async () => {
    // 1. If gapi script not yet loaded, wait for it
    if (!window.gapi) throw new Error('Google API script chưa tải')
    // 2. If gapi.client not initialised yet, do it now
    if (!gapiInitedRef.current) {
      if (!window.gapi.client) {
        await new Promise<void>((resolve, reject) =>
          window.gapi.load('client', { callback: resolve, onerror: reject })
        )
      }
      await window.gapi.client.init({
        apiKey,
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
      })
      gapiInitedRef.current = true
    }
    // 3. If drive discovery doc missing, load it again
    if (!window.gapi?.client?.drive) {
      await window.gapi.client.init({
        apiKey,
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
      })
    }
    // 4. Re-apply OAuth token
    if (accessTokenRef.current) {
      window.gapi.client.setToken({ access_token: accessTokenRef.current })
    }
    // 5. Final check
    if (!window.gapi?.client?.drive) {
      throw new Error('Google Drive API chưa sẵn sàng')
    }
  }, [apiKey])

  // ── Token handler ──
  const handleTokenReceived = useCallback(async (token: string, expiresIn?: string) => {
    accessTokenRef.current = token
    sessionStorage.setItem(TOKEN_STORAGE_KEY, token)
    if (expiresIn) {
      sessionStorage.setItem(TOKEN_EXPIRY_KEY, (Date.now() + parseInt(expiresIn) * 1000).toString())
    }
    if (window.gapi?.client) {
      window.gapi.client.setToken({ access_token: token })
    }
    setIsAuthenticated(true)
    setError(null)

    try {
      const res = await fetch('https://www.googleapis.com/drive/v3/about?fields=user',
        { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      const email = data?.user?.emailAddress
      if (email) { setUserEmail(email); toast.success(`Đã đăng nhập: ${email}`) }
      else { toast.success('Đã đăng nhập Google Drive') }
    } catch { toast.success('Đã đăng nhập Google Drive') }
  }, [])

  // ── Init GAPI ──
  const initGapiClient = useCallback(async () => {
    if (gapiInitedRef.current) return
    await new Promise<void>((resolve, reject) => {
      window.gapi.load('client', { callback: resolve, onerror: reject })
    })
    await window.gapi.client.init({
      apiKey,
      discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
    })
    gapiInitedRef.current = true
  }, [apiKey])

  const initGoogleAPI = useCallback(async () => {
    if (initPromiseRef.current) return initPromiseRef.current
    const doInit = async () => {
      try {
        await ensureScript('https://apis.google.com/js/api.js', () => !!window.gapi)
        if (!gapiInitedRef.current) await initGapiClient()
      } catch (err: any) {
        setError(`Lỗi tải Google API: ${err.message || err}`)
      }
    }
    initPromiseRef.current = doInit()
    return initPromiseRef.current
  }, [initGapiClient])

  // ── Sign in (redirect) ──
  const signInGoogle = useCallback(() => {
    sessionStorage.setItem('gdrive_return_url', window.location.href)
    const params = new URLSearchParams({
      client_id: clientId, redirect_uri: redirectUri,
      response_type: 'token', scope: SCOPES,
      prompt: 'consent', include_granted_scopes: 'true',
    })
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`
  }, [clientId, redirectUri])

  // ── Sign out ──
  const signOutGoogle = useCallback(async () => {
    const token = accessTokenRef.current
    if (token) {
      try { await fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, { method: 'POST' }) } catch {}
    }
    if (window.gapi?.client) window.gapi.client.setToken(null)
    accessTokenRef.current = null
    sessionStorage.removeItem(TOKEN_STORAGE_KEY)
    sessionStorage.removeItem(TOKEN_EXPIRY_KEY)
    setIsAuthenticated(false); setUserEmail(null)
    setFiles([]); setFolders([]); setAllFilesCache([])
    setCurrentFolder(null); setFolderPath([])
    toast.success('Đã đăng xuất')
  }, [])

  // ── Helper: list all items in a folder (single level) ──
  const listFolderContents = useCallback(async (folderId: string) => {
    await ensureDriveReady()
    const allItems: any[] = []
    let pageToken: string | undefined

    do {
      const resp = await window.gapi.client.drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        spaces: 'drive',
        fields: 'nextPageToken, files(id, name, mimeType, createdTime, modifiedTime, size, webViewLink, parents)',
        pageSize: 1000,
        orderBy: 'name',
        pageToken,
      })
      if (!resp.result) break
      allItems.push(...(resp.result.files || []))
      pageToken = resp.result.nextPageToken
    } while (pageToken)

    return allItems
  }, [ensureDriveReady])

  // ── Browse folder (list subfolders + files) ──
  const browseFolder = useCallback(async (folderId?: string, folderName?: string) => {
    if (!isAuthenticated) return
    setIsLoading(true); setError(null)

    try {
      const targetId = folderId || rootFolderId
      if (!targetId) {
        setError('Chưa cấu hình folder ID')
        return
      }

      const items = await listFolderContents(targetId)
      const subFolders = items.filter((f: any) => f.mimeType === FOLDER_MIME)
      const subFiles = items.filter((f: any) => f.mimeType !== FOLDER_MIME)

      // Build path
      const newFolder: GoogleDriveFolder = {
        id: targetId,
        name: folderName || 'Thư mục gốc',
        path: folderName || 'Thư mục gốc',
      }

      if (folderId && folderId !== rootFolderId) {
        // Navigating into subfolder
        setCurrentFolder(newFolder)
        setFolderPath(prev => {
          // Check if going back
          const idx = prev.findIndex(f => f.id === folderId)
          if (idx >= 0) return prev.slice(0, idx + 1)
          return [...prev, newFolder]
        })
      } else {
        // Root
        setCurrentFolder({ id: targetId, name: 'Thư mục gốc', path: 'Thư mục gốc' })
        setFolderPath([{ id: targetId, name: 'Thư mục gốc', path: 'Thư mục gốc' }])
      }

      setFolders(subFolders.map((f: any) => ({
        id: f.id, name: f.name, path: f.name,
      })))
      setFiles(subFiles)

      console.log(`[GDrive] Folder "${folderName || 'root'}": ${subFolders.length} folders, ${subFiles.length} files`)
    } catch (err: any) {
      console.error('[GDrive] Browse error:', err)
      setError(err.result?.error?.message || err.message || 'Lỗi duyệt thư mục')
      toast.error('Lỗi duyệt thư mục')
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, rootFolderId, listFolderContents])

  // ── Recursive search: find ALL files under a folder tree ──
  const searchFilesRecursive = useCallback(async (searchQuery: string) => {
    if (!isAuthenticated) return
    setIsLoading(true); setError(null)

    try {
      await ensureDriveReady()

      // Nếu chưa có cache, phải tìm trên toàn bộ Drive (trong root folder)
      // Sử dụng fullText contains để tìm kiếm sâu
      let query = `trashed=false and mimeType!='${FOLDER_MIME}'`
      if (searchQuery) {
        query += ` and name contains '${searchQuery.replace(/'/g, "\\'")}'`
      }

      const allItems: GoogleDriveFile[] = []
      let pageToken: string | undefined

      do {
        const resp = await window.gapi.client.drive.files.list({
          q: query,
          spaces: 'drive',
          fields: 'nextPageToken, files(id, name, mimeType, createdTime, modifiedTime, size, webViewLink, parents)',
          pageSize: 1000,
          orderBy: 'name',
          pageToken,
        })
        if (!resp.result) break
        allItems.push(...(resp.result.files || []))
        pageToken = resp.result.nextPageToken
      } while (pageToken)

      setFiles(allItems)
      setFolders([])
      console.log(`[GDrive] Search "${searchQuery}": ${allItems.length} files found`)

      if (allItems.length === 0) {
        toast('Không tìm thấy file', { icon: 'ℹ️' })
      }
    } catch (err: any) {
      console.error('[GDrive] Search error:', err)
      setError(err.result?.error?.message || err.message || 'Lỗi tìm kiếm')
      toast.error('Lỗi tìm kiếm')
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, ensureDriveReady])

  // ── Get file content as blob (for preview / download) ──
  const getFileBlob = useCallback(async (fileId: string): Promise<Blob | null> => {
    try {
      await ensureDriveReady()
      const resp = await window.gapi.client.drive.files.get({
        fileId, alt: 'media',
      })
      // gapi returns body as string, convert to blob
      const bytes = new Uint8Array(resp.body.length)
      for (let i = 0; i < resp.body.length; i++) {
        bytes[i] = resp.body.charCodeAt(i)
      }
      return new Blob([bytes])
    } catch (err: any) {
      console.error('[GDrive] Get file error:', err)
      toast.error('Lỗi tải file')
      return null
    }
  }, [ensureDriveReady])

  // ── Get file view URL (use webViewLink or generate embed URL) ──
  const getFileViewUrl = useCallback((file: GoogleDriveFile): string => {
    // Google Workspace files (Docs, Sheets, Slides) use different preview URLs
    if (file.mimeType?.startsWith('application/vnd.google-apps.')) {
      if (file.mimeType.includes('spreadsheet')) {
        return `https://docs.google.com/spreadsheets/d/${file.id}/preview`
      }
      if (file.mimeType.includes('document')) {
        return `https://docs.google.com/document/d/${file.id}/preview`
      }
      if (file.mimeType.includes('presentation')) {
        return `https://docs.google.com/presentation/d/${file.id}/preview`
      }
    }
    // PDF and other standard files
    return `https://drive.google.com/file/d/${file.id}/preview`
  }, [])

  // ── Download file ──
  const downloadFile = useCallback(async (fileId: string, fileName: string, mimeType?: string) => {
    try {
      const token = accessTokenRef.current
      if (!token) { toast.error('Chưa đăng nhập'); return }

      let url: string
      let finalName = fileName

      // Google Workspace files need export, not alt=media
      if (mimeType?.startsWith('application/vnd.google-apps.')) {
        let exportMime = 'application/pdf'
        if (mimeType.includes('spreadsheet')) {
          exportMime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          if (!finalName.match(/\.xlsx?$/i)) finalName += '.xlsx'
        } else if (mimeType.includes('document')) {
          exportMime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          if (!finalName.match(/\.docx?$/i)) finalName += '.docx'
        } else if (mimeType.includes('presentation')) {
          exportMime = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
          if (!finalName.match(/\.pptx?$/i)) finalName += '.pptx'
        } else {
          if (!finalName.match(/\.pdf$/i)) finalName += '.pdf'
        }
        url = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=${encodeURIComponent(exportMime)}`
      } else {
        url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`
      }

      const resp = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      const blob = await resp.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl; link.download = finalName
      document.body.appendChild(link); link.click(); document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)
      toast.success(`Đã tải: ${finalName}`)
    } catch (err: any) {
      toast.error(err.message || 'Lỗi tải file')
    }
  }, [])

  // ── Auto-init ──
  useEffect(() => { initGoogleAPI() }, [initGoogleAPI])

  // ── Restore token ──
  useEffect(() => {
    if (isAuthenticated) return
    const savedToken = sessionStorage.getItem(TOKEN_STORAGE_KEY)
    const savedExpiry = sessionStorage.getItem(TOKEN_EXPIRY_KEY)
    if (savedToken) {
      if (savedExpiry && Date.now() > parseInt(savedExpiry)) {
        sessionStorage.removeItem(TOKEN_STORAGE_KEY)
        sessionStorage.removeItem(TOKEN_EXPIRY_KEY)
        return
      }
      handleTokenReceived(savedToken)
    }
  }, [isAuthenticated, handleTokenReceived])

  return {
    isLoading, error, files, folders, currentFolder, folderPath,
    isAuthenticated, userEmail, allFilesCache,
    initGoogleAPI, signInGoogle, signOutGoogle,
    browseFolder, searchFilesRecursive,
    getFileBlob, getFileViewUrl, downloadFile,
  }
}
