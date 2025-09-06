// Bulletproof navigation utilities
export const forceNavigate = (path: string) => {
  console.log(`Force navigating to: ${path}`)
  
  // Clear any potential state issues
  if (typeof window !== 'undefined') {
    // Clear any cached data that might interfere
    localStorage.removeItem('navigation-state')
    sessionStorage.clear()
    
    // Force a hard navigation
    window.location.href = path
  }
}

// Reset page state on navigation
export const resetPageState = () => {
  if (typeof window !== 'undefined') {
    // Clear any potential state conflicts
    localStorage.removeItem('navigation-state')
    sessionStorage.clear()
    
    // Reset any global state
    document.body.style.overflow = 'unset'
    
    // Force a re-render by dispatching a custom event
    window.dispatchEvent(new Event('navigation-reset'))
  }
}
