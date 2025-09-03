export const getPhotoUrl = (photo: any, maxWidth: number = 400, apiKey?: string): string => {
  if (!photo || !photo.name) return ''
  try {
    const key = apiKey ?? (import.meta as any).env?.VITE_GOOGLE_PLACES_API_KEY ?? ''
    return `https://places.googleapis.com/v1/${photo.name}/media?key=${key}&maxWidthPx=${maxWidth}`
  } catch (error) {
    console.error('Error getting photo URL:', error)
    return ''
  }
}



