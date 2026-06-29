export const MAX_UPLOAD_SIZE = 20 * 1024 * 1024

export const DOCUMENT_UPLOAD_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "text/plain",
]

export const IMAGE_UPLOAD_TYPES = ["image/jpeg", "image/png", "image/webp"]

export function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function fileValidationError(file: File, allowedTypes = DOCUMENT_UPLOAD_TYPES, maxSize = MAX_UPLOAD_SIZE) {
  if (!allowedTypes.includes(file.type)) {
    return `${file.name}: unsupported file type.`
  }
  if (file.size > maxSize) {
    return `${file.name}: file is too large. Max ${formatFileSize(maxSize)}.`
  }
  return ""
}

export function splitValidFiles(files: File[], allowedTypes = DOCUMENT_UPLOAD_TYPES, maxSize = MAX_UPLOAD_SIZE) {
  const accepted: File[] = []
  const rejected: string[] = []

  files.forEach((file) => {
    const error = fileValidationError(file, allowedTypes, maxSize)
    if (error) rejected.push(error)
    else accepted.push(file)
  })

  return { accepted, rejected }
}
