export function generateShareLink(outputs: Record<string, any>, toolId: string): string {
  try {
    // Encode outputs as base64 in URL
    const encoded = btoa(JSON.stringify({ toolId, outputs, timestamp: Date.now() }))
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    return `${baseUrl}/share/${encoded}`
  } catch (err) {
    console.error('Failed to generate share link:', err)
    return ''
  }
}

export function decodeShareLink(encoded: string): { toolId: string; outputs: Record<string, any> } | null {
  try {
    const decoded = JSON.parse(atob(encoded))
    return {
      toolId: decoded.toolId,
      outputs: decoded.outputs,
    }
  } catch (err) {
    console.error('Failed to decode share link:', err)
    return null
  }
}

export async function copyShareLink(outputs: Record<string, any>, toolId: string): Promise<boolean> {
  try {
    const link = generateShareLink(outputs, toolId)
    if (!link) return false
    
    await navigator.clipboard.writeText(link)
    return true
  } catch (err) {
    console.error('Failed to copy share link:', err)
    return false
  }
}
